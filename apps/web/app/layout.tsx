import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { ThemeScript } from "@gooutside/ui";
import { ConditionalChrome } from "../components/layout/ConditionalChrome";
import { AppShellProvider } from "../components/layout/AppShellContext";
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
        <ThemeScript />
        <AppShellProvider>
          <ConditionalChrome>{children}</ConditionalChrome>
        </AppShellProvider>
      </body>
    </html>
  );
}
