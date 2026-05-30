"use client";

import { Star } from "@phosphor-icons/react";

interface Props {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const sizes = {
  sm: { icon: 10, text: "text-[10px]", px: "px-1.5 py-0.5", gap: "gap-1" },
  md: { icon: 12, text: "text-[11px]", px: "px-2 py-1",   gap: "gap-1.5" },
  lg: { icon: 14, text: "text-[13px]", px: "px-3 py-1.5", gap: "gap-2"   },
};

export function FoundingExplorerBadge({ size = "md", showLabel = true }: Props) {
  const s = sizes[size];
  return (
    <span
      className={`inline-flex items-center ${s.gap} ${s.px} rounded-full font-semibold tracking-wide`}
      style={{
        background:  "linear-gradient(135deg, #3d2700 0%, #1a1000 100%)",
        border:      "1px solid #b45309",
        color:       "#fbbf24",
        boxShadow:   "0 0 8px rgba(180,83,9,0.25)",
      }}
    >
      <Star size={s.icon} weight="fill" style={{ color: "#fbbf24" }} />
      {showLabel && (
        <span className={`${s.text} uppercase leading-none`} style={{ letterSpacing: "0.05em" }}>
          Founding Explorer
        </span>
      )}
    </span>
  );
}
