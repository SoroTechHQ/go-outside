"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Lightning,
  Star,
  CheckCircle,
  Lock,
  X,
  ArrowRight,
} from "@phosphor-icons/react";

// ─── Types ───────────────────────────────────────────────────────────────────

type RewardCategory = "ticket_discount" | "access_perk" | "profile_status" | "organizer_funded";

interface Reward {
  id: string;
  category: RewardCategory;
  title: string;
  description: string;
  pp_cost: number;
  discount_ghs?: number;
  icon: string;
}

interface ActivityItem {
  id: string;
  date: string;
  action: string;
  type: "earned" | "spent" | "milestone";
  delta: number;
}

interface Badge {
  slug: string;
  name: string;
  icon: string;
  unlock_condition: string;
  pp_bonus: number;
  earned: boolean;
  earned_at?: string;
  special?: string;
}

// ─── Mock Data (swap for API calls when backend is wired) ─────────────────────

const PP_BALANCE = 1420;
const PP_LIFETIME = 3200;
const PP_COLOR = "#F59E0B";

const REWARDS: Reward[] = [
  { id: "d1", category: "ticket_discount", title: "GHS 10 Off",          description: "Discount on any event ticket",              pp_cost: 200,  discount_ghs: 10,  icon: "🎟️" },
  { id: "d2", category: "ticket_discount", title: "GHS 25 Off",          description: "Discount on any event ticket",              pp_cost: 500,  discount_ghs: 25,  icon: "🎟️" },
  { id: "d3", category: "ticket_discount", title: "GHS 50 Off",          description: "Discount on any event ticket",              pp_cost: 1000, discount_ghs: 50,  icon: "🎟️" },
  { id: "d4", category: "ticket_discount", title: "GHS 75 Off",          description: "Discount on any event ticket",              pp_cost: 1500, discount_ghs: 75,  icon: "🎟️" },
  { id: "d5", category: "ticket_discount", title: "GHS 100 Off",         description: "Discount on any event ticket",              pp_cost: 2000, discount_ghs: 100, icon: "🎟️" },
  { id: "d6", category: "ticket_discount", title: "GHS 150 Off · Elite", description: "Discount on any event ticket",              pp_cost: 3000, discount_ghs: 150, icon: "💎" },
  { id: "a1", category: "access_perk",     title: "Presale Access",       description: "48h early ticket access for one event",    pp_cost: 500,  icon: "⚡" },
  { id: "a2", category: "access_perk",     title: "VIP Upgrade",          description: "Upgrade GA to VIP at one event",           pp_cost: 2500, icon: "👑" },
  { id: "a3", category: "access_perk",     title: "Meet & Greet",         description: "One M&G slot at a partner event",          pp_cost: 5000, icon: "🌟" },
  { id: "s1", category: "profile_status",  title: "Avatar Border",        description: "Exclusive animated profile border",        pp_cost: 300,  icon: "✨" },
  { id: "s2", category: "profile_status",  title: "Pulse Boost · 30d",    description: "+10% Pulse Score multiplier for 30 days",  pp_cost: 1000, icon: "🔥" },
  { id: "s3", category: "profile_status",  title: "Custom Theme",         description: "Unlock a custom colour scheme",            pp_cost: 500,  icon: "🎨" },
  { id: "o1", category: "organizer_funded", title: "Free Drink",          description: "At select partner venues",                 pp_cost: 300,  icon: "🍹" },
  { id: "o2", category: "organizer_funded", title: "Backstage Access",    description: "Backstage pass at select events",          pp_cost: 4000, icon: "🎙️" },
  { id: "o3", category: "organizer_funded", title: "Artist Merch",        description: "Exclusive merch at select events",         pp_cost: 1500, icon: "👕" },
];

const ACTIVITY: ActivityItem[] = [
  { id: "1",  date: "Apr 19", action: "Checked in at Afrobeats Night",    type: "earned",    delta: 50   },
  { id: "2",  date: "Apr 19", action: "Ticket purchase · GHS 120",         type: "earned",    delta: 120  },
  { id: "3",  date: "Apr 19", action: "Left a Snippet",                    type: "earned",    delta: 40   },
  { id: "4",  date: "Apr 19", action: "Gold Badge earned 🏅",              type: "milestone", delta: 80   },
  { id: "5",  date: "Apr 12", action: "Referred friend (Kofi) · first event", type: "earned", delta: 100 },
  { id: "6",  date: "Apr 10", action: "Redeemed GHS 25 voucher",           type: "spent",     delta: -500 },
  { id: "7",  date: "Apr 5",  action: "Monthly streak bonus",              type: "milestone", delta: 75   },
  { id: "8",  date: "Mar 28", action: "Ticket purchase · GHS 80",          type: "earned",    delta: 80   },
  { id: "9",  date: "Mar 28", action: "Checked in at Chale Wote Festival", type: "earned",    delta: 50   },
  { id: "10", date: "Mar 15", action: "5th event attended 🎉",             type: "milestone", delta: 50   },
  { id: "11", date: "Mar 8",  action: "Ticket purchase · GHS 60",          type: "earned",    delta: 60   },
  { id: "12", date: "Mar 2",  action: "Snippet Star badge unlocked ⭐",    type: "milestone", delta: 75   },
  { id: "13", date: "Feb 22", action: "Event saved · Osu Night Sessions",  type: "earned",    delta: 2    },
  { id: "14", date: "Feb 15", action: "Social Butterfly badge unlocked 👥", type: "milestone", delta: 50  },
  { id: "15", date: "Feb 14", action: "First Timer badge unlocked 🎟️",    type: "milestone", delta: 100  },
];

const BADGES: Badge[] = [
  { slug: "first_timer",     name: "First Timer",    icon: "🎟️", unlock_condition: "Attend your first event",                        pp_bonus: 100, earned: true,  earned_at: "Feb 14, 2026" },
  { slug: "social_butterfly",name: "Social Butterfly",icon: "👥", unlock_condition: "Add your first friend",                         pp_bonus: 50,  earned: true,  earned_at: "Feb 15, 2026" },
  { slug: "trailblazer",     name: "Trailblazer",    icon: "🌟", unlock_condition: "Earn 1,000 cumulative PP",                       pp_bonus: 0,   earned: true,  earned_at: "Apr 5, 2026",  special: "Special cosmetic" },
  { slug: "explorer",        name: "Explorer",       icon: "🗺️", unlock_condition: "Attend events in 3 categories in one month",     pp_bonus: 60,  earned: true,  earned_at: "Mar 22, 2026" },
  { slug: "snippet_star",    name: "Snippet Star",   icon: "⭐", unlock_condition: "Leave 5 Snippets",                               pp_bonus: 75,  earned: true,  earned_at: "Mar 2, 2026"  },
  { slug: "night_owl",       name: "Night Owl",      icon: "🌙", unlock_condition: "Attend 2 events in one night",                   pp_bonus: 50,  earned: false },
  { slug: "gold_hunter",     name: "Gold Hunter",    icon: "🏅", unlock_condition: "Earn 5 Gold Badges",                            pp_bonus: 100, earned: false },
  { slug: "scene_regular",   name: "Scene Regular",  icon: "📅", unlock_condition: "Maintain a 3-month streak",                     pp_bonus: 150, earned: false },
  { slug: "big_spender",     name: "Big Spender",    icon: "💸", unlock_condition: "Spend GHS 500+ on tickets in a month",          pp_bonus: 100, earned: false },
  { slug: "crew_leader",     name: "Crew Leader",    icon: "👑", unlock_condition: "Form a 'Going With' group with 4+ friends",     pp_bonus: 75,  earned: false },
  { slug: "influencer",      name: "Influencer",     icon: "🎙️", unlock_condition: "Refer 3 friends who attend",                   pp_bonus: 200, earned: false },
  { slug: "legends_club",    name: "Legend's Club",  icon: "💎", unlock_condition: "Reach Legend tier AND earn 5,000 PP",           pp_bonus: 0,   earned: false, special: "Exclusive VIP perk access" },
];

const NEXT_BADGE = BADGES.find((b) => !b.earned && b.slug === "night_owl")!;
const NEXT_BADGE_TARGET = 500; // PP target for next badge context (mocked)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ppLabel(n: number) {
  return `${n.toLocaleString()} PP`;
}

function categoryLabel(c: RewardCategory) {
  if (c === "ticket_discount")  return "Discount";
  if (c === "access_perk")      return "Access";
  if (c === "profile_status")   return "Status";
  return "Organizer";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-4 text-center">
      <span className="text-[1.35rem] font-bold text-[var(--text-primary)] leading-tight">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{sub}</span>
      <span className="mt-1 text-[11px] text-[var(--text-secondary)]">{label}</span>
    </div>
  );
}

// ─── Rewards Shop ─────────────────────────────────────────────────────────────

type ShopCategory = "all" | RewardCategory;

const CATEGORY_FILTERS: { id: ShopCategory; label: string }[] = [
  { id: "all",              label: "All" },
  { id: "ticket_discount",  label: "Discounts" },
  { id: "access_perk",      label: "Access" },
  { id: "profile_status",   label: "Status" },
  { id: "organizer_funded", label: "Organizer Perks" },
];

function RewardCard({
  reward,
  balance,
  onRedeem,
}: {
  reward: Reward;
  balance: number;
  onRedeem: (r: Reward) => void;
}) {
  const canAfford = balance >= reward.pp_cost;
  const need = reward.pp_cost - balance;

  return (
    <div
      className={`relative flex flex-col rounded-[20px] border bg-[var(--bg-card)] p-4 transition ${
        canAfford
          ? "border-[var(--border-card)]"
          : "border-[var(--border-subtle)] opacity-75"
      }`}
    >
      {/* PP cost badge */}
      <div
        className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold"
        style={{
          backgroundColor: canAfford ? `${PP_COLOR}22` : "rgba(255,255,255,0.06)",
          color: canAfford ? PP_COLOR : "var(--text-tertiary)",
          border: `1px solid ${canAfford ? `${PP_COLOR}40` : "rgba(255,255,255,0.08)"}`,
        }}
      >
        {ppLabel(reward.pp_cost)}
      </div>

      {/* Icon */}
      <span className="mb-3 text-[2rem] leading-none">{reward.icon}</span>

      {/* Title + description */}
      <p className="pr-16 text-[14px] font-semibold leading-snug text-[var(--text-primary)]">
        {reward.title}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-secondary)]">
        {reward.description}
      </p>

      {/* Discount value box */}
      {reward.discount_ghs !== undefined && (
        <div className="mt-3 rounded-[10px] border border-dashed border-[var(--border-subtle)] py-2 text-center">
          <span className="text-[13px] font-bold text-[var(--text-primary)]">
            GHS {reward.discount_ghs}
          </span>
          <span className="ml-1 text-[10px] text-[var(--text-tertiary)]">off</span>
        </div>
      )}

      {/* Redeem button */}
      <div className="mt-4">
        {canAfford ? (
          <button
            onClick={() => onRedeem(reward)}
            className="flex w-full items-center justify-center gap-1.5 rounded-[12px] py-2.5 text-[12px] font-bold text-[var(--brand-contrast)] transition hover:brightness-110 active:scale-[0.98]"
            style={{ backgroundColor: "var(--brand)" }}
          >
            Redeem Reward
            <ArrowRight size={13} weight="bold" />
          </button>
        ) : (
          <div className="space-y-1.5">
            <div className="flex w-full items-center justify-center gap-1 rounded-[12px] bg-white/5 py-2.5 text-[12px] font-semibold text-[var(--text-tertiary)]">
              <Lock size={12} />
              Need {ppLabel(need)} more
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RewardsShopTab({ balance }: { balance: number }) {
  const [category, setCategory] = useState<ShopCategory>("all");
  const [redeemTarget, setRedeemTarget] = useState<Reward | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const filtered = category === "all" ? REWARDS : REWARDS.filter((r) => r.category === category);

  function handleConfirm() {
    setConfirmed(true);
    setTimeout(() => {
      setRedeemTarget(null);
      setConfirmed(false);
    }, 1800);
  }

  return (
    <>
      {/* Balance hint */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Rewards Shop
          </p>
          <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
            Redeem your Pulse Points for exclusive perks
          </p>
        </div>
        <div
          className="rounded-full px-3 py-1 text-[11px] font-bold"
          style={{
            backgroundColor: `${PP_COLOR}18`,
            color: PP_COLOR,
            border: `1px solid ${PP_COLOR}38`,
          }}
        >
          {ppLabel(balance)}
        </div>
      </div>

      {/* Category filters */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-3">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setCategory(f.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition ${
              category === f.id
                ? "bg-[var(--brand)] text-[var(--brand-contrast)]"
                : "border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Section label */}
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
        Available Rewards
      </p>

      {/* Rewards grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {filtered.map((r) => (
          <RewardCard key={r.id} reward={r} balance={balance} onRedeem={setRedeemTarget} />
        ))}
      </div>

      {/* Redemption modal */}
      <AnimatePresence>
        {redeemTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !confirmed && setRedeemTarget(null)}
            />

            {/* Modal card */}
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="relative w-full max-w-sm rounded-[24px] border border-[var(--border-card)] bg-[var(--bg-elevated)] p-6 shadow-2xl"
            >
              {!confirmed ? (
                <>
                  <button
                    onClick={() => setRedeemTarget(null)}
                    className="absolute right-4 top-4 rounded-full p-1.5 text-[var(--text-tertiary)] hover:bg-white/8 hover:text-[var(--text-primary)]"
                  >
                    <X size={16} />
                  </button>

                  <div className="mb-4 text-[2.5rem] leading-none">{redeemTarget.icon}</div>
                  <p className="text-[17px] font-bold text-[var(--text-primary)]">
                    Redeem {redeemTarget.title}?
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                    {redeemTarget.description}
                  </p>

                  {/* Balance preview */}
                  <div className="mt-4 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-[var(--text-secondary)]">Current balance</span>
                      <span className="font-bold" style={{ color: PP_COLOR }}>
                        {ppLabel(balance)}
                      </span>
                    </div>
                    <div className="my-2 h-px bg-[var(--border-subtle)]" />
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-[var(--text-secondary)]">Cost</span>
                      <span className="font-bold text-red-400">−{ppLabel(redeemTarget.pp_cost)}</span>
                    </div>
                    <div className="my-2 h-px bg-[var(--border-subtle)]" />
                    <div className="flex items-center justify-between text-[13px] font-bold">
                      <span className="text-[var(--text-primary)]">After redemption</span>
                      <span style={{ color: PP_COLOR }}>
                        {ppLabel(balance - redeemTarget.pp_cost)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => setRedeemTarget(null)}
                      className="flex-1 rounded-[12px] border border-[var(--border-subtle)] py-3 text-[13px] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="flex-1 rounded-[12px] py-3 text-[13px] font-bold text-[var(--brand-contrast)] transition hover:brightness-110"
                      style={{ backgroundColor: "var(--brand)" }}
                    >
                      Confirm
                    </button>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-4 text-center"
                >
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand)]/15">
                    <CheckCircle size={36} className="text-[var(--brand)]" weight="fill" />
                  </div>
                  <p className="text-[17px] font-bold text-[var(--text-primary)]">Voucher Added!</p>
                  <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                    Your {redeemTarget.title} voucher has been added to your account.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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

function ActivityHistoryTab() {
  const [filter, setFilter] = useState<ActivityFilter>("all");

  const items =
    filter === "all"
      ? ACTIVITY
      : filter === "milestones"
      ? ACTIVITY.filter((a) => a.type === "milestone")
      : ACTIVITY.filter((a) => a.type === filter);

  return (
    <>
      {/* Filters */}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {ACTIVITY_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition ${
              filter === f.id
                ? "bg-[var(--brand)] text-[var(--brand-contrast)]"
                : "border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-1">
        {items.length === 0 && (
          <div className="py-12 text-center text-[13px] text-[var(--text-tertiary)]">
            No transactions yet.
          </div>
        )}
        {items.map((item) => {
          const isEarn = item.delta > 0;
          return (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-[14px] border border-transparent bg-[var(--bg-card)] px-4 py-3.5 transition hover:border-[var(--border-subtle)]"
            >
              {/* Icon dot */}
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px]"
                style={{
                  backgroundColor: item.type === "milestone"
                    ? `${PP_COLOR}18`
                    : isEarn
                    ? "rgba(74,159,99,0.12)"
                    : "rgba(239,68,68,0.1)",
                }}
              >
                {item.type === "milestone" ? (
                  <Star size={14} style={{ color: PP_COLOR }} weight="fill" />
                ) : isEarn ? (
                  <Lightning size={14} className="text-[var(--brand)]" weight="fill" />
                ) : (
                  <Gift size={14} className="text-red-400" weight="fill" />
                )}
              </div>

              {/* Action + date */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-[var(--text-primary)]">{item.action}</p>
                <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">{item.date}</p>
              </div>

              {/* Delta */}
              <span
                className="shrink-0 text-[13px] font-bold"
                style={{ color: isEarn ? (item.type === "milestone" ? PP_COLOR : "var(--brand)") : "#f87171" }}
              >
                {isEarn ? "+" : ""}
                {ppLabel(Math.abs(item.delta))}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-[20px] border p-4 text-center transition ${
        badge.earned
          ? "border-[var(--border-card)] bg-[var(--bg-card)]"
          : "border-[var(--border-subtle)] bg-[var(--bg-card)] opacity-50"
      }`}
    >
      {/* Icon */}
      <div className="relative">
        <span
          className={`block text-[2.2rem] leading-none transition ${
            badge.earned ? "" : "grayscale"
          }`}
        >
          {badge.icon}
        </span>
        {badge.earned && (
          <div
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--brand)" }}
          >
            <CheckCircle size={10} weight="fill" className="text-[var(--brand-contrast)]" />
          </div>
        )}
        {!badge.earned && (
          <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--bg-elevated)]">
            <Lock size={9} className="text-[var(--text-tertiary)]" />
          </div>
        )}
      </div>

      {/* Name */}
      <p className="text-[12px] font-semibold leading-snug text-[var(--text-primary)]">{badge.name}</p>

      {/* Earned date or unlock condition */}
      {badge.earned ? (
        <p className="text-[9px] text-[var(--text-tertiary)]">{badge.earned_at}</p>
      ) : (
        <p className="text-[9px] leading-snug text-[var(--text-tertiary)]">{badge.unlock_condition}</p>
      )}

      {/* PP bonus */}
      {badge.pp_bonus > 0 && (
        <span
          className="rounded-full px-2 py-0.5 text-[9px] font-bold"
          style={{
            backgroundColor: `${PP_COLOR}15`,
            color: badge.earned ? PP_COLOR : "var(--text-tertiary)",
          }}
        >
          +{badge.pp_bonus} PP
        </span>
      )}
      {badge.special && (
        <span className="rounded-full bg-[var(--brand)]/10 px-2 py-0.5 text-[9px] font-semibold text-[var(--brand)]">
          {badge.special}
        </span>
      )}
    </div>
  );
}

function BadgesTab() {
  const earned = BADGES.filter((b) => b.earned);
  const locked = BADGES.filter((b) => !b.earned);

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
          Earned
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ backgroundColor: "var(--brand)", color: "var(--brand-contrast)" }}
        >
          {earned.length}
        </span>
      </div>
      <div className="mb-6 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {earned.map((b) => (
          <BadgeCard key={b.slug} badge={b} />
        ))}
      </div>

      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
        Locked
      </p>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {locked.map((b) => (
          <BadgeCard key={b.slug} badge={b} />
        ))}
      </div>
    </>
  );
}

// ─── Main RewardsClient ───────────────────────────────────────────────────────

type TabId = "shop" | "history" | "badges";

const TABS: { id: TabId; label: string }[] = [
  { id: "shop",    label: "Rewards Shop" },
  { id: "history", label: "Activity History" },
  { id: "badges",  label: "Badges" },
];

export function RewardsClient() {
  const [activeTab, setActiveTab] = useState<TabId>("shop");

  const balance      = PP_BALANCE;
  const lifetime     = PP_LIFETIME;
  const badgesEarned = BADGES.filter((b) => b.earned).length;

  // Next badge progress (mocked: heading toward Night Owl, needs 2 events in one night)
  const nextBadgeProgress = Math.min(100, Math.round((balance / NEXT_BADGE_TARGET) * 100));

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pb-48 text-[var(--text-primary)]">
      <div className="mx-auto max-w-lg px-4 pt-8">

        {/* ── Page Header ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[12px]"
              style={{ backgroundColor: `${PP_COLOR}20`, border: `1px solid ${PP_COLOR}35` }}
            >
              <Gift size={18} style={{ color: PP_COLOR }} weight="fill" />
            </div>
            <h1 className="text-[1.6rem] font-bold tracking-tight text-[var(--text-primary)]">
              My Rewards
            </h1>
          </div>
          <p className="mt-1 pl-[46px] text-[13px] text-[var(--text-secondary)]">
            Track your PP, badges, and redeem rewards
          </p>
        </div>

        {/* ── Stats Row ── */}
        <div className="mb-4 flex gap-2.5">
          <StatCard
            label="Current Balance"
            value={balance.toLocaleString()}
            sub="PP Available"
          />
          <StatCard
            label="All-time PP"
            value={lifetime.toLocaleString()}
            sub="Total Earned"
          />
          <StatCard
            label="Achievements"
            value={String(badgesEarned)}
            sub="Badges Earned"
          />
        </div>

        {/* ── Progress Card ── */}
        <div className="mb-6 rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-5 py-4">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              Next Badge
            </p>
            <span className="text-[11px] text-[var(--text-secondary)]">
              {NEXT_BADGE.name} {NEXT_BADGE.icon}
            </span>
          </div>
          <p className="mb-3 text-[12px] text-[var(--text-secondary)]">
            {NEXT_BADGE.unlock_condition}
          </p>

          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${nextBadgeProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                backgroundColor: PP_COLOR,
                boxShadow: `0 0 8px ${PP_COLOR}55`,
              }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="text-[var(--text-tertiary)]">
              {balance.toLocaleString()} PP
            </span>
            <span style={{ color: PP_COLOR }} className="font-semibold">
              {Math.max(0, NEXT_BADGE_TARGET - balance).toLocaleString()} PP to go!
            </span>
          </div>
        </div>

        {/* ── Tab Strip ── */}
        <div className="no-scrollbar -mx-4 flex overflow-x-auto border-b border-[var(--border-subtle)] px-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
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
                  layoutId="reward-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: PP_COLOR }}
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="mt-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === "shop"    && <RewardsShopTab balance={balance} />}
              {activeTab === "history" && <ActivityHistoryTab />}
              {activeTab === "badges"  && <BadgesTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
