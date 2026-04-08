export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="page-grid flex min-h-screen items-center justify-center bg-[var(--bg-base)] p-6 pb-24">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
