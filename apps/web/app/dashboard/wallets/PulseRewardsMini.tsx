"use client";

import Link from "next/link";
import {
  Ticket,
  Lightning,
  Sparkle,
  Star,
  ArrowRight,
  Gift,
} from "@phosphor-icons/react";
import type { PulseReward, RewardCategory } from "../../../lib/db/rewards";

// ─── Icon + colour per category ──────────────────────────────────────────────

const CATEGORY_META: Record<
  RewardCategory,
  { Icon: React.ElementType; color: string; bg: string }
> = {
  ticket_discount: { Icon: Ticket,    color: "#4a9f63", bg: "rgba(74,159,99,0.12)"  },
  access_perk:     { Icon: Lightning, color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  profile_status:  { Icon: Sparkle,   color: "#818CF8", bg: "rgba(129,140,248,0.12)"},
  organizer_funded:{ Icon: Star,      color: "#FB923C", bg: "rgba(251,146,60,0.12)" },
};

// ─── Single compact card ─────────────────────────────────────────────────────

function MiniRewardCard({
  reward,
  balance,
}: {
  reward: PulseReward;
  balance: number;
}) {
  const { Icon, color, bg } = CATEGORY_META[reward.category];
  const canAfford = balance >= reward.pp_cost;
  const need = reward.pp_cost - balance;

  return (
    <Link href="/dashboard/rewards" className="group block min-w-[148px] max-w-[148px]">
      <div
        className={`flex h-full flex-col rounded-[18px] border p-3.5 transition-all group-hover:scale-[1.015] group-active:scale-[0.98] ${
          canAfford
            ? "border-[var(--border-card)] bg-[var(--bg-card)]"
            : "border-[var(--border-subtle)] bg-[var(--bg-card)] opacity-70"
        }`}
      >
        {/* Icon circle */}
        <div
          className="mb-3 flex h-9 w-9 items-center justify-center rounded-[10px]"
          style={{ backgroundColor: bg }}
        >
          <Icon size={18} weight="fill" style={{ color }} />
        </div>

        {/* Title */}
        <p className="line-clamp-2 flex-1 text-[12px] font-semibold leading-snug text-[var(--text-primary)]">
          {reward.title}
        </p>

        {/* Cost + affordability */}
        <div className="mt-2.5 space-y-1.5">
          <div
            className="inline-flex items-baseline gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              backgroundColor: canAfford ? `${color}18` : "rgba(255,255,255,0.06)",
              color: canAfford ? color : "var(--text-tertiary)",
            }}
          >
            {reward.pp_cost.toLocaleString()} pts
          </div>

          {canAfford ? (
            <p className="text-[9px] font-semibold text-[var(--brand)]">
              ✓ You can redeem
            </p>
          ) : (
            <p className="text-[9px] text-[var(--text-tertiary)]">
              {need.toLocaleString()} pts needed
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── "See all" terminal card ──────────────────────────────────────────────────

function SeeAllCard() {
  return (
    <Link href="/dashboard/rewards" className="group block min-w-[120px] max-w-[120px]">
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-[18px] border border-dashed border-[var(--border-subtle)] bg-transparent px-3 py-4 text-center transition group-hover:border-[var(--brand)]/40 group-hover:bg-[var(--brand)]/5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--brand)]/10 transition group-hover:bg-[var(--brand)]/18">
          <ArrowRight size={16} className="text-[var(--brand)]" weight="bold" />
        </div>
        <p className="text-[11px] font-semibold text-[var(--brand)]">See all</p>
      </div>
    </Link>
  );
}

// ─── Main exported component ─────────────────────────────────────────────────

interface Props {
  balance: number;
  rewards: PulseReward[];
}

export function PulseRewardsMini({ balance, rewards }: Props) {
  if (rewards.length === 0) return null;

  return (
    <section>
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift size={14} className="text-[var(--text-tertiary)]" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Pulse Rewards
          </h2>
        </div>
        <Link
          href="/dashboard/rewards"
          className="flex items-center gap-1 text-[11px] font-semibold text-[var(--brand)] transition hover:opacity-70"
        >
          View all
          <ArrowRight size={11} weight="bold" />
        </Link>
      </div>

      {/* Balance pill */}
      <div className="mb-3 flex items-center gap-2">
        <div
          className="inline-flex items-baseline gap-1 rounded-full px-3 py-1 text-[11px] font-bold"
          style={{
            backgroundColor: "rgba(245,158,11,0.12)",
            color: "#F59E0B",
            border: "1px solid rgba(245,158,11,0.25)",
          }}
        >
          <span>{balance.toLocaleString()}</span>
          <span className="font-normal opacity-70">Pulse Points available</span>
        </div>
      </div>

      {/* Scrollable row */}
      <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
        {rewards.slice(0, 8).map((r) => (
          <MiniRewardCard key={r.id} reward={r} balance={balance} />
        ))}
        <SeeAllCard />
      </div>
    </section>
  );
}
