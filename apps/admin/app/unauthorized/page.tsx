import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--bg-base)] px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
        <span className="text-4xl">🚫</span>
      </div>
      <div>
        <h1 className="text-[24px] font-bold text-[var(--text-primary)]">Access Denied</h1>
        <p className="mt-2 text-[14px] text-[var(--text-tertiary)]">
          You need admin privileges to access this dashboard.
        </p>
      </div>
      <Link
        href="https://gooutside.app"
        className="rounded-2xl bg-[var(--brand)] px-6 py-3 text-[14px] font-semibold text-white transition hover:opacity-90"
      >
        Back to GoOutside
      </Link>
    </main>
  );
}
