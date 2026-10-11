-- 016: Staff, per-staff availability and staff-aware conflicts.
-- Append-only. Replaces the tenant-wide time_slots_config rule with real staff
-- schedules. Existing tenants and bookings are backfilled to one default staff member.

-- 1. Tenant timezone. Working hours and day boundaries are interpreted in this zone.
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Europe/Bratislava';

-- 2. Service buffers (minutes that stay blocked before and after the service).
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS buffer_before_minutes integer NOT NULL DEFAULT 0
    CHECK (buffer_before_minutes BETWEEN 0 AND 240),
  ADD COLUMN IF NOT EXISTS buffer_after_minutes integer NOT NULL DEFAULT 0
    CHECK (buffer_after_minutes BETWEEN 0 AND 240);

-- 3. Staff model.
CREATE TABLE IF NOT EXISTS public.staff (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 80),
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_staff_tenant ON public.staff (tenant_id);

CREATE TABLE IF NOT EXISTS public.service_staff (
  tenant_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  staff_id   uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, staff_id)
);
CREATE INDEX IF NOT EXISTS idx_service_staff_staff ON public.service_staff (staff_id);

-- Weekly working intervals. weekday uses ISO numbering: 1 = Monday ... 7 = Sunday.
CREATE TABLE IF NOT EXISTS public.staff_working_hours (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id   uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  weekday    smallint NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  start_time time NOT NULL,
  end_time   time NOT NULL,
  CHECK (start_time < end_time)
);
CREATE INDEX IF NOT EXISTS idx_staff_working_hours_staff ON public.staff_working_hours (staff_id, weekday);

-- Recurring weekly breaks inside working hours.
CREATE TABLE IF NOT EXISTS public.staff_breaks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id   uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  weekday    smallint NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  start_time time NOT NULL,
  end_time   time NOT NULL,
  CHECK (start_time < end_time)
);
CREATE INDEX IF NOT EXISTS idx_staff_breaks_staff ON public.staff_breaks (staff_id, weekday);

-- Absolute blocked periods: vacation, sick leave, internal blocks.
CREATE TABLE IF NOT EXISTS public.staff_time_off (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id  uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at   timestamptz NOT NULL,
  reason    text,
  CHECK (starts_at < ends_at)
);
CREATE INDEX IF NOT EXISTS idx_staff_time_off_staff ON public.staff_time_off (staff_id, starts_at);

-- Keep child rows in the same tenant as their staff member.
CREATE OR REPLACE FUNCTION public.enforce_staff_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_staff_tenant uuid;
  v_service_tenant uuid;
BEGIN
  SELECT tenant_id INTO v_staff_tenant FROM public.staff WHERE id = NEW.staff_id;
  IF v_staff_tenant IS DISTINCT FROM NEW.tenant_id THEN
    RAISE EXCEPTION 'Staff does not belong to tenant' USING ERRCODE = '42501';
  END IF;

  IF TG_TABLE_NAME = 'service_staff' THEN
    SELECT tenant_id INTO v_service_tenant FROM public.services WHERE id = NEW.service_id;
    IF v_service_tenant IS DISTINCT FROM NEW.tenant_id THEN
      RAISE EXCEPTION 'Service does not belong to tenant' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_service_staff_tenant BEFORE INSERT OR UPDATE ON public.service_staff
  FOR EACH ROW EXECUTE FUNCTION public.enforce_staff_tenant();
CREATE TRIGGER enforce_staff_working_hours_tenant BEFORE INSERT OR UPDATE ON public.staff_working_hours
  FOR EACH ROW EXECUTE FUNCTION public.enforce_staff_tenant();
CREATE TRIGGER enforce_staff_breaks_tenant BEFORE INSERT OR UPDATE ON public.staff_breaks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_staff_tenant();
CREATE TRIGGER enforce_staff_time_off_tenant BEFORE INSERT OR UPDATE ON public.staff_time_off
  FOR EACH ROW EXECUTE FUNCTION public.enforce_staff_tenant();

-- Every new tenant starts with one active staff member. Every new service is offered by all active staff.
CREATE OR REPLACE FUNCTION public.create_default_staff_for_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.staff (tenant_id, display_name) VALUES (NEW.id, 'Tím');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_service_to_active_staff()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.service_staff (tenant_id, service_id, staff_id)
  SELECT NEW.tenant_id, NEW.id, st.id
  FROM public.staff st
  WHERE st.tenant_id = NEW.tenant_id AND st.is_active = TRUE
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_default_staff AFTER INSERT ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.create_default_staff_for_tenant();
CREATE TRIGGER assign_new_service_to_staff AFTER INSERT ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.assign_service_to_active_staff();

-- 4. Bookings: assigned staff and the blocked range (service interval plus buffers).
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS staff_id uuid REFERENCES public.staff(id),
  ADD COLUMN IF NOT EXISTS blocked_start timestamptz,
  ADD COLUMN IF NOT EXISTS blocked_end timestamptz;

-- Backfill: one default staff member per existing tenant, every service assigned to it,
-- weekly hours copied from the old tenant-wide time_slots_config (applied to all days).
INSERT INTO public.staff (tenant_id, display_name)
SELECT t.id, 'Tím'
FROM public.tenants t
WHERE NOT EXISTS (SELECT 1 FROM public.staff s WHERE s.tenant_id = t.id);

INSERT INTO public.service_staff (tenant_id, service_id, staff_id)
SELECT sv.tenant_id, sv.id, st.id
FROM public.services sv
JOIN public.staff st ON st.tenant_id = sv.tenant_id
ON CONFLICT DO NOTHING;

INSERT INTO public.staff_working_hours (tenant_id, staff_id, weekday, start_time, end_time)
SELECT st.tenant_id, st.id, d.wd, tsc.start_time, tsc.end_time
FROM public.staff st
JOIN public.time_slots_config tsc ON tsc.tenant_id = st.tenant_id AND tsc.is_active = TRUE
CROSS JOIN generate_series(1, 7) AS d(wd)
WHERE NOT EXISTS (SELECT 1 FROM public.staff_working_hours wh WHERE wh.staff_id = st.id);

UPDATE public.bookings b
SET staff_id = st.id
FROM public.staff st
WHERE st.tenant_id = b.tenant_id
  AND b.staff_id IS NULL;

UPDATE public.bookings b
SET blocked_start = b.start_time - make_interval(mins => s.buffer_before_minutes),
    blocked_end = b.end_time + make_interval(mins => s.buffer_after_minutes)
FROM public.services s
WHERE s.id = b.service_id;

ALTER TABLE public.bookings
  ALTER COLUMN staff_id SET NOT NULL,
  ALTER COLUMN blocked_start SET NOT NULL,
  ALTER COLUMN blocked_end SET NOT NULL;

CREATE OR REPLACE FUNCTION public.prepare_booking_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_before integer;
  v_after integer;
BEGIN
  SELECT s.buffer_before_minutes, s.buffer_after_minutes INTO v_before, v_after
  FROM public.services s
  WHERE s.id = NEW.service_id;

  NEW.blocked_start := NEW.start_time - make_interval(mins => COALESCE(v_before, 0));
  NEW.blocked_end := NEW.end_time + make_interval(mins => COALESCE(v_after, 0));
  RETURN NEW;
END;
$$;

CREATE TRIGGER prepare_booking_row BEFORE INSERT OR UPDATE OF start_time, end_time, service_id, staff_id
  ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.prepare_booking_row();

-- Same staff member cannot have overlapping active blocked ranges.
-- Different staff members may book the same time.
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS no_overlapping_active_bookings;
ALTER TABLE public.bookings
  ADD CONSTRAINT no_overlapping_staff_bookings
  EXCLUDE USING gist (
    staff_id WITH =,
    tstzrange(blocked_start, blocked_end, '[)') WITH &&
  )
  WHERE (status <> 'cancelled');

-- 5. Authorization helpers. Admin-only mutation; members can read.
CREATE OR REPLACE FUNCTION public.is_tenant_admin(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.tenant_id = p_tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role = 'admin'
  );
$$;

-- 6. Availability. Local dates and times are converted with the tenant timezone, so DST
--    follows Postgres' zone rules. Candidates are generated every 15 minutes inside
--    working hours. A candidate is free when the service interval avoids breaks and time
--    off, and its blocked range (with buffers) avoids the staff member's other bookings.
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_tenant_id uuid,
  p_service_id uuid,
  p_date date,
  p_staff_id uuid DEFAULT NULL
)
RETURNS TABLE (staff_id uuid, start_time timestamptz, end_time timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tz text;
  v_duration integer;
  v_before integer;
  v_after integer;
  v_weekday integer;
BEGIN
  SELECT t.timezone INTO v_tz FROM public.tenants t WHERE t.id = p_tenant_id;

  SELECT s.duration, s.buffer_before_minutes, s.buffer_after_minutes
  INTO v_duration, v_before, v_after
  FROM public.services s
  WHERE s.id = p_service_id
    AND s.tenant_id = p_tenant_id
    AND s.is_active = TRUE;

  IF v_tz IS NULL OR v_duration IS NULL OR p_date IS NULL THEN
    RETURN;
  END IF;

  v_weekday := EXTRACT(ISODOW FROM p_date)::integer;

  RETURN QUERY
  WITH windows AS (
    SELECT wh.staff_id AS sid,
           ((p_date + wh.start_time) AT TIME ZONE v_tz) AS ws,
           ((p_date + wh.end_time) AT TIME ZONE v_tz) AS we
    FROM public.staff_working_hours wh
    JOIN public.staff st ON st.id = wh.staff_id AND st.is_active = TRUE
    JOIN public.service_staff ss ON ss.staff_id = st.id AND ss.service_id = p_service_id
    WHERE wh.tenant_id = p_tenant_id
      AND wh.weekday = v_weekday
      AND (p_staff_id IS NULL OR wh.staff_id = p_staff_id)
  ),
  candidates AS (
    SELECT w.sid, c.st AS cand_start, c.st + make_interval(mins => v_duration) AS cand_end
    FROM windows w
    CROSS JOIN LATERAL generate_series(w.ws, w.we - make_interval(mins => v_duration), interval '15 minutes') AS c(st)
  )
  SELECT c.sid, c.cand_start, c.cand_end
  FROM candidates c
  WHERE c.cand_start > now()
    AND NOT EXISTS (
      SELECT 1 FROM public.staff_breaks br
      WHERE br.staff_id = c.sid
        AND br.weekday = v_weekday
        AND ((p_date + br.start_time) AT TIME ZONE v_tz) < c.cand_end
        AND ((p_date + br.end_time) AT TIME ZONE v_tz) > c.cand_start
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.staff_time_off t
      WHERE t.staff_id = c.sid
        AND tstzrange(t.starts_at, t.ends_at, '[)') && tstzrange(c.cand_start, c.cand_end, '[)')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.staff_id = c.sid
        AND b.status <> 'cancelled'
        AND tstzrange(b.blocked_start, b.blocked_end, '[)')
            && tstzrange(c.cand_start - make_interval(mins => v_before),
                         c.cand_end + make_interval(mins => v_after), '[)')
    )
  ORDER BY c.cand_start, c.sid;
END;
$$;

-- 7. Booking creation. p_staff_id NULL means "anyone available": the first free staff
--    member in a stable order is taken, and each attempt is guarded by the EXCLUDE constraint.
CREATE OR REPLACE FUNCTION public.create_booking_with_staff(
  p_tenant_id uuid,
  p_service_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_staff_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tz text;
  v_duration integer;
  v_date date;
  v_candidate record;
  v_booking_id uuid;
  v_inserted boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_start_time >= p_end_time THEN
    RAISE EXCEPTION 'Invalid time range: start must be before end' USING ERRCODE = '23514';
  END IF;

  SELECT s.duration INTO v_duration
  FROM public.services s
  WHERE s.id = p_service_id AND s.tenant_id = p_tenant_id AND s.is_active = TRUE;

  IF v_duration IS NULL THEN
    RAISE EXCEPTION 'Service not found or inactive';
  END IF;

  IF (EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 60) <> v_duration THEN
    RAISE EXCEPTION 'Booking duration does not match service duration' USING ERRCODE = '23514';
  END IF;

  SELECT t.timezone INTO v_tz FROM public.tenants t WHERE t.id = p_tenant_id;
  v_date := (p_start_time AT TIME ZONE v_tz)::date;

  FOR v_candidate IN
    SELECT a.staff_id AS sid
    FROM public.get_available_slots(p_tenant_id, p_service_id, v_date, p_staff_id) a
    WHERE a.start_time = p_start_time
      AND a.end_time = p_end_time
    ORDER BY a.staff_id
  LOOP
    BEGIN
      INSERT INTO public.bookings (tenant_id, user_id, service_id, staff_id, start_time, end_time, status)
      VALUES (p_tenant_id, v_uid, p_service_id, v_candidate.sid, p_start_time, p_end_time, 'confirmed')
      RETURNING id INTO v_booking_id;
      v_inserted := true;
    EXCEPTION
      WHEN exclusion_violation THEN
        v_inserted := false;
    END;

    IF v_inserted THEN
      RETURN v_booking_id;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.tenant_id = p_tenant_id
      AND b.service_id = p_service_id
      AND b.status <> 'cancelled'
      AND p_start_time < b.end_time
      AND p_end_time > b.start_time
  ) THEN
    RAISE EXCEPTION 'Time slot already booked' USING ERRCODE = 'exclusion_violation';
  END IF;

  RAISE EXCEPTION 'Selected time slot is not available' USING ERRCODE = 'P0001';
END;
$$;

-- create_booking keeps its signature for existing callers and delegates to the staff-aware function.
CREATE OR REPLACE FUNCTION public.create_booking(
  p_tenant_id uuid,
  p_service_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN public.create_booking_with_staff(p_tenant_id, p_service_id, p_start_time, p_end_time, NULL);
END;
$$;

-- 8. Reschedule through a token, now checked against the assigned staff member's schedule.
CREATE OR REPLACE FUNCTION public.reschedule_booking_by_token(
  p_token_hash text,
  p_tenant_slug text,
  p_new_start timestamptz,
  p_new_token_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tk       public.booking_manage_tokens%ROWTYPE;
  v_b        public.bookings%ROWTYPE;
  v_duration integer;
  v_new_end  timestamptz;
  v_tz       text;
  v_date     date;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$'
     OR p_new_token_hash IS NULL OR p_new_token_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  SELECT tk.* INTO v_tk
  FROM public.booking_manage_tokens tk
  JOIN public.tenants t ON t.id = tk.tenant_id
  WHERE tk.token_hash = p_token_hash
    AND t.slug = p_tenant_slug
  FOR UPDATE OF tk;

  IF NOT FOUND OR v_tk.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  IF v_tk.expires_at <= now() THEN
    RETURN jsonb_build_object('status', 'expired');
  END IF;

  SELECT * INTO v_b FROM public.bookings WHERE id = v_tk.booking_id FOR UPDATE;

  IF v_b.status = 'cancelled' THEN
    RETURN jsonb_build_object('status', 'already_cancelled');
  END IF;

  IF v_b.status <> 'confirmed' THEN
    RETURN jsonb_build_object('status', 'not_editable');
  END IF;

  IF p_new_start <= now() THEN
    RETURN jsonb_build_object('status', 'in_past');
  END IF;

  SELECT s.duration INTO v_duration
  FROM public.services s
  WHERE s.id = v_b.service_id AND s.is_active = TRUE;

  IF v_duration IS NULL THEN
    RETURN jsonb_build_object('status', 'not_editable');
  END IF;

  SELECT t.timezone INTO v_tz FROM public.tenants t WHERE t.id = v_b.tenant_id;
  v_date := (p_new_start AT TIME ZONE v_tz)::date;
  v_new_end := p_new_start + make_interval(mins => v_duration);

  IF NOT EXISTS (
    SELECT 1 FROM public.get_available_slots(v_b.tenant_id, v_b.service_id, v_date, v_b.staff_id) a
    WHERE a.start_time = p_new_start AND a.end_time = v_new_end
  ) THEN
    -- Tell the customer whether the staff member is busy or simply not working then.
    IF EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.staff_id = v_b.staff_id
        AND b.id <> v_b.id
        AND b.status <> 'cancelled'
        AND tstzrange(b.blocked_start, b.blocked_end, '[)')
            && tstzrange(p_new_start, v_new_end, '[)')
    ) THEN
      RETURN jsonb_build_object('status', 'slot_taken');
    END IF;
    RETURN jsonb_build_object('status', 'outside_hours');
  END IF;

  BEGIN
    UPDATE public.bookings
    SET start_time = p_new_start,
        end_time = v_new_end
    WHERE id = v_b.id;
  EXCEPTION
    WHEN exclusion_violation THEN
      RETURN jsonb_build_object('status', 'slot_taken');
  END;

  UPDATE public.booking_manage_tokens SET revoked_at = now() WHERE id = v_tk.id;

  INSERT INTO public.booking_manage_tokens (booking_id, tenant_id, token_hash, expires_at)
  VALUES (v_b.id, v_b.tenant_id, p_new_token_hash, v_new_end + interval '1 day');

  INSERT INTO public.booking_audit_events (tenant_id, booking_id, actor, action, details)
  VALUES (v_b.tenant_id, v_b.id, 'client_token', 'rescheduled', jsonb_build_object(
    'fromStart', v_b.start_time,
    'fromEnd', v_b.end_time,
    'toStart', p_new_start,
    'toEnd', v_new_end,
    'tokenRotated', true
  ));

  RETURN jsonb_build_object('status', 'ok', 'startTime', p_new_start, 'endTime', v_new_end);
END;
$$;

-- 9. Public lists: bookable staff for a service. Only names and ids, no contact data.
CREATE OR REPLACE FUNCTION public.list_bookable_staff(p_tenant_id uuid, p_service_id uuid)
RETURNS TABLE (id uuid, display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT st.id, st.display_name
  FROM public.staff st
  JOIN public.service_staff ss ON ss.staff_id = st.id AND ss.service_id = p_service_id
  JOIN public.services sv ON sv.id = ss.service_id AND sv.tenant_id = p_tenant_id AND sv.is_active = TRUE
  WHERE st.tenant_id = p_tenant_id
    AND st.is_active = TRUE
  ORDER BY st.display_name, st.id;
$$;

-- 10. Row-level security. Members read, admins write. Clients use RPCs for public data.
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_time_off ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read staff" ON public.staff FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY "Admins manage staff" ON public.staff FOR ALL TO authenticated
  USING (public.is_tenant_admin(tenant_id)) WITH CHECK (public.is_tenant_admin(tenant_id));

CREATE POLICY "Members read service staff" ON public.service_staff FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY "Admins manage service staff" ON public.service_staff FOR ALL TO authenticated
  USING (public.is_tenant_admin(tenant_id)) WITH CHECK (public.is_tenant_admin(tenant_id));

CREATE POLICY "Members read working hours" ON public.staff_working_hours FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY "Admins manage working hours" ON public.staff_working_hours FOR ALL TO authenticated
  USING (public.is_tenant_admin(tenant_id)) WITH CHECK (public.is_tenant_admin(tenant_id));

CREATE POLICY "Members read breaks" ON public.staff_breaks FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY "Admins manage breaks" ON public.staff_breaks FOR ALL TO authenticated
  USING (public.is_tenant_admin(tenant_id)) WITH CHECK (public.is_tenant_admin(tenant_id));

CREATE POLICY "Members read time off" ON public.staff_time_off FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY "Admins manage time off" ON public.staff_time_off FOR ALL TO authenticated
  USING (public.is_tenant_admin(tenant_id)) WITH CHECK (public.is_tenant_admin(tenant_id));

REVOKE ALL ON public.staff, public.service_staff, public.staff_working_hours,
  public.staff_breaks, public.staff_time_off FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff, public.service_staff, public.staff_working_hours,
  public.staff_breaks, public.staff_time_off TO authenticated;

-- 11. Function privileges. Trigger functions are not callable from clients.
REVOKE EXECUTE ON FUNCTION public.enforce_staff_tenant() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_default_staff_for_tenant() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_service_to_active_staff() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prepare_booking_row() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.is_tenant_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_available_slots(uuid, uuid, date, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_available_slots(uuid, uuid, date, uuid) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.create_booking_with_staff(uuid, uuid, timestamptz, timestamptz, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_booking_with_staff(uuid, uuid, timestamptz, timestamptz, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_booking(uuid, uuid, timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_booking(uuid, uuid, timestamptz, timestamptz) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.reschedule_booking_by_token(text, text, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reschedule_booking_by_token(text, text, timestamptz, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.list_bookable_staff(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_bookable_staff(uuid, uuid) TO anon, authenticated;
