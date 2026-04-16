import { SignUp } from "@clerk/nextjs";

// Same appearance tokens as sign-in — unified light-mode palette
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
    card:                 "shadow-none p-0 bg-transparent border-0",
    rootBox:              "w-full",

    headerTitle:          "text-[26px] font-bold text-[#0f110f] tracking-tight",
    headerSubtitle:       "text-[14px] text-[#6f6f6f]",
    logoBox:              "hidden",

    socialButtonsBlockButton:
      "h-12 rounded-xl border border-[#d8d8d8] bg-white text-[#0f110f] text-[14px] font-medium hover:bg-[#fafafa] hover:border-[#c8c8c8] transition-all shadow-none",
    socialButtonsBlockButtonText: "text-[#0f110f] font-medium",

    dividerLine:          "bg-[#ececec]",
    dividerText:          "text-[#a9a9a9] text-[12px] font-medium",

    formFieldLabel:
      "text-[11px] font-semibold uppercase tracking-[.07em] text-[#6f6f6f]",

    formFieldInput:
      "h-12 rounded-xl border-[1.5px] border-[#d8d8d8] bg-white text-[#0f110f] text-[14px] px-3 placeholder-[#a9a9a9] focus:border-[#2f8f45] focus:ring-[3px] focus:ring-[#2f8f45]/10 outline-none transition-all",

    formButtonPrimary:
      "h-12 rounded-xl bg-[#2f8f45] text-white text-[14px] font-bold hover:bg-[#256f36] transition-colors shadow-none",

    footerActionLink:     "text-[#2f8f45] font-semibold hover:text-[#256f36] transition-colors",
    footerActionText:     "text-[#6f6f6f]",
    footer:               "border-t border-[#ececec] pt-5 mt-5",

    formFieldErrorText:   "text-[13px] text-[#e85d8a]",
    alert:                "rounded-xl border border-[#e85d8a]/20 bg-[#fdf2f6] text-[#e85d8a] text-[13px]",

    cardBox:              "shadow-none",
  },
};

export default function SignUpPage() {
  return (
    <div>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", marginBottom: "20px" }}>
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

      {/* Founding member badge */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <div
          style={{
            display:     "inline-flex",
            alignItems:  "center",
            gap:         "6px",
            padding:     "5px 12px",
            borderRadius: "100px",
            background:  "#f0f9f2",
            border:      "1px solid #c8e8ce",
          }}
        >
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2f8f45", display: "inline-block" }} />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#2f8f45", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" }}>
            Founding Member spots open
          </span>
        </div>
      </div>

      <SignUp appearance={appearance} />
    </div>
  );
}
