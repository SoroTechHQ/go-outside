"use client";

import { useState } from "react";
import { Warning, ArrowRight, Lock } from "@phosphor-icons/react";

export default function SiteGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || "Incorrect password.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div
      style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" }}
      className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#0c0f0d]"
    >
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-12">
          <span className="w-9 h-9 rounded-xl bg-[#0f110f] dark:bg-white/10 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="4.5" fill="#2f8f45" />
              <circle cx="10" cy="10" r="8.5" stroke="white" strokeWidth="1.5" />
            </svg>
          </span>
          <span className="text-[18px] font-bold tracking-tight text-[#0f110f] dark:text-white">
            GoOutside
          </span>
        </div>

        {/* Construction icon */}
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-2xl bg-[#fff4e0] dark:bg-[#2a1f0a] border border-[#f5d6a8] dark:border-[#4a3010] flex items-center justify-center">
            <Warning size={44} weight="duotone" className="text-[#c97c1a]" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#c97c1a] flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">!</span>
          </div>
        </div>

        {/* Under construction badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fff4e0] dark:bg-[#2a1f0a] border border-[#f5d6a8] dark:border-[#4a3010] mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c97c1a]" />
          <span className="text-[12px] font-medium text-[#c97c1a]">Site under construction</span>
        </div>

        {/* Headline */}
        <h1 className="text-[36px] sm:text-[48px] font-bold leading-[1.1] tracking-tight text-[#0f110f] dark:text-white mb-4 max-w-md">
          We're building something great.
        </h1>

        <p className="text-[16px] text-[#6f6f6f] dark:text-white/50 leading-relaxed max-w-sm mb-2">
          GoOutside is almost here — the social-first events app built for Ghana.
        </p>
        <p className="text-[15px] text-[#a9a9a9] dark:text-white/30 mb-10">
          Come back soon. 👋
        </p>

        {/* Waitlist CTA */}
        <a
          href="/waitlist"
          className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-[#2f8f45] text-white text-[14px] font-semibold hover:bg-[#256f36] transition-colors mb-3"
        >
          Join the Waitlist
          <ArrowRight size={16} weight="bold" />
        </a>

        <p className="text-[12px] text-[#a9a9a9] dark:text-white/25">
          No spam. We'll reach out when early access opens.
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-[#ececec] dark:border-white/8" />

      {/* Admin password strip */}
      <div className="px-6 py-6 flex flex-col items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Lock size={12} weight="bold" className="text-[#c0c0c0] dark:text-white/25" />
          <p className="text-[12px] text-[#c0c0c0] dark:text-white/25 font-medium">Are you an admin?</p>
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full max-w-xs">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
            className="flex-1 h-9 px-3 rounded-lg bg-white dark:bg-white/8 border border-[#e0e0e0] dark:border-white/12 text-[13px] text-[#0f110f] dark:text-white placeholder-[#c0c0c0] dark:placeholder-white/25 outline-none focus:border-[#a9a9a9] dark:focus:border-white/30 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !password}
            className="h-9 px-4 rounded-lg bg-[#ececec] dark:bg-white/10 text-[#0f110f] dark:text-white text-[13px] font-medium hover:bg-[#e0e0e0] dark:hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {loading ? "…" : "Enter"}
          </button>
        </form>

        {error && (
          <p className="text-[12px] text-[#e85d8a]">{error}</p>
        )}
      </div>
    </div>
  );
}
