import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen p-24">
      <h1 className="text-4xl font-bold mb-8">NEXIFY TECH CENTER</h1>
      <p className="text-lg mb-4">White-Label Booking SaaS Platform</p>
      <div className="flex gap-4">
        <Link
          href="/demo-clinic/book"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Demo Booking
        </Link>
        <Link
          href="/platform"
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Platform Admin
        </Link>
      </div>
    </main>
  );
}