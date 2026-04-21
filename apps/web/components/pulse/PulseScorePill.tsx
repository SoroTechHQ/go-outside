"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Lightning, X } from "@phosphor-icons/react";
import { createBrowserClient } from "@supabase/ssr";

const TIER_COLOR: Record<string, string> = {
  Newcomer:      "#888888",
  Explorer:      "#4a9f63",
  Regular:       "#4a9f63",
  "Scene Kid":   "#4a9f63",
  "City Native": "#c87c2a",
  Legend:        "#DAA520",
};

type PulseHistoryItem = {
  id: string;
  points: number;
  reason: string;
  created_at: string;
};

// ── Pulse pill ────────────────────────────────────────────────────────────────

export function PulseScorePill({ clerkId }: { clerkId: string }) {
  const queryClient = useQueryClient();
  const [floatDelta, setFloatDelta] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const prevScore = useRef<number | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["pulse", clerkId],
    queryFn: async () => {
      const res = await fetch(`/api/users/me/pulse`);
      if (!res.ok) return null;
      return res.json() as Promise<{ pulse_score: number; pulse_tier: string }>;
    },
    staleTime: 30_000,
  });

  const score = profile?.pulse_score ?? 0;
  const tier  = profile?.pulse_tier ?? "Explorer";
  const color = TIER_COLOR[tier] ?? "#4a9f63";

  // Supabase Realtime — watch for pulse score changes
  useEffect(() => {
    if (!clerkId) return;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const channel = supabase
      .channel(`pulse:${clerkId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `clerk_id=eq.${clerkId}`,
        },
        (payload) => {
          const newScore = (payload.new as { pulse_score: number }).pulse_score;
          if (prevScore.current !== null && newScore > prevScore.current) {
            const delta = newScore - prevScore.current;
            setFloatDelta(delta);
            setTimeout(() => setFloatDelta(null), 2200);
          }
          prevScore.current = newScore;
          queryClient.setQueryData(["pulse", clerkId], (old: typeof profile) =>
            old ? { ...old, pulse_score: newScore } : old
          );
        },
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [clerkId, queryClient]);

  // Track prevScore after query loads
  useEffect(() => {
    if (score && prevScore.current === null) prevScore.current = score;
  }, [score]);

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition active:scale-95"
          style={{
            borderColor: `${color}35`,
            backgroundColor: `${color}12`,
            color,
          }}
        >
          <Lightning size={11} weight="fill" />
          <span>{score.toLocaleString()}</span>
          <span className="hidden text-[9px] font-semibold opacity-70 sm:inline">{tier}</span>
        </button>

        {/* +X pts float animation */}
        <AnimatePresence>
          {floatDelta !== null && (
            <motion.span
              key={floatDelta}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -28, scale: 1.1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 text-[11px] font-bold text-[#5FBF2A]"
            >
              +{floatDelta}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Score history sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 inset-x-0 z-[71] rounded-t-3xl bg-[var(--bg-card)] pb-safe shadow-2xl"
              style={{ maxHeight: "70dvh" }}
            >
              <PulseHistorySheet
                clerkId={clerkId}
                score={score}
                tier={tier}
                color={color}
                onClose={() => setSheetOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Score history sheet ───────────────────────────────────────────────────────

function PulseHistorySheet({
  clerkId,
  score,
  tier,
  color,
  onClose,
}: {
  clerkId: string;
  score: number;
  tier: string;
  color: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["pulse-history", clerkId],
    queryFn: async () => {
      const res = await fetch("/api/users/me/pulse/history");
      if (!res.ok) return { history: [] };
      return res.json() as Promise<{ history: PulseHistoryItem[] }>;
    },
    staleTime: 60_000,
  });

  const history = data?.history ?? [];

  const REASON_LABELS: Record<string, string> = {
    ticket_purchase: "Bought a ticket",
    checkin:        "Event check-in",
    snippet:        "Left a snippet",
    follow:         "Followed someone",
    mutual_follow:  "Mutual follow",
    review:         "Posted a review",
    first_event:    "First event! 🎉",
    first_friend:   "First friend! 🤝",
    rockstar:       "Rockstar night! 🌟",
    scene_veteran:  "Scene Veteran! 🏆",
  };

  return (
    <div className="flex flex-col overflow-hidden" style={{ maxHeight: "70dvh" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Pulse Score</p>
          <p className="font-display text-[2rem] font-bold italic leading-none" style={{ color }}>
            {score.toLocaleString()} <span className="text-[1rem] font-normal text-[var(--text-tertiary)]">pts</span>
          </p>
          <p className="mt-0.5 text-[12px] font-semibold" style={{ color }}>{tier}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-tertiary)] transition hover:bg-[var(--bg-card-hover)]"
        >
          <X size={15} weight="bold" />
        </button>
      </div>

      <div className="h-px bg-[var(--border-subtle)]" />

      {/* History list */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
        {isLoading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-[var(--bg-muted)] p-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-[var(--bg-card)]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-1/2 rounded bg-[var(--bg-card)]" />
                  <div className="h-2 w-1/3 rounded bg-[var(--bg-card)]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && history.length === 0 && (
          <p className="py-8 text-center text-[13px] text-[var(--text-tertiary)]">No activity yet. Start going out! 🎉</p>
        )}

        {history.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
              style={{ backgroundColor: `${color}18`, color }}
            >
              +{item.points}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                {REASON_LABELS[item.reason] ?? item.reason}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                {new Date(item.created_at).toLocaleDateString("en-GH", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <Lightning size={14} weight="fill" style={{ color }} className="shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Connected wrapper (reads Clerk userId) ────────────────────────────────────

export function PulseScorePillConnected() {
  const { user } = useUser();
  if (!user) return null;
  return <PulseScorePill clerkId={user.id} />;
}

export default PulseScorePillConnected;
