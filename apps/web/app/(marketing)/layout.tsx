import type { ReactNode } from "react";
import Link from "next/link";
import { InstagramLogo, TwitterLogo, TiktokLogo } from "@phosphor-icons/react/dist/ssr";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen bg-white text-[#0f110f]"
      style={{ colorScheme: "light" }}
    >
      {/* Navbar */}
      <nav
        className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-black/[0.06] px-5 md:px-8"
        style={{ background: "rgba(255,255,255,0.90)", backdropFilter: "blur(16px)" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-[rgba(47,143,69,0.25)] bg-[rgba(47,143,69,0.08)]">
            <span
              className="text-[14px] italic leading-none text-[#2f8f45]"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              G
            </span>
          </div>
          <span
            className="hidden text-[17px] italic text-[#0f110f] sm:block"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            GoOutside
          </span>
        </Link>

        {/* Right CTAs */}
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="flex h-[38px] items-center rounded-full bg-black/[0.04] px-5 text-[13px] font-medium text-[#4a4a4a] transition hover:bg-black/[0.07] hover:text-[#0f110f]"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="flex h-[38px] items-center rounded-full bg-[#2f8f45] px-5 text-[13px] font-bold text-white shadow-[0_2px_12px_rgba(47,143,69,0.30)] transition hover:bg-[#256f36]"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Page content */}
      {children}

      {/* Footer */}
      <footer className="border-t border-black/[0.06] bg-[#f8faf8] px-6 pb-8 pt-14 md:px-12">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-[rgba(47,143,69,0.25)] bg-[rgba(47,143,69,0.08)]">
                <span
                  className="text-[14px] italic leading-none text-[#2f8f45]"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  G
                </span>
              </div>
              <span
                className="text-[17px] italic text-[#0f110f]"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                GoOutside
              </span>
            </Link>
            <p className="text-[14px] font-light text-[#6f6f6f]">Your city is waiting.</p>
            <div className="flex gap-2">
              {[InstagramLogo, TwitterLogo, TiktokLogo].map((Icon, i) => (
                <button
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.05] text-[#6f6f6f] transition hover:text-[#0f110f]"
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#2f8f45]">Platform</p>
            {[
              { label: "Discover Events",  href: "/sign-up" },
              { label: "For Organizers",   href: "/sign-up" },
              { label: "Pricing",          href: "#" },
              { label: "Download App",     href: "#" },
            ].map(({ label, href }) => (
              <div key={label}>
                <Link href={href} className="text-[14px] text-[#6f6f6f] transition hover:text-[#0f110f]">
                  {label}
                </Link>
              </div>
            ))}
          </div>

          {/* Company */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#2f8f45]">Company</p>
            {["About", "Blog", "Careers", "Privacy Policy", "Terms of Service"].map((link) => (
              <div key={link}>
                <Link href="#" className="text-[14px] text-[#6f6f6f] transition hover:text-[#0f110f]">
                  {link}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mx-auto mt-10 flex max-w-5xl flex-col items-center justify-between gap-2 border-t border-black/[0.06] pt-6 sm:flex-row">
          <p className="text-[12px] text-[#a9a9a9]">© 2026 GoOutside. All rights reserved.</p>
          <p className="text-[12px] text-[#a9a9a9]">Made in Accra 🇬🇭</p>
        </div>
      </footer>
    </div>
  );
}
