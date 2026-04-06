/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from Supabase storage and dispensary CDNs
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.iheartjane.com' },
      { protocol: 'https', hostname: '*.dutchie.com' },
      { protocol: 'https', hostname: '*.trulieve.com' },
      { protocol: 'https', hostname: '*.curaleaf.com' },
    ],
  },
};

module.exports = nextConfig;
