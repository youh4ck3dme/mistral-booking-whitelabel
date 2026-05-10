-- Insert initial tenants
INSERT INTO tenants (id, name, slug) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Demo Clinic', 'demo-clinic'),
  ('b1ffcc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Wellness Center', 'wellness-center'),
  ('11000000-0000-0000-0000-000000000001', 'Barber Lounge', 'barber-lounge'),
  ('12000000-0000-0000-0000-000000000001', 'Beauty Studio', 'beauty-studio'),
  ('13000000-0000-0000-0000-000000000001', 'Recovery Massage', 'recovery-massage'),
  ('14000000-0000-0000-0000-000000000001', 'Apex Fitness', 'apex-fitness'),
  ('15000000-0000-0000-0000-000000000001', 'Motion Physio', 'motion-physio'),
  ('17000000-0000-0000-0000-000000000001', 'Ink Tattoo', 'ink-tattoo');

-- Insert tenant branding
INSERT INTO tenant_branding (id, tenant_id, logo_url, primary_color) VALUES
  ('c2ddcc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'https://via.placeholder.com/150x50/3B82F6/FFFFFF?text=Demo+Clinic', '#3B82F6'),
  ('d3eecc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b1ffcc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'https://via.placeholder.com/150x50/8B5CF6/FFFFFF?text=Wellness+Center', '#8B5CF6'),
  ('21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'https://via.placeholder.com/150x50/FF5A5F/FFFFFF?text=Barber+Lounge', '#FF5A5F'),
  ('22000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', 'https://via.placeholder.com/150x50/FF6FB5/FFFFFF?text=Beauty+Studio', '#FF6FB5'),
  ('23000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'https://via.placeholder.com/150x50/6EC8FF/FFFFFF?text=Recovery+Massage', '#6EC8FF'),
  ('24000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001', 'https://via.placeholder.com/150x50/8DFF8A/0B1020?text=Apex+Fitness', '#8DFF8A'),
  ('25000000-0000-0000-0000-000000000001', '15000000-0000-0000-0000-000000000001', 'https://via.placeholder.com/150x50/7C9BFF/FFFFFF?text=Motion+Physio', '#7C9BFF'),
  ('27000000-0000-0000-0000-000000000001', '17000000-0000-0000-0000-000000000001', 'https://via.placeholder.com/150x50/F59E0B/0B1020?text=Ink+Tattoo', '#F59E0B');

-- Insert time slots config
INSERT INTO time_slots_config (id, tenant_id, start_time, end_time, is_active) VALUES
  ('e4ffcc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '08:00:00', '18:00:00', true),
  ('f5ffcc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'b1ffcc99-9c0b-4ef8-bb6d-6bb9bd380a12', '09:00:00', '17:00:00', true),
  ('31000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', '09:00:00', '19:00:00', true),
  ('32000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', '10:00:00', '19:00:00', true),
  ('33000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '10:00:00', '20:00:00', true),
  ('34000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001', '06:00:00', '21:00:00', true),
  ('35000000-0000-0000-0000-000000000001', '15000000-0000-0000-0000-000000000001', '08:00:00', '18:00:00', true),
  ('37000000-0000-0000-0000-000000000001', '17000000-0000-0000-0000-000000000001', '11:00:00', '20:00:00', true);

-- Insert services for Demo Clinic
INSERT INTO services (id, tenant_id, name, description, duration, price, is_active) VALUES
  ('10000000-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'General Checkup', 'Comprehensive health checkup', 30, 50.00, true),
  ('10000000-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Dental Cleaning', 'Professional teeth cleaning', 45, 75.00, true),
  ('10000000-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Blood Test', 'Complete blood count analysis', 20, 30.00, true);

-- Insert services for Wellness Center
INSERT INTO services (id, tenant_id, name, description, duration, price, is_active) VALUES
  ('20000000-0000-0000-0000-000000000001', 'b1ffcc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Yoga Class', 'Group yoga session', 60, 25.00, true),
  ('20000000-0000-0000-0000-000000000002', 'b1ffcc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Meditation', 'Guided meditation session', 45, 20.00, true),
  ('20000000-0000-0000-0000-000000000003', 'b1ffcc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Massage', 'Full body relaxation massage', 90, 80.00, true);

-- Insert vertical-specific services for dedicated landing routes
INSERT INTO services (id, tenant_id, name, description, duration, price, is_active) VALUES
  ('40000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'Precision Barber Cut', 'Precision cut, beard shaping, and hot towel finish for repeat barber bookings.', 45, 32.00, true),
  ('50000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', 'Signature Glow Facial', 'Skin, lashes, and beauty appointment designed for premium salon visits.', 60, 68.00, true),
  ('60000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'Deep Tissue Recovery Massage', 'Targeted recovery massage focused on relaxation, mobility, and muscle release.', 75, 92.00, true),
  ('70000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001', 'Performance Coaching Session', 'Personal training session for strength, conditioning, and clean fitness scheduling.', 60, 54.00, true),
  ('80000000-0000-0000-0000-000000000001', '15000000-0000-0000-0000-000000000001', 'Mobility Physio Assessment', 'Therapy-led physio intake with recovery plan and structured rehabilitation timing.', 50, 64.00, true),
  ('90000000-0000-0000-0000-000000000001', '17000000-0000-0000-0000-000000000001', 'Custom Tattoo Consultation', 'Artist consultation for tattoo concepts, placement, and follow-up scheduling.', 45, 40.00, true);

-- Insert AI experiments
INSERT INTO ai_experiments (id, tenant_id, name, description) VALUES
  ('30000000-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Service Recommendation A/B Test', 'Test different recommendation algorithms'),
  ('30000000-0000-0000-0000-000000000002', 'b1ffcc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Upsell Bundle Test', 'Test upsell bundle effectiveness');

-- Note: Actual tenant_users and bookings will be created during user registration/booking flow
-- This seed data provides the foundation for testing the multi-tenant system
