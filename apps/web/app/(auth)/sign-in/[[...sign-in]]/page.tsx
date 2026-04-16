import { SignIn } from "@clerk/nextjs";

// Clerk appearance tokens that match the waitlist's light-mode palette
const appearance = {
  variables: {
    colorPrimary:          "#2f8f45",
    colorBackground:       "#ffffff",
    colorInputBackground:  "#ffffff",
    colorInputText:        "#0f110f",
    colorText:             "#0f110f",
    colorTextSecondary:    "#6f6f6f",
    colorNeutral:          "#0f110f",
    colorDanger:           "#e85d8a",
    borderRadius:          "12px",
    fontFamily:            "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif",
    fontSize:              "14px",
  },
  elements: {
    // Remove Clerk's card wrapper — our layout already provides the card
    card:                 "shadow-none p-0 bg-transparent border-0",
    rootBox:              "w-full",

    // Header
    headerTitle:          "text-[26px] font-bold text-[#0f110f] tracking-tight",
    headerSubtitle:       "text-[14px] text-[#6f6f6f]",
    logoBox:              "hidden",

    // Social buttons
    socialButtonsBlockButton:
      "h-12 rounded-xl border border-[#d8d8d8] bg-white text-[#0f110f] text-[14px] font-medium hover:bg-[#fafafa] hover:border-[#c8c8c8] transition-all shadow-none",
    socialButtonsBlockButtonText: "text-[#0f110f] font-medium",

    // Divider
    dividerLine:          "bg-[#ececec]",
    dividerText:          "text-[#a9a9a9] text-[12px] font-medium",

    // Form labels
    formFieldLabel:
      "text-[11px] font-semibold uppercase tracking-[.07em] text-[#6f6f6f]",

    // Inputs
    formFieldInput:
      "h-12 rounded-xl border-[1.5px] border-[#d8d8d8] bg-white text-[#0f110f] text-[14px] px-3 placeholder-[#a9a9a9] focus:border-[#2f8f45] focus:ring-[3px] focus:ring-[#2f8f45]/10 outline-none transition-all",

    // Primary button
    formButtonPrimary:
      "h-12 rounded-xl bg-[#2f8f45] text-white text-[14px] font-bold hover:bg-[#256f36] transition-colors shadow-none",

    // Footer / nav links
    footerActionLink:     "text-[#2f8f45] font-semibold hover:text-[#256f36] transition-colors",
    footerActionText:     "text-[#6f6f6f]",
    footer:               "border-t border-[#ececec] pt-5 mt-5",

    // Error / alert
    formFieldErrorText:   "text-[13px] text-[#e85d8a]",
    alert:                "rounded-xl border border-[#e85d8a]/20 bg-[#fdf2f6] text-[#e85d8a] text-[13px]",

    // Internal card (Clerk wraps content in a nested card too)
    cardBox:              "shadow-none",
  },
};

export default function SignInPage() {
  return (
    <div>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", marginBottom: "32px" }}>
        <span
          style={{
            width:          "30px",
            height:         "30px",
            borderRadius:   "8px",
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
        <span style={{ fontSize: "17px", fontWeight: 700, color: "#0f110f", letterSpacing: "-0.02em", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" }}>
          GoOutside
        </span>
      </div>

      <SignIn appearance={appearance} />
    </div>
  );
}
