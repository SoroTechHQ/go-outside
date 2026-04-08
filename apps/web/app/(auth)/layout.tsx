export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-6">
      {children}
    </main>
  );
}
