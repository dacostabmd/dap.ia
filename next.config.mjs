/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "dapadvocacia.com.br" },
      { protocol: "https", hostname: "brunoduraooficial.com.br" },
    ],
  },
};

export default nextConfig;
