"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Phase = "loading" | "reveal";

function computeStartingScore(interestCount: number) {
  return interestCount * 5 + 10;
}

function getTier(score: number): { label: string; bg: string; color: string } {
  if (score >= 300) return { label: "Regular",  bg: "rgba(95,191,42,0.12)",   color: "#5FBF2A" };
  if (score >= 100) return { label: "Explorer", bg: "rgba(74,122,232,0.12)", color: "#4A7AE8" };
  return               { label: "Newcomer", bg: "rgba(255,255,255,0.04)",  color: "#6B8C6B" };
}

function useCountUp(target: number, duration: number, active: boolean) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, active]);

  return count;
}

const STATS = [
  { value: "89K+", label: "People going out" },
  { value: "340+", label: "Events this month" },
  { value: "28",   label: "Cities" },
];

export default function OnboardingPulsePage() {
  const router = useRouter();
  const [phase,   setPhase]   = useState<Phase>("loading");
  const [loading, setLoading] = useState(false);

  // Read interests count from demo localStorage
  const [interests, setInterests] = useState<string[]>([]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const user = JSON.parse(localStorage.getItem("demo_user") ?? "{}");
    setInterests(user.interests ?? []);
    // Move to reveal phase after 2 seconds
    const t = setTimeout(() => setPhase("reveal"), 2000);
    return () => clearTimeout(t);
  }, []);

  const startingScore = computeStartingScore(interests.length);
  const tier          = getTier(startingScore);
  const displayScore  = useCountUp(startingScore, 1500, phase === "reveal");

  async function handleEnter() {
    setLoading(true);
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("demo_user") ?? "{}");
      localStorage.setItem("demo_user", JSON.stringify({ ...user, onboardingComplete: true }));
    }
    await new Promise((r) => setTimeout(r, 300));
    router.push("/");
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
        textAlign:      "center",
      }}
    >
      {/* Glow orbs */}
      <div style={{ position: "fixed", top: "-128px", left: "-128px", width: "500px", height: "500px", borderRadius: "50%", background: "rgba(95,191,42,0.07)", filter: "blur(160px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-128px", right: "-128px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(95,191,42,0.05)", filter: "blur(140px)", pointerEvents: "none" }} />

      <div
        style={{
          width:    "100%",
          maxWidth: "480px",
          position: "relative",
          zIndex:   1,
          opacity:  1,
          transition: "opacity 300ms ease",
        }}
      >
        {phase === "loading" ? (
          /* PHASE 1 — loading animation */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
            {/* Three expanding rings */}
            <div style={{ position: "relative", width: "80px", height: "80px" }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    position:     "absolute",
                    inset:        0,
                    borderRadius: "50%",
                    border:       "1.5px solid rgba(95,191,42,0.4)",
                    animation:    `ring-expand 1.8s ease-in-out ${i * 0.4}s infinite`,
                  }}
                />
              ))}
              {/* Center dot */}
              <div
                style={{
                  position:       "absolute",
                  inset:          "35%",
                  borderRadius:   "50%",
                  background:     "rgba(95,191,42,0.6)",
                }}
              />
            </div>
            <p style={{ fontSize: "14px", fontWeight: 300, color: "#6B8C6B" }}>
              Calculating your Pulse…
            </p>
          </div>
        ) : (
          /* PHASE 2 — score reveal */
          <div
            style={{
              display:       "flex",
              flexDirection: "column",
              alignItems:    "center",
              gap:           "12px",
              animation:     "fade-up 400ms ease forwards",
            }}
          >
            {/* Score number */}
            <p
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontStyle:  "italic",
                fontSize:   "clamp(56px, 10vw, 72px)",
                fontWeight: 400,
                color:      "#5FBF2A",
                margin:     0,
                lineHeight: 1,
              }}
            >
              {displayScore}
            </p>

            {/* Label + tier */}
            <p
              style={{
                fontSize:      "14px",
                fontWeight:    500,
                color:         "#6B8C6B",
                textTransform: "uppercase",
                letterSpacing: ".08em",
              }}
            >
              Your Pulse Score
            </p>

            <span
              style={{
                background:   tier.bg,
                color:        tier.color,
                borderRadius: "100px",
                padding:      "4px 14px",
                fontSize:     "11px",
                fontWeight:   700,
                textTransform: "uppercase",
                letterSpacing: ".06em",
              }}
            >
              {tier.label}
            </span>

            {/* Tagline */}
            <p
              style={{
                fontFamily:   "'DM Serif Display', serif",
                fontStyle:    "italic",
                fontSize:     "20px",
                color:        "#F5FFF0",
                marginTop:    "8px",
              }}
            >
              Accra's been waiting.
            </p>
            <p style={{ fontSize: "13px", fontWeight: 300, color: "#4A6A4A", lineHeight: 1.5 }}>
              Go out more. Your score grows with every event.
            </p>

            {/* Stats row */}
            <div
              style={{
                display:             "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap:                 "10px",
                width:               "100%",
                marginTop:           "16px",
              }}
            >
              {STATS.map((stat, i) => (
                <div
                  key={stat.label}
                  style={{
                    background:   "var(--bg-card, #0D140D)",
                    border:       "1px solid rgba(95,191,42,0.10)",
                    borderRadius: "12px",
                    padding:      "12px 16px",
                    animation:    `fade-up 400ms ease ${i * 100 + 200}ms both`,
                  }}
                >
                  <p
                    style={{
                      fontFamily:   "'DM Serif Display', serif",
                      fontStyle:    "italic",
                      fontSize:     "20px",
                      color:        "#F5FFF0",
                      marginBottom: "4px",
                    }}
                  >
                    {stat.value}
                  </p>
                  <p style={{ fontSize: "11px", color: "#4A6A4A" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Enter button */}
            <button
              onClick={handleEnter}
              disabled={loading}
              style={{
                display:      "block",
                width:        "100%",
                maxWidth:     "320px",
                height:       "44px",
                borderRadius: "100px",
                background:   loading ? "rgba(95,191,42,0.4)" : "#5FBF2A",
                color:        "#020702",
                fontWeight:   700,
                fontSize:     "14px",
                border:       "none",
                cursor:       loading ? "not-allowed" : "pointer",
                boxShadow:    loading ? "none" : "0 0 18px rgba(95,191,42,0.25)",
                margin:       "24px auto 0",
                transition:   "background 150ms",
                animation:    "fade-up 400ms ease 500ms both",
              }}
            >
              {loading ? "Entering…" : "Enter GoOutside →"}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes ring-expand {
          0%   { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
