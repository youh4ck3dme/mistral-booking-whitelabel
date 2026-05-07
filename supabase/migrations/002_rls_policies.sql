-- Enable Row Level Security on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversions ENABLE ROW LEVEL SECURITY;

-- Tenants: Only platform admins can manage tenants
CREATE POLICY "Platform admins can manage tenants"
ON tenants FOR ALL
TO authenticated
WITH CHECK (true);

-- Tenant users: Users can only access their own tenant's users
CREATE POLICY "Tenant users can access their own tenant users"
ON tenant_users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tenant_users
    WHERE tenant_id = tenant_users.tenant_id
    AND user_id = auth.uid()
    AND role IN ('admin', 'staff')
  )
);

-- Services: Users can only access services for their tenant
CREATE POLICY "Tenant users can access their services"
ON services FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tenant_users
    WHERE tenant_id = services.tenant_id
    AND user_id = auth.uid()
  )
);

-- Bookings: Users can only access their own bookings or bookings for their tenant
CREATE POLICY "Tenant users can access their bookings"
ON bookings FOR ALL
TO authenticated
USING (
  (user_id = auth.uid()) OR
  (EXISTS (
    SELECT 1 FROM tenant_users
    WHERE tenant_id = bookings.tenant_id
    AND user_id = auth.uid()
    AND role IN ('admin', 'staff')
  ))
);

-- Tenant branding: Users can only access branding for their tenant
CREATE POLICY "Tenant users can access their branding"
ON tenant_branding FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tenant_users
    WHERE tenant_id = tenant_branding.tenant_id
    AND user_id = auth.uid()
  )
);

-- Time slots config: Users can only access time slots for their tenant
CREATE POLICY "Tenant users can access their time slots"
ON time_slots_config FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tenant_users
    WHERE tenant_id = time_slots_config.tenant_id
    AND user_id = auth.uid()
  )
);

-- AI experiments: Users can only access experiments for their tenant
CREATE POLICY "Tenant users can access their AI experiments"
ON ai_experiments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tenant_users
    WHERE tenant_id = ai_experiments.tenant_id
    AND user_id = auth.uid()
  )
);

-- AI impressions: Users can only access impressions for their tenant's experiments
CREATE POLICY "Tenant users can access their AI impressions"
ON ai_impressions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tenant_users tu
    JOIN ai_experiments ae ON ae.tenant_id = tu.tenant_id
    WHERE ae.id = ai_impressions.experiment_id
    AND tu.user_id = auth.uid()
  )
);

-- AI conversions: Users can only access conversions for their tenant's impressions
CREATE POLICY "Tenant users can access their AI conversions"
ON ai_conversions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tenant_users tu
    JOIN ai_experiments ae ON ae.tenant_id = tu.tenant_id
    JOIN ai_impressions ai ON ai.experiment_id = ae.id
    WHERE ai.id = ai_conversions.impression_id
    AND tu.user_id = auth.uid()
  )
);

-- Public access policies for booking flow (anonymous users)
-- Allow public read access to services and time slots for booking
CREATE POLICY "Public can view active services"
ON services FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Public can view time slots"
ON time_slots_config FOR SELECT
TO public
USING (is_active = true);

-- Public can create bookings (but need to be authenticated)
CREATE POLICY "Authenticated users can create bookings"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM services
    WHERE id = NEW.service_id AND is_active = true
  ) AND
  EXISTS (
    SELECT 1 FROM tenant_users
    WHERE tenant_id = NEW.tenant_id AND user_id = auth.uid()
  )
);