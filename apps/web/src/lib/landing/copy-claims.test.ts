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

describe('landing copy does not make unsupported claims', () => {
  for (const file of files) {
    const source = readFileSync(path.join(landingDir, file), 'utf8');
    it(`${file} has none of the banned claims`, () => {
      for (const claim of banned) {
        expect(source, `${file} still contains ${claim.name}`).not.toMatch(claim.re);
      }
    });
  }
});
