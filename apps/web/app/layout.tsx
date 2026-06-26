import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeScript } from "@gooutside/ui";
import NextTopLoader from "nextjs-toploader";
import "stream-chat-react/dist/css/v2/index.css";
import { ConditionalChrome } from "../components/layout/ConditionalChrome";
import { AppShellProvider } from "../components/layout/AppShellContext";
import { TrackingProvider } from "../components/tracking/TrackingProvider";
import { AlphaProvider } from "../components/alpha/AlphaProvider";
import { Providers } from "./providers";
import "./globals.css";

const interBody = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

const interDisplay = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gooutside.club";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "GoOutside", template: "%s | GoOutside" },
  description: "Social-first event discovery for Ghana. Find events, earn Outside Score, go out.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon-icon.png",
    apple: "/favicon-icon.png",
  },
  openGraph: {
    siteName: "GoOutside",
    title: "GoOutside — What's on in Accra?",
    description: "Social-first event discovery for Ghana. Find events, earn Outside Score, go out.",
    images: [{ url: `/api/og?type=default`, width: 1200, height: 630, alt: "GoOutside" }],
    type: "website",
    locale: "en_GH",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoOutside — What's on in Accra?",
    description: "Social-first event discovery for Ghana.",
    images: [`/api/og?type=default`],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${interBody.variable} ${interDisplay.variable} font-body lab-bg relative`}>
        <NextTopLoader color="#2f8f45" height={3} showSpinner={false} easing="ease" speed={300} />
        <ClerkProvider>
          <Providers>
            <ThemeScript />
            <TrackingProvider>
              <AppShellProvider>
                <AlphaProvider>
                  <ConditionalChrome>{children}</ConditionalChrome>
                </AlphaProvider>
              </AppShellProvider>
            </TrackingProvider>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
