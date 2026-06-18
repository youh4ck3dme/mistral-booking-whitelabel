-- Platform admins table
-- Users listed here have access to /platform (super-admin, NEXIFY operators only).
-- This is intentionally separate from the tenant_users 'admin' role, which is tenant-scoped.
CREATE TABLE IF NOT EXISTS platform_admins (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL UNIQUE, -- Supabase Auth user ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_platform_admins_user_id ON platform_admins(user_id);

-- Enable RLS
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

-- Only the service role (server-side) can read/write this table.
-- No authenticated client should be able to query this directly.
CREATE POLICY "Service role can manage platform admins"
ON platform_admins FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
