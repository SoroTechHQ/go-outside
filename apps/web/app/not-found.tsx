import Link from "next/link";
import { Button } from "@gooutside/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-lg rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card)] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--neon)]">404</p>
        <h1 className="mt-4 font-display text-5xl italic text-[var(--text-primary)]">
          This page drifted out of the city map.
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
          The frontend shell is live, but this route does not exist in the current demo build.
        </p>
        <div className="mt-8 flex justify-center">
          <Button href="/">Back Home</Button>
        </div>
        <p className="mt-4 text-xs text-[var(--text-tertiary)]">
          Or go to{" "}
          <Link className="font-semibold text-[var(--neon)]" href="/events">
            Explore
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
