"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { slug: "music",      name: "Music",        emoji: "🎵" },
  { slug: "tech",       name: "Tech",          emoji: "💻" },
  { slug: "food-drink", name: "Food & Drink",  emoji: "🍽️" },
  { slug: "arts",       name: "Arts",          emoji: "🎨" },
  { slug: "sports",     name: "Sports",        emoji: "⚽" },
  { slug: "networking", name: "Networking",    emoji: "🤝" },
  { slug: "education",  name: "Education",     emoji: "🎓" },
  { slug: "community",  name: "Community",     emoji: "🌃" },
] as const;

function ProgressDots({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginBottom: "40px" }}>
      <div style={{ display: "flex", gap: "6px" }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              width:        s === step ? "20px" : "6px",
              height:       "6px",
              borderRadius: "100px",
              background:   s === step ? "#5FBF2A" : "rgba(95,191,42,0.2)",
              transition:   "width 300ms ease",
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: "11px", color: "#4A6A4A" }}>Step {step} of 3</span>
    </div>
  );
}

export default function OnboardingInterestsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);

  function toggle(slug: string) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  async function handleContinue() {
    if (selected.length < 3) return;
    setLoading(true);

    // Demo: save to localStorage
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("demo_user") ?? "{}");
      localStorage.setItem("demo_user", JSON.stringify({ ...user, interests: selected }));
    }

    await new Promise((r) => setTimeout(r, 400));
    setLoading(false);
    router.push("/onboarding/location");
  }

  const enoughSelected = selected.length >= 3;

  return (
    <div
      style={{
        minHeight:      "100svh",
        background:     "#020702",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "48px 24px",
        position:       "relative",
      }}
    >
      {/* Glow orbs */}
      <div style={{ position: "fixed", top: "-128px", left: "-128px", width: "500px", height: "500px", borderRadius: "50%", background: "rgba(95,191,42,0.07)", filter: "blur(160px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-128px", right: "-128px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(95,191,42,0.05)", filter: "blur(140px)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "600px", position: "relative", zIndex: 1 }}>
        <ProgressDots step={1} />

        {/* Heading */}
        <h1
          style={{
            fontFamily:   "'DM Serif Display', serif",
            fontStyle:    "italic",
            fontSize:     "32px",
            color:        "#F5FFF0",
            fontWeight:   400,
            marginBottom: "8px",
            textAlign:    "center",
          }}
        >
          What moves you?
        </h1>
        <p
          style={{
            fontSize:     "15px",
            fontWeight:   300,
            color:        "#6B8C6B",
            textAlign:    "center",
            marginBottom: "32px",
          }}
        >
          Pick at least 3 to personalise your feed from day one
        </p>

        {/* Category grid */}
        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap:                 "10px",
            marginBottom:        "24px",
          }}
          className="interest-grid"
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat.slug);
            return (
              <button
                key={cat.slug}
                onClick={() => toggle(cat.slug)}
                tabIndex={0}
                role="checkbox"
                aria-checked={isSelected}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle(cat.slug);
                  }
                }}
                style={{
                  background:   isSelected ? "rgba(95,191,42,0.10)" : "var(--bg-card, #0D140D)",
                  border:       isSelected
                    ? "1.5px solid #5FBF2A"
                    : "1px solid rgba(95,191,42,0.10)",
                  borderRadius: "14px",
                  padding:      "20px 16px",
                  textAlign:    "center",
                  cursor:       "pointer",
                  boxShadow:    isSelected ? "0 0 12px rgba(95,191,42,0.12)" : "none",
                  transform:    isSelected ? "scale(1.03)" : "scale(1)",
                  transition:   "transform 180ms ease, border-color 150ms, background 150ms, box-shadow 150ms",
                  display:      "flex",
                  flexDirection: "column",
                  alignItems:   "center",
                  gap:          "8px",
                }}
              >
                <span style={{ fontSize: "28px", lineHeight: 1 }}>{cat.emoji}</span>
                <span
                  style={{
                    fontSize:   "13px",
                    fontWeight: 500,
                    color:      isSelected ? "#5FBF2A" : "#6B8C6B",
                    transition: "color 150ms",
                  }}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Counter */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <p
            style={{
              fontSize:   "14px",
              fontWeight: 600,
              color:      enoughSelected ? "#5FBF2A" : "#4A6A4A",
              transition: "color 200ms",
            }}
          >
            {selected.length} selected
          </p>
          {!enoughSelected && (
            <p style={{ fontSize: "12px", color: "#4A6A4A", marginTop: "2px" }}>
              Select at least 3 for better recommendations
            </p>
          )}
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!enoughSelected || loading}
          style={{
            display:      "block",
            width:        "100%",
            height:       "44px",
            borderRadius: "100px",
            background:   !enoughSelected || loading ? "rgba(255,255,255,0.04)" : "#5FBF2A",
            color:        !enoughSelected || loading ? "#4A6A4A" : "#020702",
            fontWeight:   700,
            fontSize:     "14px",
            border:       "none",
            cursor:       !enoughSelected || loading ? "not-allowed" : "pointer",
            boxShadow:    enoughSelected && !loading ? "0 0 18px rgba(95,191,42,0.25)" : "none",
            transition:   "background 200ms, color 200ms, box-shadow 200ms",
            marginBottom: "12px",
          }}
        >
          {loading ? "Saving…" : "Continue →"}
        </button>

        {/* Skip */}
        <button
          onClick={() => router.push("/onboarding/location")}
          style={{
            display:    "block",
            width:      "100%",
            background: "none",
            border:     "none",
            cursor:     "pointer",
            fontSize:   "13px",
            color:      "#4A6A4A",
            textAlign:  "center",
            padding:    "8px",
          }}
        >
          Skip for now
        </button>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .interest-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
