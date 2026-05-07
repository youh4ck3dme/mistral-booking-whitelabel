import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold mb-4">NEXIFY TECH CENTER</h1>
      <p className="text-lg text-gray-600 mb-8">
        White-Label Booking SaaS Platform
      </p>
      <div className="flex gap-4">
        <Link
          href="/demo-clinic/book"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
        >
          Demo Booking
        </Link>
        <Link
          href="/platform"
          className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900"
        >
          Platform Admin
        </Link>
      </div>
    </div>
  );
}