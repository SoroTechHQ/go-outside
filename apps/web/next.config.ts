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

function toOrigin(value: string | undefined) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function buildContentSecurityPolicy() {
  const connectSources = new Set<string>([
    "'self'",
    "https:",
    "wss:",
    "blob:",
  ]);

  const frameSources = new Set<string>([
    "'self'",
    "https://*.clerk.com",
    "https://*.clerk.accounts.dev",
  ]);

  const scriptSources = new Set<string>([
    "'self'",
    "'unsafe-inline'",
    "https://maps.googleapis.com",
    "https://maps.gstatic.com",
    "https://*.clerk.com",
    "https://*.clerk.accounts.dev",
  ]);

  if (process.env.NODE_ENV !== "production") {
    scriptSources.add("'unsafe-eval'");
  }

  const supabaseOrigin = toOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (supabaseOrigin) {
    connectSources.add(supabaseOrigin);
    frameSources.add(supabaseOrigin);
  }

  return [
    `default-src 'self'`,
    `base-uri 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `form-action 'self'`,
    `script-src ${Array.from(scriptSources).join(" ")}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `connect-src ${Array.from(connectSources).join(" ")}`,
    `media-src 'self' blob: https:`,
    `worker-src 'self' blob:`,
    `frame-src ${Array.from(frameSources).join(" ")}`,
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
