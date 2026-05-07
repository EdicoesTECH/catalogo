import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/carrinho",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
