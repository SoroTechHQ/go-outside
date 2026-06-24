import {
  Bank,
  CurrencyDollar,
  Info,
  Lock,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function OrganizerPayoutsPage() {
  return (
    <div className="p-5 md:p-7 space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Settings</p>
        <h1 className="mt-0.5 text-[1.6rem] font-bold tracking-tight text-[var(--text-primary)]">Payouts</h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Configure how and when you receive ticket revenue.</p>
      </div>

      {/* Coming soon notice */}
      <div className="rounded-[20px] border border-amber-500/20 bg-amber-500/8 p-6">
        <div className="flex items-start gap-4">
          <Warning size={24} weight="fill" className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <h3 className="text-[15px] font-bold text-[var(--text-primary)]">Payouts coming soon</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              We&apos;re building our payout system with Paystack and mobile money. You&apos;ll be able to set your payout schedule, link your bank account or Mobile Money number, and withdraw your ticket revenue directly.
            </p>
          </div>
        </div>
      </div>

      {/* What's coming */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Bank, title: "Bank transfer", desc: "Link a GHS bank account for automatic weekly transfers.", color: "#3b82f6" },
          { icon: CurrencyDollar, title: "Mobile Money", desc: "Receive payouts to MTN MoMo, Telecel Cash, or AirtelTigo.", color: "#f59e0b" },
          { icon: Lock, title: "Escrow protection", desc: "Revenue held securely until 48h after your event ends.", color: "#8b5cf6" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_2px_8px_rgba(5,12,8,0.04)] opacity-70">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px]" style={{ background: `${item.color}1a` }}>
                <Icon size={20} weight="fill" style={{ color: item.color }} />
              </div>
              <h3 className="mt-3 text-[13px] font-semibold text-[var(--text-primary)]">{item.title}</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Paystack notice */}
      <div className="flex items-start gap-3 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
        <Info size={15} className="mt-0.5 shrink-0 text-[var(--text-tertiary)]" />
        <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
          Payments are processed via Paystack. Currently, successful payments complete but tickets are not yet automatically created — this is being resolved.
          Contact <Link href="mailto:hello@gooutside.com.gh" className="font-semibold text-[var(--brand)] hover:underline">hello@gooutside.com.gh</Link> to manually reconcile any completed orders.
        </p>
      </div>
    </div>
  );
}
