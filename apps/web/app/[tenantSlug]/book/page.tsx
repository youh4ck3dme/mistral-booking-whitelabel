'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@repo/supabase-client';

export default function BookingPage() {
  const params = useParams<{ tenantSlug: string }>();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_slug', params.tenantSlug);
      
      if (error) {
        console.error('Error fetching services:', error);
      } else {
        setServices(data || []);
      }
      setLoading(false);
    };
    
    fetchServices();
  }, [params.tenantSlug]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Book a Service</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((service) => (
          <div key={service.id} className="border p-4 rounded-lg">
            <h2 className="text-xl font-semibold">{service.name}</h2>
            <p className="text-gray-600">{service.description}</p>
            <button className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
              Book Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}