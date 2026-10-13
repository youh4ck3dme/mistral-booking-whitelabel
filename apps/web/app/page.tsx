import type { Metadata } from 'next';

import { LandingHeader } from '@repo/web/components/landing/LandingHeader';
import { HeroSection } from '@repo/web/components/landing/HeroSection';
import { SocialProofStrip } from '@repo/web/components/landing/SocialProofStrip';
import { ProblemSolution } from '@repo/web/components/landing/ProblemSolution';
import { FeatureShowcase } from '@repo/web/components/landing/FeatureShowcase';
import { AiWhiteLabelHighlight } from '@repo/web/components/landing/AiWhiteLabelHighlight';
import { EnterpriseReliability } from '@repo/web/components/landing/EnterpriseReliability';
import { PricingWithRoiCalculator } from '@repo/web/components/landing/PricingWithRoiCalculator';
import { FaqSection } from '@repo/web/components/landing/FaqSection';
import { FinalCtaSection } from '@repo/web/components/landing/FinalCtaSection';
import { LandingFooter } from '@repo/web/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'NEXIFY Booking — Prémiová White-Label Rezervačná Platforma',
  description:
    'B2B SaaS rezervačný systém pre prémiové salóny, kliniky a štúdiá. 100% white-label, nulový double-booking, AI asistent a 0% provízie z vašich tržieb.',
  openGraph: {
    title: 'NEXIFY Booking — Prémiová White-Label Rezervačná Platforma',
    description:
      'Chráňte svoju značku s moderným rezervačným systémom. Nulový double-booking a 0% provízia.',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <div className="premium-page">
      <LandingHeader />
      <main>
        {/* 1. HERO SECTION */}
        <HeroSection />

        {/* 2. SOCIAL PROOF & KEY METRICS */}
        <SocialProofStrip />

        {/* 3. PROBLEM VS SOLUTION */}
        <ProblemSolution />

        {/* 4. KEY PLATFORM PILLARS */}
        <FeatureShowcase />

        {/* 5. AI & WHITE-LABEL HIGHLIGHT */}
        <AiWhiteLabelHighlight />

        {/* 6. ENTERPRISE RELIABILITY & SECURITY */}
        <EnterpriseReliability />

        {/* 7. TRANSPARENT PRICING & COMMISSION KILLER ROI CALCULATOR */}
        <PricingWithRoiCalculator />

        {/* 8. FREQUENTLY ASKED QUESTIONS */}
        <FaqSection />

        {/* 9. FINAL CALL TO ACTION */}
        <FinalCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
