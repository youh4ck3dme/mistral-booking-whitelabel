import Link from 'next/link';
import type { CSSProperties } from 'react';

import type { Service, Tenant, TenantBranding } from '@repo/core';
import {
  type VerticalKey,
  type VerticalRouteConfig,
  verticalRouteList,
} from '@repo/web/src/lib/booking/vertical-routing';

import styles from './booking-landing.module.css';

export type FeaturedServiceCard = Service & {
  accent: string;
  tenantName: string;
  tenantSlug: string;
  vertical: VerticalKey;
};

type BookingLandingPageProps = {
  featuredServices: FeaturedServiceCard[];
  tenants: Tenant[];
  branding: TenantBranding[];
};

const steps = [
  {
    number: '01',
    title: 'Select Service',
    description: 'Choose the service that matches your visit, team, or preferred specialist.',
  },
  {
    number: '02',
    title: 'Choose Date & Time',
    description: 'Pick an available day and slot that fits your calendar and the tenant schedule.',
  },
  {
    number: '03',
    title: 'Confirm Booking',
    description: 'Review the details and submit your reservation without leaving the flow.',
  },
];

const fallbackTestimonials = [] as const;

function getBookHref(tenants: Tenant[]) {
  const primaryTenant = tenants[0]?.slug ?? 'demo-clinic';
  return `/${primaryTenant}/book`;
}

function getServicesHref(featuredServices: FeaturedServiceCard[], tenants: Tenant[]) {
  const firstServiceTenant = featuredServices.find((service) => service.tenantSlug)?.tenantSlug;
  return firstServiceTenant ? `/${firstServiceTenant}` : `/${tenants[0]?.slug ?? 'demo-clinic'}`;
}

function getVerticalHref(vertical: VerticalRouteConfig) {
  return `/${vertical.tenantSlug}/book?service=${vertical.serviceId}`;
}

export default function BookingLandingPage({
  featuredServices,
  tenants,
  branding,
}: BookingLandingPageProps) {
  const bookHref = getBookHref(tenants);
  const servicesHref = getServicesHref(featuredServices, tenants);
  const tenantCount = tenants.length;
  const activeBrandCount = branding.length;

  return (
    <main className={styles.page} id="top">
      <div className={styles.heroGlow} aria-hidden="true" />
      <div className={styles.gridOverlay} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.navShell}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoWord}>NEXIFY</span>
            <span className={styles.logoMark}>BOOKING</span>
          </Link>

          <nav className={styles.navLinks} aria-label="Primary">
            <a href="#top" className={styles.navLink}>
              Home
            </a>
            <a href="#services" className={styles.navLink}>
              Services
            </a>
            <Link href={bookHref} className={styles.navLink}>
              Book
            </Link>
            <Link href="/platform" className={styles.navLink}>
              Admin
            </Link>
          </nav>

          <div className={styles.navActions}>
            <Link href="/login" className={styles.secondaryButton}>
              Sign in
            </Link>
            <Link href={bookHref} className={styles.primaryButton}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>Multi-tenant booking platform</span>
            <h1 className={styles.heroTitle}>
              <span className={styles.gradientWord}>Book</span> Your Perfect Service
            </h1>
            <p className={styles.heroLead}>
              Premium scheduling for barber, beauty, wellness, fitness, physio, clinic,
              and tattoo businesses powered by our existing tenant model and booking flow.
            </p>

            <div className={styles.heroActions}>
              <Link href={servicesHref} className={styles.primaryButton}>
                Explore Services
              </Link>
              <Link href={bookHref} className={styles.secondaryButton}>
                Book Now
              </Link>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{tenantCount || 2}</span>
                <span className={styles.statLabel}>live tenants</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{featuredServices.length || 3}</span>
                <span className={styles.statLabel}>featured services</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{activeBrandCount || 2}</span>
                <span className={styles.statLabel}>brand themes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="verticals">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Supported verticals</span>
            <h2 className={styles.sectionTitle}>Booking experiences shaped for every vertical.</h2>
            <p className={styles.sectionLead}>
              The homepage stays premium and dark, while each tenant can still express its own
              service category, tone, and accent color.
            </p>
          </div>

          <div className={styles.verticalGrid}>
            {verticalRouteList.map((vertical) => {
              const verticalHref = getVerticalHref(vertical);

              return (
                <article
                  key={vertical.id}
                  className={styles.verticalCard}
                  style={{ '--accent': vertical.accent } as CSSProperties}
                >
                  <span className={styles.verticalIcon}>{vertical.icon}</span>
                  <h3 className={styles.cardTitle}>{vertical.title}</h3>
                  <p className={styles.cardText}>{vertical.description}</p>
                  <Link href={verticalHref} className={styles.inlineLink}>
                    {vertical.cta}
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>How it works</span>
            <h2 className={styles.sectionTitle}>A booking flow your tenants already understand.</h2>
          </div>

          <div className={styles.stepGrid}>
            {steps.map((step) => (
              <article key={step.number} className={styles.stepCard}>
                <span className={styles.stepNumber}>{step.number}</span>
                <h3 className={styles.cardTitle}>{step.title}</h3>
                <p className={styles.cardText}>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} id="services">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Featured services</span>
            <h2 className={styles.sectionTitle}>Use real tenant services when available.</h2>
            <p className={styles.sectionLead}>
              This section reads from the existing service data. If no tenant services are present,
              the UI falls back cleanly without changing any booking logic.
            </p>
          </div>

          {featuredServices.length > 0 ? (
            <div className={styles.servicesGrid}>
              {featuredServices.map((service) => (
                <article
                  key={service.id}
                  className={styles.serviceCard}
                  style={{ '--accent': service.accent } as CSSProperties}
                >
                  <div className={styles.serviceMeta}>
                    <span className={styles.serviceBadge}>{service.vertical}</span>
                    <span className={styles.serviceTenant}>{service.tenantName}</span>
                  </div>
                  <h3 className={styles.cardTitle}>{service.name}</h3>
                  <p className={styles.cardText}>
                    {service.description || 'Premium service ready for online scheduling.'}
                  </p>
                  <div className={styles.serviceFooter}>
                    <div>
                      <span className={styles.priceValue}>{service.price} €</span>
                      <span className={styles.priceMeta}>{service.duration} min</span>
                    </div>
                    <Link
                      href={service.tenantSlug ? `/${service.tenantSlug}/book?service=${service.id}` : bookHref}
                      className={styles.inlineButton}
                    >
                      Select
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyCard}>
              <span className={styles.emptyLabel}>Fallback state</span>
              <h3 className={styles.cardTitle}>No services available yet</h3>
              <p className={styles.cardText}>
                Connect your tenant data or seed the project to showcase real services here.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Testimonials</span>
            <h2 className={styles.sectionTitle}>Proof stays optional, the fallback stays polished.</h2>
          </div>

          {fallbackTestimonials.length > 0 ? null : (
            <div className={styles.emptyCard}>
              <span className={styles.emptyLabel}>Fallback state</span>
              <h3 className={styles.cardTitle}>No testimonials yet</h3>
              <p className={styles.cardText}>
                Add customer reviews later without redesigning the section structure.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.ctaCard}>
            <span className={styles.sectionLabel}>Ready to book?</span>
            <h2 className={styles.ctaTitle}>Start with your tenant, keep the flow familiar.</h2>
            <p className={styles.sectionLead}>
              Reuse the current tenant resolution, service selection, and booking confirmation
              flow while shipping a premium first impression.
            </p>
            <div className={styles.heroActions}>
              <Link href={bookHref} className={styles.primaryButton}>
                Get Started
              </Link>
              <Link href="/platform" className={styles.secondaryButton}>
                Open Admin
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <Link href="/" className={styles.logo}>
                <span className={styles.logoWord}>NEXIFY</span>
                <span className={styles.logoMark}>BOOKING</span>
              </Link>
              <p className={styles.footerText}>
                Premium dark booking UI built around the project&apos;s existing tenant model,
                service data, and confirmation flow.
              </p>
            </div>

            <div>
              <h3 className={styles.footerHeading}>Navigate</h3>
              <div className={styles.footerLinks}>
                <a href="#top">Home</a>
                <a href="#services">Services</a>
                <Link href={bookHref}>Book</Link>
                <Link href="/platform">Admin</Link>
              </div>
            </div>

            <div>
              <h3 className={styles.footerHeading}>Tenants</h3>
              <div className={styles.footerLinks}>
                {tenants.length > 0 ? (
                  tenants.slice(0, 4).map((tenant) => (
                    <Link key={tenant.id} href={`/${tenant.slug}`}>
                      {tenant.name}
                    </Link>
                  ))
                ) : (
                  <span>No tenants yet</span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <span>© 2026 NEXIFY TECH CENTER. All rights reserved.</span>
            <span>Booking-first UI, existing business logic.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
