import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// ─── Query params ──────────────────────────────────────────────────────────────
// ?type=default|event|user|organizer|category
// ?title=     event/user/organizer/category name
// ?subtitle=  date+venue for events, tier for users, tagline for organizer
// ?image=     cover/avatar URL (optional)
// ?tag=       category pill text (optional — e.g. "Music & Nightlife")
// ?meta=      bottom-right meta text (e.g. "Accra · Sat 28 Dec")
// ?verified=  "1" to show verified badge

const BASE  = process.env.NEXT_PUBLIC_APP_URL ?? "https://gooutside.club";
const BRAND = "#4a9f63";
const WHITE = "#ffffff";
const OFF   = "#f7f7f3";

// ── Font loader (Inter from Google Fonts) ─────────────────────────────────────
async function loadFont(weight: 400 | 700 | 900) {
  const url = `https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff`;
  // Use a subset — edge function cannot load large fonts
  const res = await fetch(
    `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&display=swap`,
  ).catch(() => null);
  if (!res) return null;
  const css = await res.text();
  const m = css.match(/src: url\(([^)]+)\)/);
  if (!m) return null;
  const fontRes = await fetch(m[1]).catch(() => null);
  if (!fontRes) return null;
  return fontRes.arrayBuffer();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const type     = searchParams.get("type") ?? "default";
  const title    = searchParams.get("title") ?? "GoOutside";
  const subtitle = searchParams.get("subtitle") ?? "";
  const image    = searchParams.get("image") ?? "";
  const tag      = searchParams.get("tag") ?? "";
  const meta     = searchParams.get("meta") ?? "";
  const verified = searchParams.get("verified") === "1";

  // Try loading fonts — fall back to system fonts if edge can't reach Google
  const [regular, bold, black] = await Promise.all([
    loadFont(400),
    loadFont(700),
    loadFont(900),
  ]);

  const fonts = [
    ...(regular ? [{ name: "Inter", data: regular, weight: 400 as const, style: "normal" as const }] : []),
    ...(bold    ? [{ name: "Inter", data: bold,    weight: 700 as const, style: "normal" as const }] : []),
    ...(black   ? [{ name: "Inter", data: black,   weight: 900 as const, style: "normal" as const }] : []),
  ];

  const W = 1200;
  const H = 630;

  // ── Tag pill ──────────────────────────────────────────────────────────────────
  const TagPill = tag ? (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "rgba(74,159,99,0.15)",
        border: "1px solid rgba(74,159,99,0.35)",
        borderRadius: 100,
        padding: "6px 16px",
        marginBottom: 20,
      }}
    >
      <span style={{ color: BRAND, fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {tag}
      </span>
    </div>
  ) : null;

  // ── Verified badge ────────────────────────────────────────────────────────────
  const VerifiedBadge = verified ? (
    <span style={{ marginLeft: 10, display: "inline-flex", alignItems: "center" }}>
      <svg width="24" height="24" viewBox="0 0 256 256" fill={BRAND}>
        <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/>
      </svg>
    </span>
  ) : null;

  // ── Shared bottom bar ─────────────────────────────────────────────────────────
  const BottomBar = (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 48px",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(8px)",
      }}
    >
      <span style={{ color: WHITE, fontWeight: 900, fontSize: 14, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.9 }}>
        GoOutside
      </span>
      {meta ? (
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500 }}>
          {meta}
        </span>
      ) : (
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>gooutside.club</span>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // TEMPLATE: EVENT
  // Full-bleed cover image, dark overlay, title bottom-left
  // ─────────────────────────────────────────────────────────────────────────────
  if (type === "event") {
    return new ImageResponse(
      (
        <div style={{ width: W, height: H, display: "flex", position: "relative", background: "#0a0a0a", overflow: "hidden" }}>
          {/* Cover image */}
          {image && (
            <img
              src={image}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
            />
          )}
          {/* Gradient overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%)",
            display: "flex",
          }} />

          {/* Content */}
          <div style={{ position: "absolute", left: 48, right: 48, bottom: 80, display: "flex", flexDirection: "column" }}>
            {TagPill}
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ color: WHITE, fontWeight: 900, fontSize: 56, lineHeight: 1.1, letterSpacing: "-0.03em", maxWidth: 800 }}>
                {title}
              </span>
              {VerifiedBadge}
            </div>
            {subtitle && (
              <span style={{ color: "rgba(255,255,255,0.75)", fontWeight: 500, fontSize: 22, marginTop: 12 }}>
                {subtitle}
              </span>
            )}
          </div>

          {BottomBar}
        </div>
      ),
      { width: W, height: H, fonts },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEMPLATE: USER PROFILE
  // Avatar left, name + tier right, branded green accent bar top
  // ─────────────────────────────────────────────────────────────────────────────
  if (type === "user") {
    return new ImageResponse(
      (
        <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: "#0f0f0f", position: "relative" }}>
          {/* Green accent top bar */}
          <div style={{ width: "100%", height: 6, background: BRAND, display: "flex" }} />

          {/* Main content */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 72px" }}>
            {/* Avatar */}
            <div style={{
              width: 160, height: 160, borderRadius: "50%",
              border: `4px solid ${BRAND}`,
              overflow: "hidden", flexShrink: 0, display: "flex",
              background: "#1a1a1a",
            }}>
              {image ? (
                <img src={image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: BRAND, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: WHITE, fontWeight: 900, fontSize: 64 }}>{title[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Text */}
            <div style={{ marginLeft: 48, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ color: WHITE, fontWeight: 900, fontSize: 54, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{title}</span>
                {VerifiedBadge}
              </div>
              {subtitle && (
                <span style={{ color: "rgba(255,255,255,0.55)", fontWeight: 500, fontSize: 22, marginTop: 12 }}>{subtitle}</span>
              )}
              {tag && (
                <div style={{ display: "flex", marginTop: 20 }}>
                  <div style={{ background: "rgba(74,159,99,0.2)", border: "1px solid rgba(74,159,99,0.4)", borderRadius: 100, padding: "6px 18px" }}>
                    <span style={{ color: BRAND, fontWeight: 700, fontSize: 14 }}>{tag}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {BottomBar}
        </div>
      ),
      { width: W, height: H, fonts },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEMPLATE: ORGANIZER
  // Logo left, name + tagline right, dark card style
  // ─────────────────────────────────────────────────────────────────────────────
  if (type === "organizer") {
    return new ImageResponse(
      (
        <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: "#0c0c0c", position: "relative" }}>
          {/* Subtle grid pattern via repeating gradient */}
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at 80% 50%, rgba(74,159,99,0.08) 0%, transparent 60%)",
            display: "flex",
          }} />

          <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 72px", position: "relative" }}>
            {/* Logo */}
            <div style={{
              width: 140, height: 140, borderRadius: 28,
              border: "1px solid rgba(255,255,255,0.1)",
              overflow: "hidden", flexShrink: 0, display: "flex",
              background: "#1a1a1a",
            }}>
              {image ? (
                <img src={image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: BRAND }}>
                  <span style={{ color: WHITE, fontWeight: 900, fontSize: 56 }}>{title[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>

            <div style={{ marginLeft: 48, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ color: WHITE, fontWeight: 900, fontSize: 52, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{title}</span>
                {VerifiedBadge}
              </div>
              {subtitle && (
                <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 400, fontSize: 22, marginTop: 14 }}>{subtitle}</span>
              )}
              {tag && (
                <div style={{ display: "flex", marginTop: 20 }}>
                  <div style={{ background: "rgba(74,159,99,0.15)", border: "1px solid rgba(74,159,99,0.3)", borderRadius: 100, padding: "6px 18px" }}>
                    <span style={{ color: BRAND, fontWeight: 700, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.1em" }}>{tag}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {BottomBar}
        </div>
      ),
      { width: W, height: H, fonts },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEMPLATE: CATEGORY
  // Big category name, brand green, clean
  // ─────────────────────────────────────────────────────────────────────────────
  if (type === "category") {
    return new ImageResponse(
      (
        <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: "#0a0a0a", position: "relative" }}>
          <div style={{
            position: "absolute", inset: 0,
            background: `radial-gradient(ellipse at 30% 50%, rgba(74,159,99,0.12) 0%, transparent 65%)`,
            display: "flex",
          }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 72px", position: "relative" }}>
            <span style={{ color: BRAND, fontWeight: 900, fontSize: 13, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 20 }}>
              Browse Events
            </span>
            <span style={{ color: WHITE, fontWeight: 900, fontSize: 72, letterSpacing: "-0.04em", lineHeight: 1.05, maxWidth: 700 }}>
              {title}
            </span>
            {subtitle && (
              <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 400, fontSize: 22, marginTop: 20 }}>{subtitle}</span>
            )}
          </div>
          {BottomBar}
        </div>
      ),
      { width: W, height: H, fonts },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEMPLATE: DEFAULT (home / marketing / fallback)
  // ─────────────────────────────────────────────────────────────────────────────
  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: "#0a0a0a", position: "relative" }}>
        {/* Glow */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 60%, rgba(74,159,99,0.14) 0%, transparent 65%)",
          display: "flex",
        }} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
          {/* Wordmark */}
          <span style={{ color: BRAND, fontWeight: 900, fontSize: 14, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 24 }}>
            GoOutside
          </span>
          <span style={{ color: WHITE, fontWeight: 900, fontSize: 76, letterSpacing: "-0.04em", lineHeight: 1, textAlign: "center", maxWidth: 800 }}>
            {title !== "GoOutside" ? title : "What's on\nin Accra?"}
          </span>
          {subtitle && (
            <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 400, fontSize: 24, marginTop: 24, textAlign: "center" }}>
              {subtitle}
            </span>
          )}
          {!subtitle && (
            <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400, fontSize: 22, marginTop: 20 }}>
              Social-first event discovery for Ghana
            </span>
          )}
        </div>

        {BottomBar}
      </div>
    ),
    { width: W, height: H, fonts },
  );
}
