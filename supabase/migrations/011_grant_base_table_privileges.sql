-- Migration: grant baseline anon/authenticated table privileges
-- Rollback: REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
--
-- Discovered by replaying the full migration history against a fresh local
-- Supabase instance (`supabase start`): every table returned
-- "permission denied" (42501) for the anon role, even where RLS policies
-- explicitly allow public/authenticated SELECT. RLS only restricts which
-- ROWS a role can see once it already has base GRANT access to the table —
-- Supabase's dashboard/table editor normally applies these baseline grants
-- automatically when a project is created there, so this was never captured
-- as a migration. Production already has these grants (applied out of band
-- via the dashboard) — this migration exists so a fresh clone/local/staging
-- database actually works from migrations alone.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
