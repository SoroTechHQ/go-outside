"use client";

import Link from "next/link";
import { demoData } from "@gooutside/demo-data";
import { Button, ThemeToggle } from "@gooutside/ui";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[color:var(--bg-base)]/88 backdrop-blur">
      <div className="container-shell flex items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-display text-3xl italic text-[var(--text-primary)]">
            GoOutside
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            {demoData.navigation.publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button className="hidden sm:inline-flex" href="/dashboard" variant="ghost">
            Attendee View
          </Button>
          <Button href="/events">Explore</Button>
        </div>
      </div>
    </header>
  );
}
