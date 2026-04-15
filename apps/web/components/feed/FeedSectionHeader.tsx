"use client";

interface FeedSectionHeaderProps {
  label:       string;
  subtitle?:   string;
  /** "minimal" → dot + label + See all (For You, Trending, etc.)
   *  "contextual" → serif italic headline (Because Kofi, Tonight in Accra) */
  variant?:    "minimal" | "contextual";
  onSeeAll?:   () => void;
  className?:  string;
}

export function FeedSectionHeader({
  label,
  subtitle,
  variant = "minimal",
  onSeeAll,
  className = "",
}: FeedSectionHeaderProps) {
  if (variant === "contextual") {
    return (
      <div className={`mb-4 ${className}`}>
        <h3
          style={{
            fontFamily: "'DM Serif Display', 'Georgia', serif",
            fontSize:   "19px",
            fontStyle:  "italic",
            fontWeight: 400,
            color:      "var(--text-primary)",
            margin:     0,
          }}
        >
          {label}
        </h3>
        {subtitle && (
          <p
            style={{
              fontSize:   "12px",
              color:      "var(--text-tertiary)",
              marginTop:  "2px",
              fontWeight: 300,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  // Minimal variant
  return (
    <div
      className={`flex items-center justify-between mb-3 ${className}`}
    >
      <div className="flex items-center gap-2">
        <div
          style={{
            width:        "6px",
            height:       "6px",
            borderRadius: "50%",
            background:   "var(--neon, var(--brand))",
            flexShrink:   0,
          }}
        />
        <span
          style={{
            fontSize:   "13px",
            fontWeight: 500,
            color:      "var(--text-secondary)",
          }}
        >
          {label}
        </span>
        {subtitle && (
          <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
            · {subtitle}
          </span>
        )}
      </div>

      {onSeeAll && (
        <button
          onClick={onSeeAll}
          style={{
            fontSize:   "12px",
            color:      "var(--text-tertiary)",
            background: "none",
            border:     "none",
            cursor:     "pointer",
            padding:    "2px 0",
          }}
        >
          See all
        </button>
      )}
    </div>
  );
}
