'use client';

import { useParams } from 'next/navigation';

export default function TenantAdminPage() {
  const params = useParams<{ tenantSlug: string }>();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Admin Dashboard - {params.tenantSlug}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Bookings</h2>
          <p className="text-gray-600">Manage bookings</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Services</h2>
          <p className="text-gray-600">Manage services</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Staff</h2>
          <p className="text-gray-600">Manage staff</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Settings</h2>
          <p className="text-gray-600">Tenant settings</p>
        </div>
      </div>
    </div>
  );
}