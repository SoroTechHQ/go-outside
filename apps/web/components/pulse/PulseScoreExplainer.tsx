"use client";

import * as Popover from "@radix-ui/react-popover";
import { Info, Lightning } from "@phosphor-icons/react";
import { PULSE_TIERS, type PulseTier } from "../../app/dashboard/profile/types";

const TIER_EMOJI: Record<string, string> = {
  Newcomer:      "🌱",
  Explorer:      "🧭",
  Regular:       "🔥",
  "Scene Kid":   "⚡",
  "City Native": "🏙️",
  Legend:        "👑",
};

export function PulseScoreExplainer({
  iconSize = 13,
  currentTier,
}: {
  iconSize?: number;
  currentTier?: PulseTier;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="What is Pulse Score?"
          className="inline-flex items-center justify-center rounded-full text-[var(--text-tertiary)] opacity-50 transition hover:opacity-90 focus:outline-none"
        >
          <Info size={iconSize} weight="bold" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="center"
          sideOffset={8}
          collisionPadding={16}
          className="z-[200] w-[252px] rounded-2xl border border-white/8 bg-[#0c1c10] shadow-2xl shadow-black/40 outline-none animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4a9f63]/20">
                <Lightning size={11} weight="fill" className="text-[#4a9f63]" />
              </div>
              <p className="text-[13px] font-bold text-white">Outside Score</p>
            </div>
            <p className="text-[11.5px] leading-[1.65] text-white/50">
              The more you go out, the higher your Outside Score rises. Attend events, buy tickets, and explore Accra to earn points and unlock new tiers.
            </p>
          </div>

          <div className="h-px bg-white/6 mx-4" />

          {/* Tiers */}
          <div className="px-3 py-3 space-y-0.5">
            <p className="px-1 mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/25">Tiers</p>
            {PULSE_TIERS.map((t) => {
              const isActive = t.name === currentTier;
              const rangeLabel = t.max === Infinity
                ? `${t.min.toLocaleString()}+`
                : `${t.min.toLocaleString()} – ${t.max.toLocaleString()}`;
              return (
                <div
                  key={t.name}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition"
                  style={{
                    backgroundColor: isActive ? `${t.color}18` : "transparent",
                  }}
                >
                  {/* Color dot */}
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  {/* Emoji + name */}
                  <span className="text-[11px]">{TIER_EMOJI[t.name]}</span>
                  <span
                    className="flex-1 text-[12px] font-semibold"
                    style={{ color: isActive ? t.color : "rgba(255,255,255,0.6)" }}
                  >
                    {t.name}
                  </span>
                  {/* Range */}
                  <span className="text-[10px] tabular-nums text-white/25">{rangeLabel}</span>
                  {isActive && (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide"
                      style={{ backgroundColor: `${t.color}25`, color: t.color }}
                    >
                      You
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <Popover.Arrow className="fill-[#0c1c10]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
