/** @type {import('next').NextConfig} */
const buildTimeSupabaseUrl = 'http://127.0.0.1:54321';
const buildTimeSupabaseAnonKey = 'build-time-placeholder-key';

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@repo/ai', '@repo/core', '@repo/supabase', '@repo/ui'],
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? buildTimeSupabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? buildTimeSupabaseAnonKey,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

module.exports = nextConfig;
