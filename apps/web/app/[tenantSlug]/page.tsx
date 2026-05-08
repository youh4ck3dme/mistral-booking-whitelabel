import { createServerClient } from '@repo/supabase';
import { getTenantContext } from '../../src/lib/tenant/tenant.service';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function TenantHomePage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const tenantContext = await getTenantContext(params.tenantSlug, session?.user?.id);
  
  if (!tenantContext) {
    redirect('/404');
  }

  // Fetch services for this tenant
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', tenantContext.tenant.id)
    .eq('is_active', true);

  const primaryColor = tenantContext.branding?.primary_color || '#3B82F6';

  return (
    <div className="max-w-4xl mx-auto">
      <section className="mb-12">
        <h1 className="text-3xl font-bold mb-4">Vitajte v {tenantContext.tenant.name}!</h1>
        <p className="text-lg text-gray-600">
          Vyberte si z našich služieb a rezervujte si termín online.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Naše služby</h2>
        {services && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-lg">
                    {service.price} € / {service.duration} min
                  </span>
                </div>
                <Link
                  href={`/${params.tenantSlug}/book?service=${service.id}`}
                  className="block w-full text-center py-2 px-4 rounded-md text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  Rezervovať
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Žiadne aktívne služby.</p>
        )}
      </section>

      <section className="bg-gray-50 p-8 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Ako to funguje</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Vyberte si službu z ponuky</li>
          <li>Zvoľte si termín, ktorý vám vyhovuje</li>
          <li>Potvrďte rezerváciu</li>
          <li>Príde vám potvrdzovací email</li>
        </ol>
      </section>
    </div>
  );
}
