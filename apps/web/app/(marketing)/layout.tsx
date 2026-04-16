import type { ReactNode } from "react";
import Link from "next/link";
import { InstagramLogo, TwitterLogo, TiktokLogo } from "@phosphor-icons/react/dist/ssr";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    // color-scheme: dark forces browser chrome (scrollbars, inputs) to stay dark
    // regardless of the visitor's system theme setting
    <div className="min-h-screen bg-[#020702] text-[#F5FFF0]" style={{ colorScheme: "dark" }}>
      {/* Navbar */}
      <nav
        className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[rgba(95,191,42,0.06)] px-5 md:px-8"
        style={{ background: "rgba(2,7,2,0.85)", backdropFilter: "blur(16px)" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-[rgba(95,191,42,0.2)] bg-[rgba(95,191,42,0.15)]"
          >
            <span
              className="text-[14px] italic leading-none text-[#5FBF2A]"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              G
            </span>
          </div>
          <span
            className="hidden text-[17px] italic text-[#F5FFF0] sm:block"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            GoOutside
          </span>
        </Link>

        {/* Right CTAs */}
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="flex h-[38px] items-center rounded-full bg-[rgba(255,255,255,0.04)] px-5 text-[13px] font-medium text-[#6B8C6B] transition hover:bg-[rgba(255,255,255,0.08)] hover:text-[#F5FFF0]"
          >
            Sign in
          </Link>
          <Link
            href="/waitlist"
            className="flex h-[38px] items-center rounded-full bg-[#5FBF2A] px-5 text-[13px] font-bold text-[#020702] shadow-[0_0_18px_rgba(95,191,42,0.25)] transition hover:brightness-110"
          >
            Join Waitlist
          </Link>
        </div>
      </nav>

      {/* Page content */}
      {children}

      {/* Footer */}
      <footer className="border-t border-[rgba(95,191,42,0.06)] bg-[#080D08] px-6 pb-8 pt-14 md:px-12">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-3">
          {/* Brand column */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-[rgba(95,191,42,0.2)] bg-[rgba(95,191,42,0.15)]">
                <span
                  className="text-[14px] italic leading-none text-[#5FBF2A]"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  G
                </span>
              </div>
              <span
                className="text-[17px] italic text-[#F5FFF0]"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                GoOutside
              </span>
            </Link>
            <p className="text-[14px] font-light text-[#6B8C6B]">Your city is waiting.</p>
            <div className="flex gap-2">
              {[InstagramLogo, TwitterLogo, TiktokLogo].map((Icon, i) => (
                <button
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.04)] text-[#6B8C6B] transition hover:text-[#F5FFF0]"
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Platform column */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5FBF2A]">Platform</p>
            {["Discover Events", "For Organizers", "Pricing", "Download App"].map((link) => (
              <div key={link}>
                <Link href="/waitlist" className="text-[14px] text-[#6B8C6B] transition hover:text-[#F5FFF0]">
                  {link}
                </Link>
              </div>
            ))}
          </div>

          {/* Company column */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5FBF2A]">Company</p>
            {["About", "Blog", "Careers", "Privacy Policy", "Terms of Service"].map((link) => (
              <div key={link}>
                <Link href="#" className="text-[14px] text-[#6B8C6B] transition hover:text-[#F5FFF0]">
                  {link}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mx-auto mt-10 flex max-w-5xl flex-col items-center justify-between gap-2 border-t border-[rgba(95,191,42,0.05)] pt-6 sm:flex-row">
          <p className="text-[12px] text-[#4A6A4A]">© 2026 GoOutside. All rights reserved.</p>
          <p className="text-[12px] text-[#4A6A4A]">Made in Accra 🇬🇭</p>
        </div>
      </footer>
    </div>
  );
}
