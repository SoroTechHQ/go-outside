import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Buildings, ArrowRight } from "@phosphor-icons/react/dist/ssr";

const clerkAppearance = {
  variables: {
    colorPrimary:         "#2f8f45",
    colorBackground:      "#ffffff",
    colorInputBackground: "#f7f7f7",
    colorInputText:       "#0f110f",
    colorText:            "#0f110f",
    colorTextSecondary:   "#6b7280",
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
    headerSubtitle:              "text-[13px] text-[#6b7280] mt-1",
    logoBox:                     "hidden",
    socialButtonsBlockButton:    "h-11 rounded-xl border border-[#e5e7eb] bg-white text-[#0f110f] text-[13px] font-medium transition hover:bg-[#f9fafb] hover:border-[#d1d5db] shadow-none",
    socialButtonsBlockButtonText:"font-medium text-[#0f110f]",
    socialButtonsIconButton:     "h-11 w-11 rounded-xl border border-[#e5e7eb] bg-white shadow-none hover:bg-[#f9fafb] hover:border-[#d1d5db] transition",
    dividerRow:                  "my-4",
    dividerLine:                 "bg-[#e5e7eb]",
    dividerText:                 "text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[.06em] px-3",
    formFieldLabel:              "text-[11px] font-semibold uppercase tracking-[.08em] text-[#6b7280] mb-1",
    formFieldInput:              "h-11 rounded-xl border border-[#e5e7eb] bg-[#f7f7f7] text-[#0f110f] text-[14px] placeholder-[#9ca3af] focus:border-[#2f8f45] focus:ring-2 focus:ring-[#2f8f45]/15 outline-none transition-all shadow-none",
    formFieldInputShowPasswordButton: "text-[#9ca3af] hover:text-[#6b7280]",
    formButtonPrimary:           "h-11 rounded-xl bg-[#2f8f45] text-white text-[14px] font-semibold hover:bg-[#256f36] active:bg-[#1e5c2c] transition-colors shadow-none mt-1",
    footerActionLink:            "text-[#2f8f45] font-semibold hover:text-[#256f36] transition-colors",
    footerActionText:            "text-[#6b7280]",
    footer:                      "pt-4 mt-1",
    formFieldErrorText:          "text-[12px] text-[#dc2626] mt-1",
    alert:                       "rounded-xl border border-[#fecaca] bg-[#fef2f2] text-[#dc2626] text-[13px] p-3",
    main:                        "gap-4",
    form:                        "gap-3",
  },
};

export default function SignInPage() {
  return (
    <>
      {/* Logo */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
        <Image src="/logo-full.png" alt="GoOutside" width={140} height={40} style={{ objectFit: "contain" }} priority />
      </div>

      {/* ── Organizer CTA — prominent card at top ── */}
      <Link
        href="/sign-up/organizer"
        style={{
          display: "block",
          marginBottom: "20px",
          padding: "16px 20px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, #0d2010 0%, #0a1a0c 100%)",
          border: "1px solid rgba(95,191,42,0.3)",
          textDecoration: "none",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle glow */}
        <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: "rgba(95,191,42,0.12)", filter: "blur(20px)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(95,191,42,0.15)", border: "1px solid rgba(95,191,42,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Buildings size={18} color="#5FBF2A" weight="regular" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#ffffff", lineHeight: 1.3 }}>
                Planning to host events?
              </p>
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
                Create your organizer account — list events, sell tickets, grow your audience.
              </p>
            </div>
          </div>
          <div style={{ marginLeft: "12px", flexShrink: 0 }}>
            <ArrowRight size={16} color="rgba(95,191,42,0.7)" weight="bold" />
          </div>
        </div>
      </Link>

      <SignIn appearance={clerkAppearance} />
    </>
  );
}
