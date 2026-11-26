import type { Metadata } from 'next';
import Link from 'next/link';

import {
  DEMO_TENANT,
  formatDemoPrice,
  getDemoServicesWithStaff,
} from '@repo/web/src/lib/demo/demo-tenant';

export const metadata: Metadata = {
  title: 'Demo salón — NEXIFY Booking',
  description:
    'Ukážkový tenant na platforme NEXIFY Booking: kadernícky a kozmetický salón so službami, cenami a tímom.',
  alternates: { canonical: '/demo' },
};

export default function DemoPage() {
  const services = getDemoServicesWithStaff();

  return (
    <div className="premium-page">
      <div className="premium-container premium-stack" style={{ padding: '3rem 1.5rem' }}>
        <header className="premium-toolbar">
          <Link href="/" className="premium-brand">
            <span className="premium-brand-word">NEXIFY</span>
          </Link>
          <div className="premium-inline-actions">
            <Link href="/pricing" className="premium-button-secondary">
              Cenník
            </Link>
            <Link href="/signup" className="premium-button">
              Vytvoriť vlastný salón
            </Link>
          </div>
        </header>

        <main className="premium-stack">
          <section className="premium-hero">
            <div className="premium-hero-copy premium-stack">
              <span className="premium-eyebrow">Ukážkový tenant · statické dáta</span>
              <h1 className="premium-title premium-title--medium">
                <span className="premium-title-gradient">{DEMO_TENANT.name}</span>
              </h1>
              <p className="premium-lead">
                Takto vidia zákazníci profil salónu na NEXIFY: služby s cenou a trvaním, tím a
                otváracie hodiny. Údaje sú vymyslené a slúžia len na ukážku.
              </p>
            </div>

            <div className="premium-kpi-grid">
              <div className="premium-stat">
                <span className="premium-stat-value">{services.length}</span>
                <span className="premium-stat-label">služieb</span>
              </div>
              <div className="premium-stat">
                <span className="premium-stat-value">{DEMO_TENANT.staff.length}</span>
                <span className="premium-stat-label">členovia tímu</span>
              </div>
              <div className="premium-stat">
                <span className="premium-stat-value">{DEMO_TENANT.openingHours}</span>
                <span className="premium-stat-label">otváracie hodiny</span>
              </div>
            </div>
          </section>

          <section className="premium-section" aria-labelledby="demo-services">
            <div className="premium-section-header">
              <span className="premium-section-label">Služby</span>
              <h2 id="demo-services" className="premium-section-title">
                Cenník salónu
              </h2>
            </div>
            <div className="premium-grid-3">
              {services.map((service) => (
                <article key={service.id} className="premium-card premium-stack">
                  <h3 className="premium-card-title">{service.name}</h3>
                  <p className="premium-card-copy">{service.description}</p>
                  <div className="premium-toolbar">
                    <div>
                      <strong>{formatDemoPrice(service.price)}</strong>
                      <div className="premium-muted">{service.durationMinutes} min</div>
                    </div>
                    <span className="premium-muted">
                      {service.staff.map((member) => member.displayName).join(', ')}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="premium-section" aria-labelledby="demo-team">
            <div className="premium-section-header">
              <span className="premium-section-label">Tím</span>
              <h2 id="demo-team" className="premium-section-title">
                Kto vás obslúži
              </h2>
            </div>
            <div className="premium-grid-3">
              {DEMO_TENANT.staff.map((member) => (
                <article key={member.id} className="premium-card premium-stack">
                  <h3 className="premium-card-title">{member.displayName}</h3>
                  <span className="premium-badge">{member.role}</span>
                  <p className="premium-card-copy">{member.workingHours}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="premium-card premium-stack">
            <h2 className="premium-section-title">Chcete takýto profil pre svoj salón?</h2>
            <p className="premium-copy">
              Vlastná značka, služby a tím. Rezervácie bez provízie z tržieb.
            </p>
            <div className="premium-actions">
              <Link href="/signup" className="premium-button">
                Začať
              </Link>
              <Link href="/pricing" className="premium-button-secondary">
                Pozrieť cenník
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
