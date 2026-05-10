import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Inter } from "next/font/google";
import { ThemeScript } from "@gooutside/ui";
import { SidebarProvider } from "../context/SidebarContext";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "GoOutside Admin",
  description: "Organizer and platform admin frontend for GoOutside.",
  icons: {
    icon: "/favicon-icon.png",
    apple: "/favicon-icon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${inter.variable} font-body`}>
        <ThemeScript />
        <SidebarProvider>{children}</SidebarProvider>
      </body>
    </html>
  );
}
