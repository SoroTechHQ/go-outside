"use client";

/** Exact-dimension skeleton matching EventCard grid variant.
 *  Prevents layout shift during infinite scroll loading. */
export function SkeletonCard() {
  return (
    <div
      style={{
        background:   "var(--bg-card)",
        border:       "1px solid var(--border-card)",
        borderRadius: "16px",
        overflow:     "hidden",
      }}
    >
      {/* Image area */}
      <div
        style={{
          height:       "160px",
          background:   "rgba(255,255,255,0.05)",
          borderRadius: "12px 12px 0 0",
          animation:    "sk-pulse 1.5s ease-in-out infinite",
        }}
      />

      {/* Body */}
      <div style={{ padding: "12px 14px 14px" }}>
        {/* Eyebrow */}
        <div
          style={{
            height:       "10px",
            width:        "33%",
            background:   "rgba(255,255,255,0.05)",
            borderRadius: "4px",
            marginBottom: "8px",
            animation:    "sk-pulse 1.5s ease-in-out infinite 0.1s",
          }}
        />
        {/* Title */}
        <div
          style={{
            height:       "20px",
            width:        "75%",
            background:   "rgba(255,255,255,0.08)",
            borderRadius: "4px",
            marginBottom: "10px",
            animation:    "sk-pulse 1.5s ease-in-out infinite 0.2s",
          }}
        />
        {/* Footer */}
        <div
          style={{
            height:       "12px",
            width:        "50%",
            background:   "rgba(255,255,255,0.05)",
            borderRadius: "4px",
            animation:    "sk-pulse 1.5s ease-in-out infinite 0.3s",
          }}
        />
      </div>

      <style>{`
        @keyframes sk-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
