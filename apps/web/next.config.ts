import type { NextConfig } from "next";

// Clean URL rewrites: /messages → /dashboard/messages (URL stays clean)
const DASHBOARD_REWRITES = [
  "messages",
  "trending",
  "notifications",
  "saved",
  "profile",
  "cart",
  "wallets",
  "checkout",
  "user",
];

function buildContentSecurityPolicy() {
  return [
    `default-src 'self'`,
    `base-uri 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https:`,
    `style-src 'self' 'unsafe-inline' https:`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data: https:`,
    `connect-src 'self' https: wss: blob:`,
    `media-src 'self' blob: https:`,
    `worker-src 'self' blob:`,
    `frame-src 'self' https:`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  transpilePackages: ["@gooutside/demo-data", "@gooutside/ui"],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    // Srcset breakpoints tuned to the app's actual usage (banners, cards, avatars).
    // Fewer buckets = fewer network requests and better cache hit rate.
    deviceSizes: [375, 640, 828, 1080, 1280, 1440, 1920],
    imageSizes: [36, 64, 128, 256, 384, 512],
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
        source: "/tickets",
        destination: "/cart",
        permanent: false,
      },
      {
        source: "/tickets/:path*",
        destination: "/cart/:path*",
        permanent: false,
      },
      {
        source: "/dashboard/activity",
        destination: "/dashboard/notifications",
        permanent: false,
      },
    ];
  },
  async headers() {
    const headers = [
      {
        key: "Content-Security-Policy",
        value: buildContentSecurityPolicy(),
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), geolocation=(self), microphone=(), payment=(), usb=()",
      },
      {
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin-allow-popups",
      },
    ];

    if (process.env.NODE_ENV === "production") {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/:path*",
        headers,
      },
    ];
  },
};

export default nextConfig;
