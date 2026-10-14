-- 020: AutoOps Event Worker Tables
-- Append-only migration for AutoOps functionality
-- Adds tables for: autoops_events, autoops_runs, booking_waitlist

-- 1. AutoOps Events Audit Table
CREATE TABLE IF NOT EXISTS public.autoops_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('no_show_detected', 'waitlist_slot_opened', 'waitlist_filled', 'slot_compaction_suggestion', 'outbox_processed')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_autoops_events_tenant ON public.autoops_events (tenant_id);
CREATE INDEX IF NOT EXISTS idx_autoops_events_type ON public.autoops_events (event_type);
CREATE INDEX IF NOT EXISTS idx_autoops_events_created ON public.autoops_events (created_at DESC);

ALTER TABLE public.autoops_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.autoops_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.autoops_events TO service_role;
GRANT SELECT ON public.autoops_events TO authenticated;

-- 2. AutoOps Runs Log Table
CREATE TABLE IF NOT EXISTS public.autoops_runs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  executed_at timestamptz NOT NULL DEFAULT now(),
  no_shows_detected integer NOT NULL DEFAULT 0,
  waitlist_filled integer NOT NULL DEFAULT 0,
  outbox_processed integer NOT NULL DEFAULT 0,
  slots_compacted integer NOT NULL DEFAULT 0,
  errors text[] NOT NULL DEFAULT '{}'::text[]
);

CREATE INDEX IF NOT EXISTS idx_autoops_runs_executed ON public.autoops_runs (executed_at DESC);

ALTER TABLE public.autoops_runs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.autoops_runs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.autoops_runs TO service_role;
GRANT SELECT ON public.autoops_runs TO authenticated;

-- 3. Booking Waitlist Table
CREATE TABLE IF NOT EXISTS public.booking_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  client_name text NOT NULL CHECK (char_length(client_name) BETWEEN 2 AND 100),
  client_email text NOT NULL CHECK (client_email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
  client_phone text NOT NULL CHECK (char_length(client_phone) BETWEEN 6 AND 20),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'fulfilled', 'expired')),
  priority integer NOT NULL DEFAULT 0,
  requested_start_time timestamptz,
  requested_end_time timestamptz,
  notified_at timestamptz,
  fulfilled_booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_waitlist_tenant ON public.booking_waitlist (tenant_id);
CREATE INDEX IF NOT EXISTS idx_booking_waitlist_service ON public.booking_waitlist (service_id);
CREATE INDEX IF NOT EXISTS idx_booking_waitlist_status ON public.booking_waitlist (status);
CREATE INDEX IF NOT EXISTS idx_booking_waitlist_priority ON public.booking_waitlist (priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_booking_waitlist_expires ON public.booking_waitlist (expires_at);

CREATE OR REPLACE FUNCTION public.update_booking_waitlist_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER booking_waitlist_updated_at_trigger
  BEFORE UPDATE ON public.booking_waitlist
  FOR EACH ROW EXECUTE FUNCTION public.update_booking_waitlist_updated_at();

ALTER TABLE public.booking_waitlist ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.booking_waitlist FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.booking_waitlist TO service_role;
GRANT SELECT, INSERT ON public.booking_waitlist TO authenticated;

CREATE POLICY "Tenant members can view waitlist" ON public.booking_waitlist
  FOR SELECT TO authenticated
  USING (tenant_id = auth.uid());

CREATE POLICY "Tenant members can add to waitlist" ON public.booking_waitlist
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Tenant members can update waitlist" ON public.booking_waitlist
  FOR UPDATE TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());
