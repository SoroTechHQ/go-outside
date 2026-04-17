import { SignUp } from "@clerk/nextjs";

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

export default function SignUpPage() {
  return (
    <>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "9px", justifyContent: "center", marginBottom: "20px" }}>
        <span
          style={{
            width: "32px", height: "32px", borderRadius: "9px",
            background: "#0f110f",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="3" fill="#2f8f45" />
            <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.5" />
          </svg>
        </span>
        <span style={{ fontSize: "18px", fontWeight: 800, color: "#0f110f", letterSpacing: "-0.03em" }}>
          GoOutside
        </span>
      </div>

      {/* Founding member badge */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: "7px",
            padding: "5px 14px", borderRadius: "100px",
            background: "#f0fdf4", border: "1px solid #bbf7d0",
          }}
        >
          <span
            style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: "#2f8f45", display: "inline-block",
              boxShadow: "0 0 5px rgba(47,143,69,0.6)",
            }}
          />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#166534" }}>
            Founding Member spots open
          </span>
        </div>
      </div>

      <SignUp appearance={clerkAppearance} forceRedirectUrl="/onboarding/profile" />
    </>
  );
}
