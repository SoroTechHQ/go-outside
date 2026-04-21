import type { NextConfig } from "next";

// Clean URL rewrites: /messages → /dashboard/messages (URL stays clean)
const DASHBOARD_REWRITES = [
  "messages",
  "trending",
  "notifications",
  "saved",
  "profile",
  "tickets",
  "wallets",
  "checkout",
  "user",
];

const nextConfig: NextConfig = {
  transpilePackages: ["@gooutside/demo-data", "@gooutside/ui"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
    ],
  },
  async rewrites() {
    return DASHBOARD_REWRITES.flatMap((segment) => [
      // /messages → /dashboard/messages
      {
        source: `/${segment}`,
        destination: `/dashboard/${segment}`,
      },
      // /messages/anything → /dashboard/messages/anything
      {
        source: `/${segment}/:path*`,
        destination: `/dashboard/${segment}/:path*`,
      },
    ]);
  },
  async redirects() {
    return [
      {
        source: "/activity",
        destination: "/notifications",
        permanent: false,
      },
      {
        source: "/dashboard/activity",
        destination: "/dashboard/notifications",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
