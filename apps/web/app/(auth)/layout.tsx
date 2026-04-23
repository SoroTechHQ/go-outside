import Image from "next/image";
import { ForceLight } from "./ForceLight";

function FloatingEventCard() {
  return (
    <div
      style={{
        background:     "rgba(10,16,10,0.72)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border:         "1px solid rgba(47,143,69,0.20)",
        borderRadius:   "16px",
        padding:        "18px 20px",
        marginTop:      "28px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
        <span
          style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "#5FBF2A", display: "inline-block",
            boxShadow: "0 0 6px #5FBF2A",
          }}
        />
        <p
          style={{
            fontSize: "9px", color: "#5FBF2A", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: ".12em", margin: 0,
          }}
        >
          Trending tonight
        </p>
      </div>
      <p
        style={{
          fontWeight: 700, fontSize: "16px", color: "#FFFFFF",
          marginBottom: "4px", lineHeight: 1.3, letterSpacing: "-0.01em",
        }}
      >
        Ga Rooftop After Hours
      </p>
      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginBottom: "14px" }}>
        Osu, Accra · GHS 180 · 68 tickets left
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ display: "flex" }}>
          {[
            { initials: "KO", bg: "rgba(95,191,42,0.4)" },
            { initials: "AM", bg: "rgba(74,122,232,0.4)" },
            { initials: "EK", bg: "rgba(232,93,138,0.4)" },
          ].map(({ initials, bg }, i) => (
            <div
              key={initials}
              style={{
                width: "26px", height: "26px", borderRadius: "50%",
                background: bg,
                border: "2px solid rgba(10,16,10,0.8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "8px", fontWeight: 800, color: "#fff",
                marginLeft: i === 0 ? 0 : "-7px",
                zIndex: 3 - i, position: "relative",
              }}
            >
              {initials}
            </div>
          ))}
        </div>
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.40)", fontWeight: 500 }}>
          47 people going
        </span>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // Force light theme — auth pages are always light regardless of user OS/app preference
    <>
    <ForceLight />
    <div
      data-theme="light"
      style={{
        display: "flex",
        minHeight: "100svh",
        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif",
        background: "#ffffff",
      }}
    >
      {/* ── Left panel — event photography ───────────────────────────── */}
      <div
        className="hidden md:flex"
        style={{
          width: "42%",
          flexShrink: 0,
          position: "relative",
          background: "#080D08",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Image
          src="https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=900&q=80"
          alt="Event atmosphere"
          fill
          sizes="42vw"
          priority
          style={{ objectFit: "cover", opacity: 0.80 }}
        />

        {/* Gradient overlay — heavier at bottom for legibility */}
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 1,
            background: "linear-gradient(to bottom, rgba(2,7,2,0.08) 0%, rgba(2,7,2,0.55) 60%, rgba(2,7,2,0.88) 100%)",
          }}
        />

        {/* Panel content */}
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 2,
            display: "flex", flexDirection: "column",
            justifyContent: "space-between",
            padding: "36px 40px",
          }}
        >
          {/* Top — logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Image
              src="/logo-mini.png"
              alt="GoOutside"
              width={36}
              height={36}
              style={{ borderRadius: "10px" }}
              priority
            />
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }}>
              GoOutside
            </span>
          </div>

          {/* Bottom — tagline + card */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "12px" }}>
              Accra · Kumasi · Takoradi
            </p>
            <p style={{ fontSize: "26px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "8px" }}>
              Your city<br />is waiting.
            </p>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.50)", lineHeight: 1.5, fontWeight: 400 }}>
              Find out what people like you<br />are doing this weekend.
            </p>
            <FloatingEventCard />
          </div>
        </div>
      </div>

      {/* ── Right panel — auth form ───────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          background: "#ffffff",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          padding: "48px 24px",
          minHeight: "100svh",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "3px",
            background: "linear-gradient(90deg, #2f8f45 0%, #5FBF2A 100%)",
          }}
        />

        {/* Mobile hero image */}
        <div
          className="md:hidden w-full"
          style={{
            position: "relative", height: "148px",
            marginBottom: "32px", borderRadius: "18px", overflow: "hidden", flexShrink: 0,
          }}
        >
          <Image
            src="https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=800&q=70"
            alt="Event atmosphere"
            fill
            style={{ objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to bottom, rgba(2,7,2,0.15), rgba(2,7,2,0.72))",
            }}
          />
          <div
            style={{
              position: "absolute", bottom: "18px", left: "20px",
              display: "flex", alignItems: "center", gap: "8px",
            }}
          >
            <Image
              src="/logo-mini.png"
              alt="GoOutside"
              width={28}
              height={28}
              style={{ borderRadius: "7px" }}
            />
            <span style={{ fontSize: "17px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }}>
              GoOutside
            </span>
          </div>
        </div>

        {/* Let Clerk render its own card */}
        <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 2 }}>
          {children}
        </div>

        {/* Footer */}
        <p
          style={{
            marginTop: "28px", fontSize: "12px",
            color: "#b0b0b0", textAlign: "center",
          }}
        >
          © {new Date().getFullYear()} GoOutside · Ghana
        </p>
      </div>
    </div>
    </>
  );
}
