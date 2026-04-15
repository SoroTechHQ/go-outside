import Image from "next/image";

// Green glow orbs — applied to right panel background
function GlowOrbs() {
  return (
    <>
      <div
        className="fixed -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "rgba(95,191,42,0.07)", filter: "blur(160px)", zIndex: 0 }}
      />
      <div
        className="fixed -bottom-32 -right-32 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "rgba(95,191,42,0.05)", filter: "blur(140px)", zIndex: 0 }}
      />
    </>
  );
}

// Grain overlay
function GrainOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        opacity:         0.035,
        zIndex:          1,
        backgroundImage: "url('/grain.svg')",
        backgroundSize:  "200px 200px",
      }}
    />
  );
}

// Floating event preview card (glassmorphism)
function FloatingEventCard() {
  return (
    <div
      style={{
        background:     "rgba(13,20,13,0.75)",
        backdropFilter: "blur(16px)",
        border:         "1px solid rgba(95,191,42,0.10)",
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
          fontFamily:   "'DM Serif Display', serif",
          fontStyle:    "italic",
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
          color:        "#6B8C6B",
          marginBottom: "10px",
        }}
      >
        Osu, Accra · GHS 180 · 68 left
      </p>

      {/* Avatar stack */}
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
                  ? "rgba(95,191,42,0.25)"
                  : i === 1
                  ? "rgba(74,122,232,0.25)"
                  : "rgba(232,93,138,0.25)",
                border:         "1.5px solid rgba(13,20,13,0.8)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontSize:       "8px",
                fontWeight:     700,
                color:          "#F5FFF0",
                marginLeft:     i === 0 ? 0 : "-6px",
                zIndex:         3 - i,
                position:       "relative",
              }}
            >
              {initials}
            </div>
          ))}
        </div>
        <span style={{ fontSize: "11px", color: "#4A6A4A" }}>47 people going</span>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100svh" }}>
      {/* Left panel — event photography (desktop only) */}
      <div
        className="hidden md:flex"
        style={{
          width:    "45%",
          flexShrink: 0,
          position: "relative",
          background: "#080D08",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Background image */}
        <Image
          src="https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=900&q=80"
          alt="Event atmosphere"
          fill
          sizes="45vw"
          priority
          style={{ objectFit: "cover" }}
        />

        {/* Dark gradient overlay */}
        <div
          style={{
            position:   "absolute",
            inset:      0,
            background: "linear-gradient(to bottom, rgba(2,7,2,0.3) 0%, rgba(2,7,2,0.7) 100%)",
            zIndex:     1,
          }}
        />

        {/* Content over image */}
        <div
          style={{
            position:      "absolute",
            inset:         0,
            zIndex:        2,
            display:       "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding:       "40px",
          }}
        >
          {/* Wordmark */}
          <p
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontStyle:  "italic",
              fontSize:   "28px",
              color:      "#F5FFF0",
              marginBottom: "8px",
            }}
          >
            GoOutside
          </p>
          <p
            style={{
              fontFamily:   "'DM Sans', sans-serif",
              fontWeight:   300,
              fontSize:     "18px",
              color:        "#6B8C6B",
              marginBottom: "0",
            }}
          >
            Your city is waiting.
          </p>

          {/* Floating event card */}
          <FloatingEventCard />
        </div>
      </div>

      {/* Right panel — form content */}
      <div
        style={{
          flex:           1,
          background:     "var(--bg-base, #020702)",
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
        <GlowOrbs />
        <GrainOverlay />

        {/* Mobile header banner */}
        <div
          className="md:hidden w-full"
          style={{
            position:    "relative",
            height:      "180px",
            marginBottom: "32px",
            borderRadius: "16px",
            overflow:    "hidden",
            flexShrink:  0,
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
              background: "linear-gradient(to bottom, rgba(2,7,2,0.3), rgba(2,7,2,0.75))",
            }}
          />
          <div
            style={{
              position:      "absolute",
              inset:         0,
              display:       "flex",
              alignItems:    "flex-end",
              padding:       "20px",
            }}
          >
            <p
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontStyle:  "italic",
                fontSize:   "24px",
                color:      "#F5FFF0",
              }}
            >
              GoOutside
            </p>
          </div>
        </div>

        {/* Form content — max 420px */}
        <div
          style={{
            width:    "100%",
            maxWidth: "420px",
            position: "relative",
            zIndex:   2,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
