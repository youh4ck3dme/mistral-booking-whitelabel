-- Migration: 010_sales_leads_pipeline
-- Description: Creates tables for sales leads, messages, and offers with RLS policies
-- Up: Create tables and policies

-- Enable RLS on new tables
ALTER TABLE IF EXISTS sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales_offers ENABLE ROW LEVEL SECURITY;

-- Drop tables if they exist (for idempotency in local dev)
DROP TABLE IF EXISTS sales_offers CASCADE;
DROP TABLE IF EXISTS sales_messages CASCADE;
DROP TABLE IF EXISTS sales_leads CASCADE;

-- Create sales_leads table
CREATE TABLE public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT NULL,
  contact_role TEXT NULL,
  vertical TEXT NOT NULL,
  country TEXT NULL,
  city TEXT NULL,
  email TEXT NULL,
  linkedin_url TEXT NULL,
  website_url TEXT NULL,
  contact_form_url TEXT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 12),
  score_reason JSONB NOT NULL DEFAULT '{}'::jsonb,
  problem_summary TEXT NOT NULL,
  offer_angle TEXT NOT NULL,
  proposed_service TEXT NOT NULL,
  estimated_setup_price_eur INTEGER NULL,
  estimated_monthly_price_eur INTEGER NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'ready_to_contact', 'contacted', 'replied', 'call_booked', 'proposal_sent', 'won', 'lost', 'do_not_contact')),
  priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create sales_messages table
CREATE TABLE public.sales_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.sales_leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'linkedin', 'contact_form')),
  subject TEXT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'sent', 'failed')),
  sent_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create sales_offers table
CREATE TABLE public.sales_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.sales_leads(id) ON DELETE CASCADE,
  offer_type TEXT NOT NULL CHECK (offer_type IN ('fitness_booking_pwa', 'chauffeur_booking_pwa', 'barber_booking_pwa', 'custom_booking_pwa')),
  title TEXT NOT NULL,
  setup_price_eur INTEGER NOT NULL,
  monthly_price_eur INTEGER NOT NULL,
  scope JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language plpgsql;

-- Create trigger for sales_leads
DROP TRIGGER IF EXISTS update_sales_leads_updated_at ON public.sales_leads;
CREATE TRIGGER update_sales_leads_updated_at
  BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sales_leads_status ON public.sales_leads(status);
CREATE INDEX IF NOT EXISTS idx_sales_leads_vertical ON public.sales_leads(vertical);
CREATE INDEX IF NOT EXISTS idx_sales_leads_priority ON public.sales_leads(priority);
CREATE INDEX IF NOT EXISTS idx_sales_leads_score ON public.sales_leads(score);
CREATE INDEX IF NOT EXISTS idx_sales_messages_lead_id ON public.sales_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_sales_offers_lead_id ON public.sales_offers(lead_id);

-- RLS Policies for sales_leads
-- Platform admins can manage all leads
CREATE POLICY "Platform admins can manage sales leads"
ON public.sales_leads FOR ALL
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM platform_admins
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for sales_messages
CREATE POLICY "Platform admins can manage sales messages"
ON public.sales_messages FOR ALL
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM platform_admins
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for sales_offers
CREATE POLICY "Platform admins can manage sales offers"
ON public.sales_offers FOR ALL
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM platform_admins
    WHERE user_id = auth.uid()
  )
);

-- Seed data (idempotent)
DO $$
BEGIN
  -- Check if leads already exist
  IF NOT EXISTS (SELECT 1 FROM public.sales_leads WHERE company_name = 'Metagym Praha' AND vertical = 'fitness') THEN
    INSERT INTO public.sales_leads (
      company_name, contact_name, vertical, country, city, email, linkedin_url, 
      score, score_reason, problem_summary, offer_angle, proposed_service,
      estimated_setup_price_eur, estimated_monthly_price_eur, priority, status
    ) VALUES (
      'Metagym Praha', 'Jarda Zapadlo', 'fitness', 'Czech Republic', 'Praha', 
      'members@metagym.cz', 'https://linkedin.com/in/zapadlo',
      11, '{}'::jsonb, 
      'Multi-location growth, booking/member UX depends on email-code flow and lacks a PWA layer.',
      'Fitness chain Booking PWA for multi-location availability, member UX, offline support, and push notifications.',
      'fitness_booking_pwa', 4900, 499, 1, 'ready_to_contact'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.sales_leads WHERE company_name = 'Elite Chauffeur Jersey' AND vertical = 'chauffeur') THEN
    INSERT INTO public.sales_leads (
      company_name, contact_name, vertical, country, city, email, linkedin_url,
      score, score_reason, problem_summary, offer_angle, proposed_service,
      estimated_setup_price_eur, estimated_monthly_price_eur, priority, status
    ) VALUES (
      'Elite Chauffeur Jersey', 'Ian Thompson', 'chauffeur', 'Jersey', NULL,
      NULL, 'https://linkedin.com/in/ian-thompson-a9779561',
      9, '{}'::jsonb,
      'Peak-season premium transport bookings are handled manually through WhatsApp/contact flow.',
      'Chauffeur Booking PWA with real-time availability, automated confirmations, deposits, and scheduled rides.',
      'chauffeur_booking_pwa', 2900, 249, 2, 'ready_to_contact'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.sales_leads WHERE company_name = 'Männerhaus Barber Shop' AND vertical = 'barber') THEN
    INSERT INTO public.sales_leads (
      company_name, contact_name, vertical, country, city, email, linkedin_url,
      score, score_reason, problem_summary, offer_angle, proposed_service,
      estimated_setup_price_eur, estimated_monthly_price_eur, priority, status
    ) VALUES (
      'Männerhaus Barber Shop', NULL, 'barber', 'UK', NULL,
      'info@mannerhaus.co.uk', NULL,
      8, '{}'::jsonb,
      'Bookings depend on Booksy, creating platform dependency and weak ownership of client data.',
      'Branded Barber Booking PWA on their own domain with owned client database, reminders, staff calendar, and no platform lock-in.',
      'barber_booking_pwa', 1490, 149, 3, 'ready_to_contact'
    );
  END IF;

  -- Get lead IDs for messages and offers
  DECLARE
    metagym_id UUID;
    elite_id UUID;
    mannerhaus_id UUID;
  BEGIN
    SELECT id INTO metagym_id FROM public.sales_leads WHERE company_name = 'Metagym Praha' AND vertical = 'fitness';
    SELECT id INTO elite_id FROM public.sales_leads WHERE company_name = 'Elite Chauffeur Jersey' AND vertical = 'chauffeur';
    SELECT id INTO mannerhaus_id FROM public.sales_leads WHERE company_name = 'Männerhaus Barber Shop' AND vertical = 'barber';

    -- Seed messages for Metagym
    IF metagym_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.sales_messages WHERE lead_id = metagym_id AND subject = 'Metagym booking UX při 100 pobočkách') THEN
        INSERT INTO public.sales_messages (lead_id, channel, subject, body, status) VALUES (
          metagym_id, 'email', 
          'Metagym booking UX při 100 pobočkách',
          'Ahoj Jardo, sleduji Metagym a growth je výjimečný. Všiml jsem si, že vstupní flow závisí na kódu v emailu bez PWA vrstvy. Při 100 pobočkách bude UX booking flow klíčovým diferenciátorem oproti SC Fitness. Stavím Booking PWA pro fitness chainy — instalovatelné z prohlížeče, offline podpora, real-time dostupnost, AI automatizace. 15 minut na call?

Larsen Evans
Founder & PWA Automation Architect',
          'draft'
        );
      END IF;

      IF NOT EXISTS (SELECT 1 FROM public.sales_messages WHERE lead_id = metagym_id AND channel = 'linkedin' AND body LIKE '%9 poboček%') THEN
        INSERT INTO public.sales_messages (lead_id, channel, subject, body, status) VALUES (
          metagym_id, 'linkedin', NULL,
          'Ahoj Jardo, sleduji Metagym — 9 poboček a čtyři ve výstavbě je výkon. Všiml jsem si, že celý vstupní flow stojí na kódu v emailu bez PWA vrstvy. Při 100 pobočkách bude member UX klíčový diferenciátor oproti SC Fitness. Stavím Booking PWA pro fitness chainy — instalovatelné z prohlížeče, offline podpora, real-time dostupnost po pobočkách. 15 minut na call?',
          'draft'
        );
      END IF;

      -- Seed offer for Metagym
      IF NOT EXISTS (SELECT 1 FROM public.sales_offers WHERE lead_id = metagym_id AND offer_type = 'fitness_booking_pwa') THEN
        INSERT INTO public.sales_offers (lead_id, offer_type, title, setup_price_eur, monthly_price_eur, scope, status) VALUES (
          metagym_id, 'fitness_booking_pwa', 'Fitness Chain Booking PWA', 4900, 499, '{}'::jsonb, 'draft'
        );
      END IF;
    END IF;

    -- Seed messages for Elite Chauffeur
    IF elite_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.sales_messages WHERE lead_id = elite_id AND channel = 'linkedin' AND body LIKE '%May Instagram%') THEN
        INSERT INTO public.sales_messages (lead_id, channel, subject, body, status) VALUES (
          elite_id, 'linkedin', NULL,
          'Hi Ian, your May Instagram posts show you''re at full capacity right now. I noticed all bookings still go through WhatsApp. For a premium service at peak season that''s hours of daily admin. I build Booking PWA apps for chauffeured transport — branded, no app download needed, real-time availability, automated confirmations and deposits. Worth a 10-min call this week?',
          'draft'
        );
      END IF;

      -- Seed offer for Elite Chauffeur
      IF NOT EXISTS (SELECT 1 FROM public.sales_offers WHERE lead_id = elite_id AND offer_type = 'chauffeur_booking_pwa') THEN
        INSERT INTO public.sales_offers (lead_id, offer_type, title, setup_price_eur, monthly_price_eur, scope, status) VALUES (
          elite_id, 'chauffeur_booking_pwa', 'Premium Chauffeur Booking PWA', 2900, 249, '{}'::jsonb, 'draft'
        );
      END IF;
    END IF;

    -- Seed messages for Männerhaus
    IF mannerhaus_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.sales_messages WHERE lead_id = mannerhaus_id AND subject = 'Your Booksy bookings — you''re building their database, not yours') THEN
        INSERT INTO public.sales_messages (lead_id, channel, subject, body, status) VALUES (
          mannerhaus_id, 'email',
          'Your Booksy bookings — you''re building their database, not yours',
          'Hi, I came across Männerhaus while researching premium barbershops in Wirral — 400+ five-star reviews across two locations is impressive. I noticed all bookings go through Booksy. Every client you book is in Booksy''s database, not yours. And you pay £60-120/month for the privilege. I build Booking PWA apps for premium barbershops — branded to your domain, you own all client data, no platform dependency. Worth a 10-min call?

Larsen Evans
Founder & PWA Automation Architect',
          'draft'
        );
      END IF;

      -- Seed offer for Männerhaus
      IF NOT EXISTS (SELECT 1 FROM public.sales_offers WHERE lead_id = mannerhaus_id AND offer_type = 'barber_booking_pwa') THEN
        INSERT INTO public.sales_offers (lead_id, offer_type, title, setup_price_eur, monthly_price_eur, scope, status) VALUES (
          mannerhaus_id, 'barber_booking_pwa', 'Branded Barber Booking PWA', 1490, 149, '{}'::jsonb, 'draft'
        );
      END IF;
    END IF;
  END;
END $$;
