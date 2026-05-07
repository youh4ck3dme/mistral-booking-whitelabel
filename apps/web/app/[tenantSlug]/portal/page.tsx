'use client';

import { useParams } from 'next/navigation';

export default function ClientPortalPage() {
  const params = useParams<{ tenantSlug: string }>();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Client Portal - {params.tenantSlug}
      </h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Your Bookings</h2>
        <p className="text-gray-600">View and manage your bookings here.</p>
      </div>
    </div>
  );
}