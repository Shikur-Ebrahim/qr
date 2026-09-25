import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure server-only modules aren't bundled for the browser
  serverExternalPackages: ["firebase-admin"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent firebase-admin from being bundled on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
