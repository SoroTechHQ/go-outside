"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { ShieldWarning, SignOut, SignIn } from "@phosphor-icons/react";
import Link from "next/link";

export default function UnauthorizedPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--bg-base)] px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
        <ShieldWarning size={40} weight="duotone" className="text-red-500" />
      </div>

      <div>
        <h1 className="text-[24px] font-bold text-[var(--text-primary)]">Access Denied</h1>
        <p className="mt-2 text-[14px] text-[var(--text-tertiary)]">
          You need admin privileges to access this dashboard.
        </p>
      </div>

      {isLoaded && user && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-4 text-left w-full max-w-xs">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
            Signed in as
          </p>
          <p className="text-[14px] font-medium text-[var(--text-primary)] truncate">
            {user.fullName || user.username || "Unknown"}
          </p>
          <p className="text-[12px] text-[var(--text-tertiary)] truncate">
            {user.primaryEmailAddress?.emailAddress}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="https://gooutside.club"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] px-6 py-3 text-[14px] font-semibold text-white transition hover:opacity-90"
        >
          Back to GoOutside
        </Link>

        {isLoaded && user ? (
          <button
            onClick={() => signOut({ redirectUrl: "/sign-in" })}
            className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-3 text-[14px] font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-hover)]"
          >
            <SignOut size={16} weight="bold" />
            Sign out
          </button>
        ) : (
          <Link
            href="/sign-in"
            className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-3 text-[14px] font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-hover)]"
          >
            <SignIn size={16} weight="bold" />
            Sign in with a different account
          </Link>
        )}
      </div>
    </main>
  );
}
