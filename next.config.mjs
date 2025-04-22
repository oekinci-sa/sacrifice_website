/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["picsum.photos"], // Harici resim URL'sine izin ver
  },

  // API yolları için Cache-Control headerları ekle
  async headers() {
    return [
      {
        // Tüm API yolları için
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' }
        ],
      },
    ]
  },
};

export default nextConfig;
