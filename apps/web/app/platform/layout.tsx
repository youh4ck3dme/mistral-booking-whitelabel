import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NEXIFY TECH CENTER - Platform Admin',
  description: 'Global platform administration.',
};

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sk">
      <body>
        <header className="bg-gray-800 text-white p-4">
          <h1 className="text-xl font-bold">Platform Admin</h1>
        </header>
        <main className="container mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}