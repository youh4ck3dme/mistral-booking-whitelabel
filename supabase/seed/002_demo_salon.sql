-- Demo tenant "Salón Aurora (demo)" — hair & beauty salon.
--
-- LOCAL AND PREVIEW DATABASES ONLY. This is a seed, not a migration:
-- it lives outside supabase/migrations so `supabase db push` never applies it.
--
-- Safety:
--   * Refuses to run unless the session opts in with nexify.allow_demo_seed=on:
--       PGOPTIONS='-c nexify.allow_demo_seed=on' psql "$LOCAL_DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed/002_demo_salon.sql
--   * Idempotent: fixed UUIDs + ON CONFLICT upserts; re-running converges to the same state.
--   * Tenant-isolated: every write is keyed to the demo tenant id below; the only
--     UPDATE/DELETE statements are filtered by that tenant id.
--   * Fails closed if the slug 'demo-salon' already belongs to another tenant
--     (unique violation on tenants.slug).
--   * Creates no bookings and no users.

BEGIN;

DO $$
BEGIN
  IF coalesce(current_setting('nexify.allow_demo_seed', true), '') <> 'on' THEN
    RAISE EXCEPTION 'Demo seed refused: set nexify.allow_demo_seed=on (local/preview databases only)';
  END IF;
END
$$;

-- Tenant. On first insert, trigger create_default_staff adds a generic staff member "Tím".
INSERT INTO public.tenants (id, name, slug, locale, timezone) VALUES
  ('de000000-0000-4000-8000-000000000001', 'Salón Aurora (demo)', 'demo-salon', 'sk', 'Europe/Bratislava')
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, slug = EXCLUDED.slug, locale = EXCLUDED.locale, timezone = EXCLUDED.timezone;

INSERT INTO public.tenant_branding (id, tenant_id, logo_url, primary_color) VALUES
  ('de000000-0000-4000-8000-000000000101', 'de000000-0000-4000-8000-000000000001', NULL, '#C2410C')
ON CONFLICT (id) DO UPDATE
  SET tenant_id = EXCLUDED.tenant_id, logo_url = EXCLUDED.logo_url, primary_color = EXCLUDED.primary_color;

INSERT INTO public.time_slots_config (id, tenant_id, start_time, end_time, is_active) VALUES
  ('de000000-0000-4000-8000-000000000201', 'de000000-0000-4000-8000-000000000001', '09:00', '19:00', true)
ON CONFLICT (id) DO UPDATE
  SET tenant_id = EXCLUDED.tenant_id, start_time = EXCLUDED.start_time,
      end_time = EXCLUDED.end_time, is_active = EXCLUDED.is_active;

-- Staff with fixed ids.
INSERT INTO public.staff (id, tenant_id, display_name, is_active) VALUES
  ('de000000-0000-4000-8000-000000000301', 'de000000-0000-4000-8000-000000000001', 'Lucia — kaderníčka', true),
  ('de000000-0000-4000-8000-000000000302', 'de000000-0000-4000-8000-000000000001', 'Martin — barber', true),
  ('de000000-0000-4000-8000-000000000303', 'de000000-0000-4000-8000-000000000001', 'Eva — kozmetička', true)
ON CONFLICT (id) DO UPDATE
  SET tenant_id = EXCLUDED.tenant_id, display_name = EXCLUDED.display_name, is_active = EXCLUDED.is_active;

-- Deactivate the trigger-created generic staff of the demo tenant only.
UPDATE public.staff
SET is_active = false
WHERE tenant_id = 'de000000-0000-4000-8000-000000000001'
  AND id NOT IN ('de000000-0000-4000-8000-000000000301',
                 'de000000-0000-4000-8000-000000000302',
                 'de000000-0000-4000-8000-000000000303')
  AND is_active;

-- Working hours (weekday 1 = Monday ... 7 = Sunday).
INSERT INTO public.staff_working_hours (id, tenant_id, staff_id, weekday, start_time, end_time) VALUES
  -- Lucia: Mon–Fri 09:00–17:00
  ('de000000-0000-4000-8000-000000000411', 'de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000301', 1, '09:00', '17:00'),
  ('de000000-0000-4000-8000-000000000412', 'de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000301', 2, '09:00', '17:00'),
  ('de000000-0000-4000-8000-000000000413', 'de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000301', 3, '09:00', '17:00'),
  ('de000000-0000-4000-8000-000000000414', 'de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000301', 4, '09:00', '17:00'),
  ('de000000-0000-4000-8000-000000000415', 'de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000301', 5, '09:00', '17:00'),
  -- Martin: Tue–Sat 11:00–19:00
  ('de000000-0000-4000-8000-000000000422', 'de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000302', 2, '11:00', '19:00'),
  ('de000000-0000-4000-8000-000000000423', 'de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000302', 3, '11:00', '19:00'),
  ('de000000-0000-4000-8000-000000000424', 'de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000302', 4, '11:00', '19:00'),
  ('de000000-0000-4000-8000-000000000425', 'de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000302', 5, '11:00', '19:00'),
  ('de000000-0000-4000-8000-000000000426', 'de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000302', 6, '09:00', '14:00'),
  -- Eva: Mon, Wed, Fri 10:00–18:00
  ('de000000-0000-4000-8000-000000000431', 'de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000303', 1, '10:00', '18:00'),
  ('de000000-0000-4000-8000-000000000433', 'de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000303', 3, '10:00', '18:00'),
  ('de000000-0000-4000-8000-000000000435', 'de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000303', 5, '10:00', '18:00')
ON CONFLICT (id) DO UPDATE
  SET tenant_id = EXCLUDED.tenant_id, staff_id = EXCLUDED.staff_id, weekday = EXCLUDED.weekday,
      start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time;

-- Services. On first insert, trigger assign_new_service_to_staff links each one to all
-- active demo staff; the explicit mapping below then narrows it.
INSERT INTO public.services (id, tenant_id, name, description, duration, price, is_active, buffer_before_minutes, buffer_after_minutes) VALUES
  ('de000000-0000-4000-8000-000000000501', 'de000000-0000-4000-8000-000000000001', 'Dámsky strih a fúkaná', 'Konzultácia, umytie, strih a styling.', 60, 35.00, true, 0, 10),
  ('de000000-0000-4000-8000-000000000502', 'de000000-0000-4000-8000-000000000001', 'Farbenie vlasov', 'Celofarbenie vrátane strihu končekov.', 120, 75.00, true, 0, 15),
  ('de000000-0000-4000-8000-000000000503', 'de000000-0000-4000-8000-000000000001', 'Pánsky strih', 'Strih strojčekom a nožnicami, umytie.', 30, 18.00, true, 0, 5),
  ('de000000-0000-4000-8000-000000000504', 'de000000-0000-4000-8000-000000000001', 'Úprava brady', 'Tvarovanie brady, horúci uterák.', 20, 12.00, true, 0, 5),
  ('de000000-0000-4000-8000-000000000505', 'de000000-0000-4000-8000-000000000001', 'Kozmetické ošetrenie pleti', 'Čistenie, peeling, maska a masáž tváre.', 75, 55.00, true, 0, 10),
  ('de000000-0000-4000-8000-000000000506', 'de000000-0000-4000-8000-000000000001', 'Manikúra', 'Klasická manikúra s lakovaním.', 45, 25.00, true, 0, 5)
ON CONFLICT (id) DO UPDATE
  SET tenant_id = EXCLUDED.tenant_id, name = EXCLUDED.name, description = EXCLUDED.description,
      duration = EXCLUDED.duration, price = EXCLUDED.price, is_active = EXCLUDED.is_active,
      buffer_before_minutes = EXCLUDED.buffer_before_minutes, buffer_after_minutes = EXCLUDED.buffer_after_minutes;

CREATE TEMP TABLE demo_salon_service_staff (service_id uuid, staff_id uuid) ON COMMIT DROP;
INSERT INTO demo_salon_service_staff (service_id, staff_id) VALUES
  ('de000000-0000-4000-8000-000000000501', 'de000000-0000-4000-8000-000000000301'),
  ('de000000-0000-4000-8000-000000000502', 'de000000-0000-4000-8000-000000000301'),
  ('de000000-0000-4000-8000-000000000503', 'de000000-0000-4000-8000-000000000302'),
  ('de000000-0000-4000-8000-000000000503', 'de000000-0000-4000-8000-000000000301'),
  ('de000000-0000-4000-8000-000000000504', 'de000000-0000-4000-8000-000000000302'),
  ('de000000-0000-4000-8000-000000000505', 'de000000-0000-4000-8000-000000000303'),
  ('de000000-0000-4000-8000-000000000506', 'de000000-0000-4000-8000-000000000303');

INSERT INTO public.service_staff (tenant_id, service_id, staff_id)
SELECT 'de000000-0000-4000-8000-000000000001', m.service_id, m.staff_id
FROM demo_salon_service_staff m
ON CONFLICT DO NOTHING;

-- Remove links that are not in the mapping (demo tenant only).
DELETE FROM public.service_staff ss
WHERE ss.tenant_id = 'de000000-0000-4000-8000-000000000001'
  AND NOT EXISTS (
    SELECT 1 FROM demo_salon_service_staff m
    WHERE m.service_id = ss.service_id AND m.staff_id = ss.staff_id
  );

COMMIT;
