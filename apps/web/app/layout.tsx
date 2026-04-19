import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeScript } from "@gooutside/ui";
import NextTopLoader from "nextjs-toploader";
import "stream-chat-react/dist/css/v2/index.css";
import { ConditionalChrome } from "../components/layout/ConditionalChrome";
import { AppShellProvider } from "../components/layout/AppShellContext";
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

export const metadata: Metadata = {
  title: "GoOutside",
  description: "Social-first event discovery and platform for Ghana.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${interBody.variable} ${interDisplay.variable} font-body lab-bg relative`}>
        <NextTopLoader color="#2f8f45" height={3} showSpinner={false} easing="ease" speed={300} />
        <ClerkProvider>
          <Providers>
            <ThemeScript />
            <AppShellProvider>
              <ConditionalChrome>{children}</ConditionalChrome>
            </AppShellProvider>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
