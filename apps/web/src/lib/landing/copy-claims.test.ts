import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const landingDir = path.resolve(__dirname, '../../../components/landing');

const files = [
  'PricingWithRoiCalculator.tsx',
  'LandingFooter.tsx',
  'EnterpriseReliability.tsx',
  'SocialProofStrip.tsx',
  'FinalCtaSection.tsx',
  'HeroSection.tsx',
  'LandingHeader.tsx',
  'FaqSection.tsx',
];

const banned = [
  { name: 'SMS reminders', re: /\bSMS\b/ },
  { name: '14-day free trial', re: /14 dní|14-dňov/i },
  { name: 'numeric 99.99% SLA', re: /99\.99/ },
  { name: 'unenforced 300-booking cap', re: /300 rezerváci/i },
];

// Concrete NEXIFY plan prices Erik asked us to hide (monthly 29/69/149, annual 24/55/119).
const planPrices = [
  { name: 'listed monthly plan prices', re: /monthlyPrice:\s*(29|69|149)\b/ },
  { name: 'listed annual plan prices', re: /annualPrice:\s*(24|55|119)\b/ },
  { name: 'euro plan prices in copy', re: /\b(24|29|55|69|119|149)\s*€/ },
  { name: 'NEXIFY monthly plan cost constant', re: /nexifyMonthlyCost/ },
];

describe('landing copy does not make unsupported claims', () => {
  for (const file of files) {
    const source = readFileSync(path.join(landingDir, file), 'utf8');
    it(`${file} has none of the banned claims`, () => {
      for (const claim of banned) {
        expect(source, `${file} still contains ${claim.name}`).not.toMatch(claim.re);
      }
    });

    it(`${file} does not publish euro plan prices`, () => {
      for (const claim of planPrices) {
        expect(source, `${file} still contains ${claim.name}`).not.toMatch(claim.re);
      }
    });
  }

  it('PricingWithRoiCalculator shows Cena na vyžiadanie instead of a plan price', () => {
    const source = readFileSync(path.join(landingDir, 'PricingWithRoiCalculator.tsx'), 'utf8');
    expect(source).toMatch(/Cena na vyžiadanie/);
  });
});
