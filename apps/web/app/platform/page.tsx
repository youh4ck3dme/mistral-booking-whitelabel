import Link from 'next/link';

export default function PlatformDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Platform Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/platform/tenants"
          className="bg-white p-4 rounded-lg shadow hover:bg-gray-50"
        >
          <h2 className="text-lg font-semibold">Manage Tenants</h2>
          <p className="text-gray-600">View and manage all tenants.</p>
        </Link>
        <Link
          href="/platform/settings"
          className="bg-white p-4 rounded-lg shadow hover:bg-gray-50"
        >
          <h2 className="text-lg font-semibold">Platform Settings</h2>
          <p className="text-gray-600">Configure global settings.</p>
        </Link>
      </div>
    </div>
  );
}