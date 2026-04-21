"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Lightning,
  Star,
  Trophy,
  CheckCircle,
  Lock,
  X,
  ArrowRight,
  Ticket,
  Sparkle,
  Moon,
  Users,
  Calendar,
  MapTrifold,
  CurrencyDollar,
  UsersFour,
  Microphone,
  Rocket,
  Diamond,
  ArrowLeft,
} from "@phosphor-icons/react";
import type {
  PulseReward,
  LedgerEntry,
  RewardsBadge,
  PulsePointsSummary,
  RewardCategory,
} from "../../../lib/db/rewards";

// ─── Icon mappings ────────────────────────────────────────────────────────────

type IconComponent = React.ElementType;

const CATEGORY_META: Record<
  RewardCategory,
  { Icon: IconComponent; color: string; bg: string }
> = {
  ticket_discount:  { Icon: Ticket,    color: "#4a9f63", bg: "rgba(74,159,99,0.14)"   },
  access_perk:      { Icon: Lightning, color: "#F59E0B", bg: "rgba(245,158,11,0.14)"  },
  profile_status:   { Icon: Sparkle,   color: "#818CF8", bg: "rgba(129,140,248,0.14)" },
  organizer_funded: { Icon: Star,      color: "#FB923C", bg: "rgba(251,146,60,0.14)"  },
};

const BADGE_ICON_MAP: Record<string, IconComponent> = {
  Ticket,
  Users,
  Moon,
  Star,
  Trophy,
  Calendar,
  MapTrifold,
  CurrencyDollar,
  UsersFour,
  Microphone,
  Rocket,
  Diamond,
};

function BadgeIcon({
  iconKey,
  size = 18,
  className,
}: {
  iconKey: string;
  size?: number;
  className?: string;
}) {
  const Icon = BADGE_ICON_MAP[iconKey] ?? Star;
  return <Icon size={size} weight="fill" className={className} />;
}

const PP_COLOR = "#F59E0B";

function ptsLabel(n: number) {
  return `${n.toLocaleString()} pts`;
}

function formatLedgerDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GH", {
    month: "short",
    day: "numeric",
  });
}

function formatBadgeDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  value,
  sub,
  label,
  highlight,
}: {
  value: string;
  sub: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="flex flex-1 flex-col items-center gap-0.5 rounded-[18px] border px-3 py-4 text-center"
      style={{
        background: highlight ? `${PP_COLOR}10` : "var(--bg-card)",
        borderColor: highlight ? `${PP_COLOR}30` : "var(--border-subtle)",
      }}
    >
      <span
        className="text-[1.4rem] font-bold leading-tight"
        style={{ color: highlight ? PP_COLOR : "var(--text-primary)" }}
      >
        {value}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
        {sub}
      </span>
      <span className="mt-0.5 text-[10px] text-[var(--text-secondary)]">{label}</span>
    </div>
  );
}

// ─── Rewards Shop ─────────────────────────────────────────────────────────────

type ShopFilter = "all" | RewardCategory;

const SHOP_FILTERS: { id: ShopFilter; label: string }[] = [
  { id: "all",               label: "All" },
  { id: "ticket_discount",   label: "Discounts" },
  { id: "access_perk",       label: "Access" },
  { id: "profile_status",    label: "Status" },
  { id: "organizer_funded",  label: "Organizer" },
];

function RewardCard({
  reward,
  balance,
  onRedeem,
}: {
  reward: PulseReward;
  balance: number;
  onRedeem: (r: PulseReward) => void;
}) {
  const { Icon, color, bg } = CATEGORY_META[reward.category];
  const canAfford = balance >= reward.pp_cost;
  const need = reward.pp_cost - balance;
  const soldOut = reward.remaining_qty !== null && reward.remaining_qty <= 0;

  return (
    <div
      className={`relative flex flex-col rounded-[20px] border p-4 transition-all ${
        canAfford && !soldOut
          ? "border-[var(--border-card)] bg-[var(--bg-card)]"
          : "border-[var(--border-subtle)] bg-[var(--bg-card)] opacity-60"
      }`}
    >
      {/* Points cost — top right */}
      <div
        className="absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
        style={{
          backgroundColor: canAfford ? `${PP_COLOR}18` : "rgba(255,255,255,0.06)",
          color: canAfford ? PP_COLOR : "var(--text-tertiary)",
          border: `1px solid ${canAfford ? `${PP_COLOR}38` : "rgba(255,255,255,0.08)"}`,
        }}
      >
        {ptsLabel(reward.pp_cost)}
      </div>

      {/* Category icon */}
      <div
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-[12px]"
        style={{ backgroundColor: bg }}
      >
        <Icon size={20} weight="fill" style={{ color }} />
      </div>

      {/* Title */}
      <p className="pr-14 text-[13px] font-bold leading-snug text-[var(--text-primary)]">
        {reward.title}
      </p>

      {/* Description */}
      <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-secondary)]">
        {reward.description}
      </p>

      {/* Discount value box */}
      {reward.discount_ghs !== null && (
        <div className="mt-3 rounded-[10px] border border-dashed border-[var(--border-subtle)] px-3 py-2 text-center">
          <span className="text-[15px] font-bold text-[var(--text-primary)]">
            GHS {reward.discount_ghs}
          </span>
          <span className="ml-1 text-[10px] text-[var(--text-tertiary)]">off</span>
        </div>
      )}

      {/* Remaining quantity */}
      {reward.remaining_qty !== null && reward.remaining_qty > 0 && (
        <p className="mt-2 text-[9px] text-[var(--text-tertiary)]">
          {reward.remaining_qty} remaining
        </p>
      )}

      {/* CTA */}
      <div className="mt-4">
        {soldOut ? (
          <div className="flex w-full items-center justify-center gap-1.5 rounded-[12px] bg-white/5 py-2.5 text-[12px] font-semibold text-[var(--text-tertiary)]">
            Sold out
          </div>
        ) : canAfford ? (
          <button
            type="button"
            onClick={() => onRedeem(reward)}
            className="flex w-full items-center justify-center gap-1.5 rounded-[12px] py-2.5 text-[12px] font-bold text-[var(--brand-contrast)] transition hover:brightness-110 active:scale-[0.97]"
            style={{ backgroundColor: "var(--brand)" }}
          >
            Redeem
            <ArrowRight size={13} weight="bold" />
          </button>
        ) : (
          <div className="space-y-1">
            <div className="flex w-full items-center justify-center gap-1.5 rounded-[12px] bg-white/5 py-2.5 text-[12px] font-semibold text-[var(--text-tertiary)]">
              <Lock size={12} />
              Need {ptsLabel(need)} more
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RewardsShopTab({
  rewards,
  balance,
  onRedeem,
}: {
  rewards: PulseReward[];
  balance: number;
  onRedeem: (r: PulseReward) => void;
}) {
  const [filter, setFilter] = useState<ShopFilter>("all");

  const filtered =
    filter === "all" ? rewards : rewards.filter((r) => r.category === filter);

  return (
    <div>
      {/* Balance + intro */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
          Redeem your Pulse Points for exclusive discounts, early access, and more.
        </p>
        <div
          className="shrink-0 rounded-full px-3 py-1 text-[11px] font-bold"
          style={{
            backgroundColor: `${PP_COLOR}15`,
            color: PP_COLOR,
            border: `1px solid ${PP_COLOR}35`,
          }}
        >
          {ptsLabel(balance)}
        </div>
      </div>

      {/* Category filters */}
      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4">
        {SHOP_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${
              filter === f.id
                ? "bg-[var(--brand)] text-[var(--brand-contrast)]"
                : "border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-[var(--text-tertiary)]">
          No rewards in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((r) => (
            <RewardCard
              key={r.id}
              reward={r}
              balance={balance}
              onRedeem={onRedeem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Redemption Modal ─────────────────────────────────────────────────────────

function RedeemModal({
  reward,
  balance,
  onClose,
  onSuccess,
}: {
  reward: PulseReward;
  balance: number;
  onClose: () => void;
  onSuccess: (newBalance: number, code: string) => void;
}) {
  const [step, setStep] = useState<"confirm" | "success" | "error">("confirm");
  const [couponCode, setCouponCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const { Icon, color, bg } = CATEGORY_META[reward.category];

  function handleConfirm() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/rewards/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rewardId: reward.id }),
        });
        const json = (await res.json()) as {
          coupon_code?: string;
          balance_after?: number;
          error?: string;
        };
        if (!res.ok) {
          setErrorMsg(json.error ?? "Redemption failed");
          setStep("error");
          return;
        }
        setCouponCode(json.coupon_code ?? "");
        onSuccess(json.balance_after ?? balance - reward.pp_cost, json.coupon_code ?? "");
        setStep("success");
      } catch {
        setErrorMsg("Something went wrong. Please try again.");
        setStep("error");
      }
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={() => step !== "success" && !isPending && onClose()}
      />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="relative w-full max-w-sm rounded-[24px] border border-[var(--border-card)] bg-[var(--bg-elevated)] p-6 shadow-2xl"
      >
        {step === "confirm" && (
          <>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1.5 text-[var(--text-tertiary)] transition hover:bg-white/8 hover:text-[var(--text-primary)]"
            >
              <X size={16} />
            </button>

            {/* Icon */}
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-[14px]"
              style={{ backgroundColor: bg }}
            >
              <Icon size={22} weight="fill" style={{ color }} />
            </div>

            <p className="text-[17px] font-bold text-[var(--text-primary)]">
              Redeem {reward.title}?
            </p>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
              {reward.description}
            </p>

            {/* Balance preview */}
            <div className="mt-4 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-card)] divide-y divide-[var(--border-subtle)]">
              <div className="flex items-center justify-between px-4 py-3 text-[12px]">
                <span className="text-[var(--text-secondary)]">Current balance</span>
                <span className="font-bold" style={{ color: PP_COLOR }}>
                  {ptsLabel(balance)}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-[12px]">
                <span className="text-[var(--text-secondary)]">Cost</span>
                <span className="font-bold text-red-400">
                  −{ptsLabel(reward.pp_cost)}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-[13px] font-bold">
                <span className="text-[var(--text-primary)]">After redemption</span>
                <span style={{ color: PP_COLOR }}>
                  {ptsLabel(balance - reward.pp_cost)}
                </span>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 rounded-[12px] border border-[var(--border-subtle)] py-3 text-[13px] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 rounded-[12px] py-3 text-[13px] font-bold text-[var(--brand-contrast)] transition hover:brightness-110 active:scale-[0.97] disabled:opacity-60"
                style={{ backgroundColor: "var(--brand)" }}
              >
                {isPending ? "Redeeming…" : "Confirm"}
              </button>
            </div>
          </>
        )}

        {step === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-2 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand)]/15">
              <CheckCircle size={34} className="text-[var(--brand)]" weight="fill" />
            </div>
            <p className="text-[18px] font-bold text-[var(--text-primary)]">
              Voucher added!
            </p>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
              Your {reward.title} voucher has been added to your account.
            </p>
            {couponCode && (
              <div className="mt-4 w-full rounded-[12px] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                  Voucher code
                </p>
                <p className="mt-1 font-mono text-[15px] font-bold text-[var(--brand)]">
                  {couponCode}
                </p>
                <p className="mt-0.5 text-[9px] text-[var(--text-tertiary)]">
                  Expires in 90 days · single use
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-[12px] py-3 text-[13px] font-bold text-[var(--brand-contrast)]"
              style={{ backgroundColor: "var(--brand)" }}
            >
              Done
            </button>
          </motion.div>
        )}

        {step === "error" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-2 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/12">
              <X size={28} className="text-red-400" weight="bold" />
            </div>
            <p className="text-[17px] font-bold text-[var(--text-primary)]">
              Couldn't redeem
            </p>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{errorMsg}</p>
            <div className="mt-5 flex w-full gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-[12px] border border-[var(--border-subtle)] py-3 text-[13px] font-semibold text-[var(--text-secondary)]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setStep("confirm")}
                className="flex-1 rounded-[12px] py-3 text-[13px] font-bold text-[var(--brand-contrast)]"
                style={{ backgroundColor: "var(--brand)" }}
              >
                Try again
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Activity History ─────────────────────────────────────────────────────────

type ActivityFilter = "all" | "earned" | "spent" | "milestones";

const ACTIVITY_FILTERS: { id: ActivityFilter; label: string }[] = [
  { id: "all",        label: "All" },
  { id: "earned",     label: "Earned" },
  { id: "spent",      label: "Spent" },
  { id: "milestones", label: "Milestones" },
];

const MILESTONE_TYPES = new Set([
  "badge_unlock_bonus",
  "milestone_first_event",
  "milestone_5th_event",
  "milestone_10th_event",
  "milestone_25th_event",
  "monthly_streak_bonus",
  "rockstar_double_night",
  "category_diversity_bonus",
  "friend_added_milestone",
]);

function isMilestone(type: string) {
  return MILESTONE_TYPES.has(type);
}

function ActivityHistoryTab({ ledger }: { ledger: LedgerEntry[] }) {
  const [filter, setFilter] = useState<ActivityFilter>("all");

  const items = ledger.filter((e) => {
    if (filter === "all") return true;
    if (filter === "earned") return e.delta > 0 && !isMilestone(e.transaction_type);
    if (filter === "spent") return e.delta < 0;
    if (filter === "milestones") return e.delta > 0 && isMilestone(e.transaction_type);
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4">
        {ACTIVITY_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${
              filter === f.id
                ? "bg-[var(--brand)] text-[var(--brand-contrast)]"
                : "border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-[var(--text-tertiary)]">
          No transactions yet.
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((entry) => {
            const isEarn = entry.delta > 0;
            const isMile = isEarn && isMilestone(entry.transaction_type);
            const iconColor = isMile ? PP_COLOR : isEarn ? "var(--brand)" : "#f87171";
            const iconBg = isMile
              ? "rgba(245,158,11,0.12)"
              : isEarn
              ? "rgba(74,159,99,0.12)"
              : "rgba(239,68,68,0.10)";

            return (
              <div
                key={entry.id}
                className="flex items-center gap-4 rounded-[14px] border border-transparent bg-[var(--bg-card)] px-4 py-3.5 transition hover:border-[var(--border-subtle)]"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: iconBg }}
                >
                  {isMile ? (
                    <Star size={15} weight="fill" style={{ color: PP_COLOR }} />
                  ) : isEarn ? (
                    <Lightning size={15} weight="fill" className="text-[var(--brand)]" />
                  ) : (
                    <Gift size={15} weight="fill" className="text-red-400" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-[var(--text-primary)]">
                    {entry.description}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                    {formatLedgerDate(entry.created_at)}
                  </p>
                </div>

                <span
                  className="shrink-0 text-[13px] font-bold"
                  style={{ color: iconColor }}
                >
                  {isEarn ? "+" : ""}
                  {ptsLabel(Math.abs(entry.delta))}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function BadgeCard({ badge }: { badge: RewardsBadge }) {
  const isEarned = badge.earned;

  return (
    <div
      className={`flex flex-col items-center gap-2.5 rounded-[20px] border p-4 text-center transition ${
        isEarned
          ? "border-[var(--border-card)] bg-[var(--bg-card)]"
          : "border-[var(--border-subtle)] bg-[var(--bg-card)] opacity-50"
      }`}
    >
      {/* Icon circle */}
      <div className="relative">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            backgroundColor: isEarned ? "rgba(74,159,99,0.14)" : "rgba(255,255,255,0.05)",
          }}
        >
          <BadgeIcon
            iconKey={badge.icon_key}
            size={22}
            className={isEarned ? "text-[var(--brand)]" : "text-[var(--text-tertiary)]"}
          />
        </div>

        {isEarned && (
          <div
            className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--brand)" }}
          >
            <CheckCircle size={12} weight="fill" className="text-[var(--brand-contrast)]" />
          </div>
        )}
        {!isEarned && (
          <div className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
            <Lock size={10} className="text-[var(--text-tertiary)]" />
          </div>
        )}
      </div>

      {/* Name */}
      <p className="text-[12px] font-semibold leading-snug text-[var(--text-primary)]">
        {badge.name}
      </p>

      {/* Earned date or unlock condition */}
      {isEarned && badge.earned_at ? (
        <p className="text-[9px] text-[var(--text-tertiary)]">
          {formatBadgeDate(badge.earned_at)}
        </p>
      ) : (
        <p className="line-clamp-2 text-[9px] leading-relaxed text-[var(--text-tertiary)]">
          {badge.unlock_condition}
        </p>
      )}

      {/* PP bonus */}
      {badge.pp_bonus > 0 && (
        <span
          className="rounded-full px-2 py-0.5 text-[9px] font-bold"
          style={{
            backgroundColor: isEarned ? `${PP_COLOR}15` : "rgba(255,255,255,0.05)",
            color: isEarned ? PP_COLOR : "var(--text-tertiary)",
          }}
        >
          +{badge.pp_bonus} pts
        </span>
      )}

      {/* Special label */}
      {badge.special_label && (
        <span className="rounded-full bg-[var(--brand)]/10 px-2 py-0.5 text-[9px] font-semibold text-[var(--brand)]">
          {badge.special_label}
        </span>
      )}
    </div>
  );
}

function BadgesTab({ badges }: { badges: RewardsBadge[] }) {
  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  return (
    <div>
      {earned.length > 0 && (
        <>
          <div className="mb-3 flex items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Earned
            </p>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{
                backgroundColor: "var(--brand)",
                color: "var(--brand-contrast)",
              }}
            >
              {earned.length}
            </span>
          </div>
          <div className="mb-8 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {earned.map((b) => (
              <BadgeCard key={b.id} badge={b} />
            ))}
          </div>
        </>
      )}

      {locked.length > 0 && (
        <>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Locked
          </p>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {locked.map((b) => (
              <BadgeCard key={b.id} badge={b} />
            ))}
          </div>
        </>
      )}

      {badges.length === 0 && (
        <div className="py-16 text-center text-[13px] text-[var(--text-tertiary)]">
          No badges loaded.
        </div>
      )}
    </div>
  );
}

// ─── Next PP-milestone badge ──────────────────────────────────────────────────

const PP_MILESTONES: { slug: string; target: number }[] = [
  { slug: "trailblazer",  target: 1000 },
  { slug: "legends_club", target: 5000 },
];

function getNextPPMilestone(lifetime: number, badges: RewardsBadge[]) {
  for (const m of PP_MILESTONES) {
    const badge = badges.find((b) => b.slug === m.slug);
    if (badge && !badge.earned) return { badge, target: m.target };
  }
  return null;
}

// ─── Tab strip ────────────────────────────────────────────────────────────────

type TabId = "shop" | "history" | "badges";

const TABS: { id: TabId; label: string }[] = [
  { id: "shop",    label: "Rewards Shop" },
  { id: "history", label: "Activity" },
  { id: "badges",  label: "Badges" },
];

// ─── RewardsClient ────────────────────────────────────────────────────────────

export interface RewardsClientProps {
  pp: PulsePointsSummary;
  rewards: PulseReward[];
  ledger: LedgerEntry[];
  badges: RewardsBadge[];
}

export function RewardsClient({
  pp: initialPP,
  rewards,
  ledger,
  badges,
}: RewardsClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("shop");
  const [redeemTarget, setRedeemTarget] = useState<PulseReward | null>(null);
  const [pp, setPP] = useState(initialPP);

  const badgesEarned = badges.filter((b) => b.earned).length;
  const nextMilestone = getNextPPMilestone(pp.lifetime, badges);
  const progress = nextMilestone
    ? Math.min(100, Math.round((pp.lifetime / nextMilestone.target) * 100))
    : 100;

  function handleRedeemSuccess(newBalance: number) {
    setPP((prev) => ({ ...prev, balance: newBalance }));
    setRedeemTarget(null);
  }

  return (
    <>
      <main className="min-h-screen bg-[var(--bg-base)] pb-48 text-[var(--text-primary)]">
        <div className="mx-auto max-w-lg px-4 pt-8">

          {/* ── Back + Header ── */}
          <div className="mb-6 flex items-center gap-3">
            <Link
              href="/dashboard/wallets"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              <ArrowLeft size={16} weight="bold" />
            </Link>
            <div>
              <h1 className="text-[1.5rem] font-bold leading-tight tracking-tight text-[var(--text-primary)]">
                Pulse Rewards
              </h1>
              <p className="text-[12px] text-[var(--text-secondary)]">
                Earn and redeem Pulse Points
              </p>
            </div>
          </div>

          {/* ── Stats row ── */}
          <div className="mb-4 flex gap-2">
            <StatCard
              value={pp.balance.toLocaleString()}
              sub="Available"
              label="Pulse Points"
              highlight
            />
            <StatCard
              value={pp.lifetime.toLocaleString()}
              sub="All-time"
              label="Total Earned"
            />
            <StatCard
              value={String(badgesEarned)}
              sub="Earned"
              label="Badges"
            />
          </div>

          {/* ── Progress card ── */}
          {nextMilestone ? (
            <div className="mb-6 rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-5 py-4">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  Next Badge
                </p>
                <div className="flex items-center gap-1.5">
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-full"
                    style={{ backgroundColor: "rgba(74,159,99,0.12)" }}
                  >
                    <BadgeIcon
                      iconKey={nextMilestone.badge.icon_key}
                      size={11}
                      className="text-[var(--brand)]"
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--text-primary)]">
                    {nextMilestone.badge.name}
                  </span>
                </div>
              </div>
              <p className="mb-3 text-[11px] text-[var(--text-secondary)]">
                {nextMilestone.badge.unlock_condition}
              </p>

              <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: PP_COLOR, boxShadow: `0 0 8px ${PP_COLOR}55` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-tertiary)]">
                  {pp.lifetime.toLocaleString()} pts lifetime
                </span>
                <span style={{ color: PP_COLOR }} className="font-semibold">
                  {Math.max(0, nextMilestone.target - pp.lifetime).toLocaleString()} pts to go
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-6 flex items-center gap-3 rounded-[20px] border border-[var(--brand)]/20 bg-[var(--brand)]/8 px-5 py-4">
              <Trophy size={20} className="shrink-0 text-[var(--brand)]" weight="fill" />
              <p className="text-[13px] font-semibold text-[var(--brand)]">
                All Pulse Point badges earned — you&apos;re a legend!
              </p>
            </div>
          )}

          {/* ── Tab strip ── */}
          <div className="no-scrollbar -mx-4 mb-6 flex overflow-x-auto border-b border-[var(--border-subtle)] px-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative shrink-0 px-4 pb-3 pt-1 text-[13px] font-medium transition ${
                  activeTab === tab.id
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="reward-tab-line"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: PP_COLOR }}
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* ── Tab content ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.17 }}
            >
              {activeTab === "shop" && (
                <RewardsShopTab
                  rewards={rewards}
                  balance={pp.balance}
                  onRedeem={setRedeemTarget}
                />
              )}
              {activeTab === "history" && (
                <ActivityHistoryTab ledger={ledger} />
              )}
              {activeTab === "badges" && (
                <BadgesTab badges={badges} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ── Redemption modal ── */}
      <AnimatePresence>
        {redeemTarget && (
          <RedeemModal
            reward={redeemTarget}
            balance={pp.balance}
            onClose={() => setRedeemTarget(null)}
            onSuccess={(newBalance) => handleRedeemSuccess(newBalance)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
