/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["picsum.photos"],
  },
  async redirects() {
    return [
      {
        source: "/onizleme/pre-campaign",
        destination: "/onizleme/bana-haber-ver",
        permanent: true,
      },
      {
        source: "/onizleme/launch-countdown",
        destination: "/onizleme/geri-sayim",
        permanent: true,
      },
      {
        source: "/onizleme/thanks",
        destination: "/onizleme/tesekkur",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
