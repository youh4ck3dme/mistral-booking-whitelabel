import type { Metadata } from 'next';

import { LandingHeader } from '@repo/web/components/landing/LandingHeader';
import { PricingWithRoiCalculator } from '@repo/web/components/landing/PricingWithRoiCalculator';
import { FaqSection } from '@repo/web/components/landing/FaqSection';
import { FinalCtaSection } from '@repo/web/components/landing/FinalCtaSection';
import { LandingFooter } from '@repo/web/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Cenník — NEXIFY Booking',
  description:
    'Balíky NEXIFY Booking pre salóny, kliniky a štúdiá: Štartér, Pro a Multi-pobočka. Cena na vyžiadanie, 0 % provízia z tržieb.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Cenník — NEXIFY Booking',
    description: 'Cena na vyžiadanie. 0 % provízia z vašich tržieb.',
    type: 'website',
  },
};

export default function PricingPage() {
  return (
    // The landing components use white text on dark surfaces and are unreadable in the light
    // theme, so this page scopes the dark theme tokens to itself.
    <div className="premium-page dark">
      <LandingHeader />
      <main>
        <section className="premium-container pt-16 md:pt-24 text-center max-w-3xl mx-auto space-y-4">
          <span className="premium-eyebrow">Ponuka</span>
          <h1 className="premium-title premium-title--medium">Cenník NEXIFY Booking</h1>
          <p className="premium-lead">
            Vyberte si balík podľa veľkosti tímu. Cena je na vyžiadanie. Z rezervácií si
            neberieme žiadnu províziu.
          </p>
        </section>

        <PricingWithRoiCalculator />

        <FaqSection />

        <FinalCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
