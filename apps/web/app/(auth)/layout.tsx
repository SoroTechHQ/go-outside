import Image from "next/image";

// Floating event preview card (glassmorphism — only on the dark image panel)
function FloatingEventCard() {
  return (
    <div
      style={{
        background:     "rgba(13,20,13,0.75)",
        backdropFilter: "blur(16px)",
        border:         "1px solid rgba(95,191,42,0.15)",
        borderRadius:   "14px",
        padding:        "16px",
        marginTop:      "24px",
      }}
    >
      <p
        style={{
          fontSize:      "9px",
          color:         "#5FBF2A",
          fontWeight:    700,
          textTransform: "uppercase",
          letterSpacing: ".1em",
          marginBottom:  "8px",
        }}
      >
        🔥 Trending tonight
      </p>
      <p
        style={{
          fontFamily:   "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif",
          fontWeight:   600,
          fontSize:     "16px",
          color:        "#FFFFFF",
          marginBottom: "6px",
        }}
      >
        Ga Rooftop After Hours
      </p>
      <p
        style={{
          fontSize:     "11px",
          color:        "rgba(255,255,255,0.55)",
          marginBottom: "12px",
        }}
      >
        Osu, Accra · GHS 180 · 68 left
      </p>

      {/* Avatar stack + count */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ display: "flex" }}>
          {["KO", "AM", "EK"].map((initials, i) => (
            <div
              key={initials}
              style={{
                width:          "24px",
                height:         "24px",
                borderRadius:   "50%",
                background:     i === 0
                  ? "rgba(95,191,42,0.35)"
                  : i === 1
                  ? "rgba(74,122,232,0.35)"
                  : "rgba(232,93,138,0.35)",
                border:         "1.5px solid rgba(13,20,13,0.8)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontSize:       "8px",
                fontWeight:     700,
                color:          "#ffffff",
                marginLeft:     i === 0 ? 0 : "-6px",
                zIndex:         3 - i,
                position:       "relative",
              }}
            >
              {initials}
            </div>
          ))}
        </div>
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>47 people going</span>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display:    "flex",
        minHeight:  "100svh",
        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif",
      }}
    >
      {/* ── Left panel — event photography (desktop only) ─────────────── */}
      <div
        className="hidden md:flex"
        style={{
          width:         "44%",
          flexShrink:    0,
          position:      "relative",
          background:    "#080D08",
          flexDirection: "column",
          overflow:      "hidden",
        }}
      >
        <Image
          src="https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=900&q=80"
          alt="Event atmosphere"
          fill
          sizes="44vw"
          priority
          style={{ objectFit: "cover", opacity: 0.85 }}
        />

        {/* Gradient overlay */}
        <div
          style={{
            position:   "absolute",
            inset:      0,
            background: "linear-gradient(to bottom, rgba(2,7,2,0.15) 0%, rgba(2,7,2,0.75) 100%)",
            zIndex:     1,
          }}
        />

        {/* Content over image */}
        <div
          style={{
            position:       "absolute",
            inset:          0,
            zIndex:         2,
            display:        "flex",
            flexDirection:  "column",
            justifyContent: "flex-end",
            padding:        "40px",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span
              style={{
                width:          "28px",
                height:         "28px",
                borderRadius:   "7px",
                background:     "#0f110f",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="3" fill="#2f8f45" />
                <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.5" />
              </svg>
            </span>
            <span style={{ fontSize: "18px", fontWeight: 600, color: "#ffffff", letterSpacing: "-0.02em" }}>
              GoOutside
            </span>
          </div>

          <p style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", marginBottom: "6px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            Your city is waiting.
          </p>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", marginBottom: "0" }}>
            Find out what people like you are doing this weekend.
          </p>

          <FloatingEventCard />
        </div>
      </div>

      {/* ── Right panel — form ─────────────────────────────────────────── */}
      <div
        style={{
          flex:           1,
          background:     "#ffffff",
          overflowY:      "auto",
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          position:       "relative",
          padding:        "48px 24px",
          minHeight:      "100svh",
        }}
      >
        {/* Subtle top gradient accent */}
        <div
          style={{
            position:   "absolute",
            top:        0,
            left:       0,
            right:      0,
            height:     "3px",
            background: "linear-gradient(to right, #2f8f45, #5FBF2A)",
            zIndex:     1,
          }}
        />

        {/* Mobile hero banner */}
        <div
          className="md:hidden w-full"
          style={{
            position:     "relative",
            height:       "160px",
            marginBottom: "32px",
            borderRadius: "16px",
            overflow:     "hidden",
            flexShrink:   0,
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
              position:   "absolute",
              inset:      0,
              background: "linear-gradient(to bottom, rgba(2,7,2,0.2), rgba(2,7,2,0.7))",
            }}
          />
          <div
            style={{
              position:   "absolute",
              inset:      0,
              display:    "flex",
              alignItems: "flex-end",
              padding:    "20px",
              gap:        "8px",
            }}
          >
            <span
              style={{
                width:          "22px",
                height:         "22px",
                borderRadius:   "6px",
                background:     "#0f110f",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="3" fill="#2f8f45" />
                <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.5" />
              </svg>
            </span>
            <span style={{ fontSize: "20px", fontWeight: 600, color: "#ffffff", letterSpacing: "-0.02em" }}>
              GoOutside
            </span>
          </div>
        </div>

        {/* Form content */}
        <div style={{ width: "100%", maxWidth: "400px", position: "relative", zIndex: 2 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
