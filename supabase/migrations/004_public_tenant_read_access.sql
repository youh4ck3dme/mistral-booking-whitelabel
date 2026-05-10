-- Allow public read access for tenant discovery and branding on public booking routes.
CREATE POLICY "Public can view tenants"
ON tenants FOR SELECT
TO public
USING (true);

CREATE POLICY "Public can view tenant branding"
ON tenant_branding FOR SELECT
TO public
USING (true);
