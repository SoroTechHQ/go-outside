"use client";

import CountUp from "react-countup";
import {
  MapPin,
  Trophy,
  Ticket,
  PencilLine,
  Lightning,
  Fire,
  Star,
} from "@phosphor-icons/react";
import { getTierInfo, getNextTier, getPulseProgress, type PulseTier } from "../types";

type Props = {
  score: number;
  tier: PulseTier;
  neighbourhoodRank: number;
  cityRankPercent: number;
  onTap: () => void;
};

export function PulseScoreBanner({
  score,
  tier,
  neighbourhoodRank,
  cityRankPercent,
  onTap,
}: Props) {
  const tierInfo    = getTierInfo(tier);
  const nextTier    = getNextTier(tier);
  const progress    = getPulseProgress(score, tier);
  const pointsToNext = nextTier ? nextTier.min - score : 0;

  return (
    <button
      onClick={onTap}
      className="relative w-full overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0e2212] via-[#152a1a] to-[#0b1a10] px-6 py-6 text-left transition hover:brightness-110 active:scale-[0.99]"
    >
      {/* Tier-coloured radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at top right, ${tierInfo.color}22, transparent 55%)`,
        }}
      />

      <div className="relative">
        {/* Tier badge + hint */}
        <div className="flex items-center justify-between">
          <span
            className="inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em]"
            style={{
              color: tierInfo.color,
              backgroundColor: `${tierInfo.color}18`,
              border: `1px solid ${tierInfo.color}38`,
            }}
          >
            {tier}
          </span>
          <span className="text-[10px] text-white/25">Tap for breakdown →</span>
        </div>

        {/* Score number */}
        <p className="mt-4 font-display text-[2.8rem] font-bold italic leading-none tracking-tight text-white">
          <CountUp end={score} duration={1.2} separator="," />
          <span className="ml-2 text-[1.3rem] font-normal text-white/35">pts</span>
        </p>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: tierInfo.color,
                boxShadow: `0 0 8px ${tierInfo.color}55`,
                transition: "width 1s ease-out",
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-white/30">{tier}</span>
            {nextTier ? (
              <span className="text-[10px] text-white/30">
                {pointsToNext.toLocaleString()} to {nextTier.name}
              </span>
            ) : (
              <span className="text-[10px] text-white/30">Max tier</span>
            )}
          </div>
        </div>

        {/* Rank row */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <MapPin size={12} className="text-white/25" />
            <span className="text-[11px] text-white/45">
              <span className="font-semibold" style={{ color: tierInfo.color }}>
                #{neighbourhoodRank}
              </span>{" "}
              in Osu
            </span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Trophy size={12} className="text-white/25" />
            <span className="text-[11px] text-white/45">
              Top{" "}
              <span className="font-semibold" style={{ color: tierInfo.color }}>
                {cityRankPercent}%
              </span>{" "}
              in Accra
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ── Points breakdown (always inside dark sheet) ─────────────────────────── */

const BREAKDOWN_ITEMS = [
  { label: "Events attended",  share: 0.55, Icon: Ticket },
  { label: "Reviews written",  share: 0.18, Icon: PencilLine },
  { label: "Early buyer bonus",share: 0.12, Icon: Lightning },
  { label: "Streak bonus",     share: 0.09, Icon: Fire },
  { label: "Founding member",  share: 0.06, Icon: Star },
];

export function PulseBreakdown({ score }: { score: number }) {
  return (
    <div className="space-y-2.5 pt-1">
      {BREAKDOWN_ITEMS.map(({ label, share, Icon }) => {
        const pts = Math.round(score * share);
        return (
          <div
            key={label}
            className="flex items-center justify-between rounded-[14px] border border-white/5 bg-white/5 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#4a9f63]/15">
                <Icon size={15} className="text-[#4a9f63]" />
              </div>
              <span className="text-[13px] text-white/70">{label}</span>
            </div>
            <span className="text-[13px] font-bold text-[#4a9f63]">
              +{pts.toLocaleString()}
            </span>
          </div>
        );
      })}

      <div className="mt-2 rounded-[14px] border border-[#4a9f63]/20 bg-[#4a9f63]/10 px-4 py-4 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Total Pulse Score</p>
        <p className="mt-1 font-display text-2xl font-bold italic text-white">
          {score.toLocaleString()} pts
        </p>
      </div>
    </div>
  );
}
