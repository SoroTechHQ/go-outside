import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-[#0f110f]" style={{ colorScheme: "light" }}>
      <nav
        className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-black/[0.06] px-5 md:px-8"
        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-mini.png" alt="GoOutside" width={28} height={28} className="block sm:hidden" priority />
          <Image src="/logo-full.png" alt="GoOutside" width={120} height={36} className="hidden sm:block" priority style={{ objectFit: "contain" }} />
        </Link>
        <div className="flex items-center gap-4 text-[13px] text-[#6f6f6f]">
          <Link href="/privacy" className="transition hover:text-[#0f110f]">Privacy</Link>
          <Link href="/terms" className="transition hover:text-[#0f110f]">Terms</Link>
          <Link href="/cookies" className="transition hover:text-[#0f110f]">Cookies</Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-16">
        {children}
      </main>

      <footer className="border-t border-black/[0.06] px-5 py-8 text-center">
        <p className="text-[13px] text-[#a9a9a9]">
          © {new Date().getFullYear()} GoOutside · Operated by Soro Technologies · Accra, Ghana
        </p>
        <div className="mt-3 flex items-center justify-center gap-5 text-[12px] text-[#c0c0c0]">
          <Link href="/privacy" className="transition hover:text-[#6f6f6f]">Privacy Policy</Link>
          <Link href="/terms" className="transition hover:text-[#6f6f6f]">Terms of Service</Link>
          <Link href="/cookies" className="transition hover:text-[#6f6f6f]">Cookie Policy</Link>
          <a href="mailto:privacy@gooutside.app" className="transition hover:text-[#6f6f6f]">Contact</a>
        </div>
      </footer>
    </div>
  );
}
