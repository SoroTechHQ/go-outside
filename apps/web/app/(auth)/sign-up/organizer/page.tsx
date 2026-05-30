import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

const clerkAppearance = {
  variables: {
    colorPrimary:         "#2f8f45",
    colorBackground:      "#ffffff",
    colorInputBackground: "#f5faf5",
    colorInputText:       "#0f110f",
    colorText:            "#0f110f",
    colorTextSecondary:   "#4a7a55",
    colorNeutral:         "#0f110f",
    colorDanger:          "#dc2626",
    borderRadius:         "12px",
    fontFamily:           "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif",
    fontSize:             "14px",
    spacingUnit:          "16px",
  },
  elements: {
    card:                        "shadow-none p-0 bg-transparent border-0",
    cardBox:                     "shadow-none bg-transparent",
    rootBox:                     "w-full",
    headerTitle:                 "text-[22px] font-bold tracking-tight text-[#0f110f]",
    headerSubtitle:              "text-[13px] text-[#4a7a55] mt-1",
    logoBox:                     "hidden",
    socialButtonsBlockButton:    "h-11 rounded-xl border border-[#bbf7d0] bg-white text-[#0f110f] text-[13px] font-medium transition hover:bg-[#f0fdf4] hover:border-[#86efac] shadow-none",
    socialButtonsBlockButtonText:"font-medium text-[#0f110f]",
    socialButtonsIconButton:     "h-11 w-11 rounded-xl border border-[#bbf7d0] bg-white shadow-none hover:bg-[#f0fdf4] hover:border-[#86efac] transition",
    dividerRow:                  "my-4",
    dividerLine:                 "bg-[#bbf7d0]",
    dividerText:                 "text-[11px] font-semibold text-[#4a7a55] uppercase tracking-[.06em] px-3",
    formFieldLabel:              "text-[11px] font-semibold uppercase tracking-[.08em] text-[#4a7a55] mb-1",
    formFieldInput:              "h-11 rounded-xl border border-[#bbf7d0] bg-[#f5faf5] text-[#0f110f] text-[14px] placeholder-[#86aa8a] focus:border-[#2f8f45] focus:ring-2 focus:ring-[#2f8f45]/20 outline-none transition-all shadow-none",
    formFieldInputShowPasswordButton: "text-[#86aa8a] hover:text-[#4a7a55]",
    formButtonPrimary:           "h-11 rounded-xl bg-[#2f8f45] text-white text-[14px] font-semibold hover:bg-[#256f36] active:bg-[#1e5c2c] transition-colors shadow-[0_2px_12px_rgba(47,143,69,0.3)] mt-1",
    footerActionLink:            "text-[#2f8f45] font-semibold hover:text-[#256f36] transition-colors",
    footerActionText:            "text-[#4a7a55]",
    footer:                      "pt-4 mt-1",
    formFieldErrorText:          "text-[12px] text-[#dc2626] mt-1",
    alert:                       "rounded-xl border border-[#fecaca] bg-[#fef2f2] text-[#dc2626] text-[13px] p-3",
    main:                        "gap-4",
    form:                        "gap-3",
  },
};

export default function OrganizerSignUpPage() {
  return (
    <>
      {/* Organizer header banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0d2010 0%, #0f1f0f 100%)",
          border: "1px solid rgba(95,191,42,0.35)",
          borderRadius: "18px",
          padding: "20px 22px",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow orbs */}
        <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(95,191,42,0.15)", filter: "blur(40px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-20px", left: "20px", width: "80px", height: "80px", borderRadius: "50%", background: "rgba(47,143,69,0.1)", filter: "blur(30px)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Logo + badge row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "28px", height: "28px", borderRadius: "7px", background: "rgba(95,191,42,0.2)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(95,191,42,0.3)" }}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="3" fill="#5FBF2A" />
                  <circle cx="7" cy="7" r="6" stroke="rgba(95,191,42,0.6)" strokeWidth="1.5" />
                </svg>
              </span>
              <span style={{ fontSize: "15px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>GoOutside</span>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#5FBF2A", textTransform: "uppercase", letterSpacing: "0.12em", background: "rgba(95,191,42,0.12)", border: "1px solid rgba(95,191,42,0.25)", borderRadius: "100px", padding: "3px 10px" }}>
              Organizer
            </span>
          </div>

          {/* Headline */}
          <p style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            Welcome, Organizer.
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.50)", lineHeight: 1.5 }}>
            List events, sell tickets, and grow your audience in Ghana.
          </p>

          {/* Feature pills */}
          <div style={{ display: "flex", gap: "6px", marginTop: "14px", flexWrap: "wrap" }}>
            {["Free to list", "5% on paid tickets", "Real-time analytics", "QR check-in"].map((f) => (
              <span
                key={f}
                style={{
                  fontSize: "11px", fontWeight: 600, color: "#5FBF2A",
                  background: "rgba(95,191,42,0.1)", border: "1px solid rgba(95,191,42,0.2)",
                  borderRadius: "100px", padding: "3px 10px",
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      <SignUp
        appearance={clerkAppearance}
        forceRedirectUrl="/organizer"
        initialValues={{ unsafeMetadata: { role: "organizer" } } as Record<string, unknown>}
      />

      {/* Back to attendee sign-up */}
      <div style={{ marginTop: "16px", textAlign: "center" }}>
        <Link
          href="/sign-up"
          style={{ fontSize: "12px", color: "#86aa8a", textDecoration: "none" }}
        >
          Signing up as an attendee instead? →
        </Link>
      </div>
    </>
  );
}
