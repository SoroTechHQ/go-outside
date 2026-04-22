"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { InstagramLogo, TiktokLogo, TwitterLogo } from "@phosphor-icons/react";

const navColumns = [
  {
    heading: "Discover",
    links: [
      { label: "Explore events", href: "/events" },
      { label: "Categories", href: "/events" },
      { label: "Cities", href: "/events" },
      { label: "Trending", href: "/events" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About GoOutside", href: "/" },
      { label: "Blog", href: "/" },
      { label: "Careers", href: "/" },
      { label: "Press", href: "/" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "FAQ", href: "/" },
      { label: "Contact us", href: "/" },
      { label: "Support", href: "/" },
      { label: "Organizer hub", href: "/organizer" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/" },
      { label: "Terms of Service", href: "/" },
      { label: "Cookie Policy", href: "/" },
      { label: "Accessibility", href: "/" },
    ],
  },
];

const socialLinks = [
  { label: "Instagram", href: "https://instagram.com", Icon: InstagramLogo },
  { label: "X / Twitter", href: "https://twitter.com", Icon: TwitterLogo },
  { label: "TikTok", href: "https://tiktok.com", Icon: TiktokLogo },
];

export function Footer() {
  const [expanded, setExpanded] = useState(false);

  return (
    <footer
      className="relative z-10 border-t border-[color:var(--border-subtle)] bg-[color:var(--bg-app)]"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* ── Expanded content ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="expanded"
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="container-shell pt-10 pb-8">
              {/* Nav grid */}
              <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                {navColumns.map((col) => (
                  <div key={col.heading}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--brand)]">
                      {col.heading}
                    </p>
                    <ul className="mt-3 space-y-2">
                      {col.links.map((link) => (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="my-8 border-t border-[color:var(--border-subtle)]" />

              {/* Powered by + logo */}
              <div className="text-center">
                <Link href="/" className="inline-block">
                  <Image
                    src="/logo-full.png"
                    alt="GoOutside"
                    width={140}
                    height={40}
                    style={{ objectFit: "contain" }}
                  />
                </Link>
                <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                  Social-first event discovery in Ghana.
                </p>
                <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                  Powered by{" "}
                  <a
                    href="https://sorotech.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[var(--brand)] transition hover:brightness-110"
                  >
                    SoroTech
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Minimal always-visible strip ── */}
      <div className="container-shell flex items-center justify-between gap-4 py-4">
        <p className="text-xs text-[var(--text-tertiary)]">
          © 2026 Go Outside. All rights reserved.
        </p>

        {/* Social icons */}
        <div className="flex items-center gap-3">
          {socialLinks.map(({ label, href, Icon }) => (
            <a
              key={label}
              aria-label={label}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border-subtle)] text-[var(--text-tertiary)] transition hover:border-[color:var(--home-highlight-border)] hover:text-[var(--brand)]"
              href={href}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Icon size={16} />
            </a>
          ))}
        </div>
      </div>

      {/* Hover hint indicator */}
      <AnimatePresence>
        {!expanded && (
          <motion.div
            animate={{ opacity: 1 }}
            className="absolute inset-x-0 top-0 flex justify-center"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
          >
            <div className="h-px w-16 bg-[color:var(--home-highlight-border)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}

export default Footer;
