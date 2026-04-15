"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GHANA_CITIES = [
  "Accra",
  "Kumasi",
  "Tamale",
  "Cape Coast",
  "Takoradi",
  "Tema",
  "Ho",
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
              background:   s <= step ? "#5FBF2A" : "rgba(95,191,42,0.2)",
              transition:   "width 300ms ease",
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: "11px", color: "#4A6A4A" }}>Step {step} of 3</span>
    </div>
  );
}

export default function OnboardingLocationPage() {
  const router = useRouter();
  const [city,        setCity]        = useState<string>("Accra");
  const [showCustom,  setShowCustom]  = useState(false);
  const [customCity,  setCustomCity]  = useState("");
  const [focused,     setFocused]     = useState(false);
  const [loading,     setLoading]     = useState(false);

  const selectedCity = showCustom && customCity ? customCity : city;

  async function handleContinue() {
    setLoading(true);

    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("demo_user") ?? "{}");
      localStorage.setItem("demo_user", JSON.stringify({ ...user, locationCity: selectedCity }));
    }

    await new Promise((r) => setTimeout(r, 400));
    setLoading(false);
    router.push("/onboarding/pulse");
  }

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

      <div style={{ width: "100%", maxWidth: "480px", position: "relative", zIndex: 1 }}>
        <ProgressDots step={2} />

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
          Where are you based?
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
          We'll show you events happening near you
        </p>

        {/* City tiles */}
        <div
          style={{
            display:       "grid",
            gridTemplateColumns: "1fr 1fr",
            gap:           "10px",
            marginBottom:  "16px",
          }}
          className="city-grid"
        >
          {GHANA_CITIES.map((c) => {
            const isSelected = !showCustom && city === c;
            return (
              <button
                key={c}
                onClick={() => {
                  setCity(c);
                  setShowCustom(false);
                }}
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "space-between",
                  padding:        "14px 16px",
                  background:     isSelected ? "rgba(95,191,42,0.10)" : "var(--bg-card, #0D140D)",
                  border:         isSelected
                    ? "1.5px solid #5FBF2A"
                    : "1px solid rgba(95,191,42,0.10)",
                  borderRadius:   "14px",
                  cursor:         "pointer",
                  boxShadow:      isSelected ? "0 0 12px rgba(95,191,42,0.12)" : "none",
                  transition:     "border-color 150ms, background 150ms",
                }}
              >
                <span
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontStyle:  "italic",
                    fontSize:   "18px",
                    color:      isSelected ? "#5FBF2A" : "#F5FFF0",
                    transition: "color 150ms",
                  }}
                >
                  {c}
                </span>
                {/* Map pin */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A6A4A" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </button>
            );
          })}
        </div>

        {/* My city isn't listed */}
        {!showCustom ? (
          <button
            onClick={() => setShowCustom(true)}
            style={{
              display:    "block",
              width:      "100%",
              background: "none",
              border:     "none",
              cursor:     "pointer",
              fontSize:   "13px",
              color:      "#5FBF2A",
              textAlign:  "center",
              padding:    "8px",
              marginBottom: "20px",
            }}
          >
            My city isn't listed
          </button>
        ) : (
          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              value={customCity}
              onChange={(e) => setCustomCity(e.target.value)}
              placeholder="Type your city..."
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={{
                display:      "block",
                width:        "100%",
                height:       "44px",
                padding:      "0 14px",
                background:   "#131A13",
                border:       focused
                  ? "1.5px solid rgba(95,191,42,0.40)"
                  : "1.5px solid rgba(95,191,42,0.08)",
                borderRadius: "10px",
                color:        "#F5FFF0",
                fontSize:     "14px",
                outline:      "none",
                boxShadow:    focused ? "0 0 0 3px rgba(95,191,42,0.08)" : "none",
                transition:   "border-color 150ms, box-shadow 150ms",
                boxSizing:    "border-box",
              }}
              autoFocus
            />
          </div>
        )}

        {/* Continue */}
        <button
          onClick={handleContinue}
          disabled={loading || (showCustom && !customCity)}
          style={{
            display:      "block",
            width:        "100%",
            height:       "44px",
            borderRadius: "100px",
            background:   loading || (showCustom && !customCity)
              ? "rgba(255,255,255,0.04)"
              : "#5FBF2A",
            color:        loading || (showCustom && !customCity) ? "#4A6A4A" : "#020702",
            fontWeight:   700,
            fontSize:     "14px",
            border:       "none",
            cursor:       loading || (showCustom && !customCity) ? "not-allowed" : "pointer",
            boxShadow:    !loading && !(showCustom && !customCity)
              ? "0 0 18px rgba(95,191,42,0.25)"
              : "none",
            transition:   "background 200ms, color 200ms",
            marginBottom: "12px",
          }}
        >
          {loading ? "Saving…" : "Continue →"}
        </button>

        <button
          onClick={() => router.push("/onboarding/pulse")}
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
        @media (max-width: 480px) {
          .city-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
