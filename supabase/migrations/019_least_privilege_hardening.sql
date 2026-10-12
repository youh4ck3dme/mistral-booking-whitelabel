-- Migration 019: Least-Privilege Access Hardening (DB-014)
-- Rollback: re-run migration 011 grants if needed.
--
-- Migration 011 previously granted 'ALL' (including TRUNCATE, TRIGGER, REFERENCES)
-- on all tables, sequences, and routines to anon and authenticated roles.
-- This migration strips over-broad privileges and replaces them with strict,
-- least-privilege explicit DML permissions while preserving RLS row-level security.

-- 1. Revoke over-broad privileges from anon and authenticated
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;

-- Reset default privileges for schema public
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated;

-- 2. Schema baseline usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 3. Explicit table permissions for anon role (Read-only on public catalog and bookable resources)
GRANT SELECT ON public.tenants TO anon;
GRANT SELECT ON public.tenant_branding TO anon;
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.staff_members TO anon;
GRANT SELECT ON public.staff_services TO anon;
GRANT SELECT ON public.staff_schedules TO anon;
GRANT SELECT ON public.staff_overrides TO anon;
GRANT SELECT ON public.bookings TO anon;

-- 4. Explicit table permissions for authenticated role (Controlled strictly by RLS policies)
GRANT SELECT ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_branding TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_overrides TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT SELECT, INSERT ON public.booking_audit_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.booking_manage_tokens TO authenticated;
GRANT SELECT ON public.notification_deliveries TO authenticated;
GRANT SELECT ON public.platform_admins TO authenticated;

-- 5. Explicit sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 6. Explicit routine permissions (RPC whitelist)
-- Client & Guest Bookable RPCs (Anon + Authenticated)
GRANT EXECUTE ON FUNCTION public.get_available_slots TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_booked_slots TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_bookable_staff TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_booking_by_token TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reschedule_booking_by_token TO anon, authenticated, service_role;

-- User/Staff Authenticated RPCs (Authenticated only)
GRANT EXECUTE ON FUNCTION public.create_booking TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_booking TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_booking_outcome TO authenticated, service_role;

-- Outbox Worker RPCs: isolated exclusively to service_role
REVOKE EXECUTE ON FUNCTION public.claim_notification_deliveries FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_notification_failure FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_notification_deliveries TO service_role;
GRANT EXECUTE ON FUNCTION public.record_notification_failure TO service_role;

-- 7. Secure default privileges for newly created entities
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;
