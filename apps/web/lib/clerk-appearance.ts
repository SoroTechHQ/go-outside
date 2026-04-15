// Shared Clerk appearance config — imported by sign-in and sign-up pages
// When Clerk is wired up, import this into both pages

export const clerkAppearance = {
  variables: {
    colorPrimary:         "#5FBF2A",
    colorBackground:      "#0D140D",
    colorInputBackground: "#131A13",
    colorInputText:       "#F5FFF0",
    colorText:            "#F5FFF0",
    colorTextSecondary:   "#6B8C6B",
    colorDanger:          "#E85D8A",
    borderRadius:         "10px",
    fontFamily:           "DM Sans, sans-serif",
    fontSize:             "14px",
  },
  elements: {
    rootBox:              "w-full",
    card:                 "bg-transparent shadow-none border-0 p-0 gap-5",
    headerTitle:          "hidden",
    headerSubtitle:       "hidden",
    socialButtonsBlockButton: [
      "w-full h-11 rounded-full",
      "bg-white/[0.04] border border-[rgba(95,191,42,0.08)]",
      "text-[#6B8C6B] text-sm font-medium",
      "hover:bg-white/[0.07] hover:text-[#F5FFF0]",
      "transition-all duration-150",
    ].join(" "),
    socialButtonsBlockButtonText: "font-medium",
    dividerLine:          "bg-[rgba(95,191,42,0.08)]",
    dividerText:          "text-[#4A6A4A] text-xs",
    formFieldLabel:       "text-[#6B8C6B] text-[10px] font-bold uppercase tracking-widest",
    formFieldInput: [
      "bg-[#131A13] border border-[rgba(95,191,42,0.08)] rounded-[10px]",
      "text-[#F5FFF0] text-sm placeholder:text-[#4A6A4A] h-11",
      "focus:border-[rgba(95,191,42,0.40)]",
      "focus:shadow-[0_0_0_3px_rgba(95,191,42,0.08)]",
      "focus:outline-none transition-all duration-150",
    ].join(" "),
    formButtonPrimary: [
      "h-11 rounded-full bg-[#5FBF2A] text-[#020702] font-bold text-sm",
      "shadow-[0_0_18px_rgba(95,191,42,0.25)]",
      "hover:brightness-[1.08] hover:scale-[1.01]",
      "transition-all duration-150",
    ].join(" "),
    footerActionLink:                  "text-[#5FBF2A] hover:text-[#4DA022] font-medium",
    footerActionText:                  "text-[#6B8C6B]",
    identityPreviewText:               "text-[#F5FFF0]",
    identityPreviewEditButton:         "text-[#5FBF2A]",
    formFieldInputShowPasswordButton:  "text-[#6B8C6B] hover:text-[#F5FFF0]",
    alertText:                         "text-[#E85D8A] text-sm",
    formResendCodeLink:                "text-[#5FBF2A]",
  },
} as const;
