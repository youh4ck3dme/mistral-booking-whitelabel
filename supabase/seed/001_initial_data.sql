-- Insert initial tenants
INSERT INTO tenants (id, name, slug) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Demo Clinic', 'demo-clinic'),
  ('b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Wellness Center', 'wellness-center');

-- Insert tenant branding
INSERT INTO tenant_branding (id, tenant_id, logo_url, primary_color) VALUES
  ('c2ddc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'https://via.placeholder.com/150x50/3B82F6/FFFFFF?text=Demo+Clinic', '#3B82F6'),
  ('d3eec99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'https://via.placeholder.com/150x50/8B5CF6/FFFFFF?text=Wellness+Center', '#8B5CF6');

-- Insert time slots config
INSERT INTO time_slots_config (id, tenant_id, start_time, end_time, is_active) VALUES
  ('e4ffc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '08:00:00', '18:00:00', true),
  ('f5ggc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a12', '09:00:00', '17:00:00', true);

-- Insert services for Demo Clinic
INSERT INTO services (id, tenant_id, name, description, duration, price, is_active) VALUES
  ('10000000-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'General Checkup', 'Comprehensive health checkup', 30, 50.00, true),
  ('10000000-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Dental Cleaning', 'Professional teeth cleaning', 45, 75.00, true),
  ('10000000-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Blood Test', 'Complete blood count analysis', 20, 30.00, true);

-- Insert services for Wellness Center
INSERT INTO services (id, tenant_id, name, description, duration, price, is_active) VALUES
  ('20000000-0000-0000-0000-000000000001', 'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Yoga Class', 'Group yoga session', 60, 25.00, true),
  ('20000000-0000-0000-0000-000000000002', 'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Meditation', 'Guided meditation session', 45, 20.00, true),
  ('20000000-0000-0000-0000-000000000003', 'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Massage', 'Full body relaxation massage', 90, 80.00, true);

-- Insert AI experiments
INSERT INTO ai_experiments (id, tenant_id, name, description) VALUES
  ('30000000-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Service Recommendation A/B Test', 'Test different recommendation algorithms'),
  ('30000000-0000-0000-0000-000000000002', 'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Upsell Bundle Test', 'Test upsell bundle effectiveness');

-- Note: Actual tenant_users and bookings will be created during user registration/booking flow
-- This seed data provides the foundation for testing the multi-tenant system