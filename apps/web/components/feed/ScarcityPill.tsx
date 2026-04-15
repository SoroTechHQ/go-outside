"use client";

type ScarcityState = "normal" | "selling_fast" | "almost_sold_out" | "final_spots" | "sold_out";

interface ScarcityPillProps {
  state:  ScarcityState;
  label:  string;
  className?: string;
}

// Only render for states that warrant urgency
const VISIBLE_STATES: ScarcityState[] = ["almost_sold_out", "final_spots", "sold_out"];

export function ScarcityPill({ state, label, className = "" }: ScarcityPillProps) {
  if (!VISIBLE_STATES.includes(state) || !label) return null;

  const isSoldOut = state === "sold_out";

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      style={{
        background:   isSoldOut ? "rgba(229, 83, 75, 0.10)"  : "rgba(232, 147, 42, 0.10)",
        border:       isSoldOut ? "1px solid rgba(229, 83, 75, 0.18)" : "1px solid rgba(232, 147, 42, 0.18)",
        borderRadius: "100px",
        padding:      "3px 9px",
      }}
    >
      {/* Pulsing dot */}
      <span
        style={{
          width:        "5px",
          height:       "5px",
          borderRadius: "50%",
          background:   isSoldOut ? "#E5534B" : "#E8932A",
          flexShrink:   0,
          animation:    isSoldOut ? "none" : "scarcity-pulse 1.6s ease-in-out infinite",
        }}
      />
      <span
        style={{
          fontSize:    "11px",
          fontWeight:  500,
          color:       isSoldOut ? "#E5534B" : "#E8932A",
          whiteSpace:  "nowrap",
          lineHeight:  1,
        }}
      >
        {label}
      </span>

      <style>{`
        @keyframes scarcity-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
