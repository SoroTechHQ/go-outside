"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Logo mark
function LogoMark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center", marginBottom: "32px" }}>
      <div
        style={{
          width:          "36px",
          height:         "36px",
          borderRadius:   "8px",
          background:     "rgba(95,191,42,0.15)",
          border:         "1px solid rgba(95,191,42,0.2)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontFamily:     "'DM Serif Display', serif",
          fontStyle:      "italic",
          fontSize:       "18px",
          color:          "#5FBF2A",
        }}
      >
        G
      </div>
      <span
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontStyle:  "italic",
          fontSize:   "20px",
          color:      "var(--text-primary, #F5FFF0)",
        }}
      >
        GoOutside
      </span>
    </div>
  );
}

function InputField({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label:        string;
  type:         string;
  value:        string;
  onChange:     (v: string) => void;
  placeholder:  string;
  autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label
        style={{
          display:       "block",
          fontSize:      "10px",
          fontWeight:    700,
          textTransform: "uppercase",
          letterSpacing: ".08em",
          color:         "#6B8C6B",
          marginBottom:  "6px",
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          display:     "block",
          width:       "100%",
          height:      "44px",
          padding:     "0 14px",
          background:  "#131A13",
          border:      focused
            ? "1.5px solid rgba(95,191,42,0.40)"
            : "1.5px solid rgba(95,191,42,0.08)",
          borderRadius: "10px",
          color:        "#F5FFF0",
          fontSize:     "14px",
          outline:      "none",
          boxShadow:    focused ? "0 0 0 3px rgba(95,191,42,0.08)" : "none",
          transition:   "border-color 150ms, box-shadow 150ms",
          boxSizing:    "border-box",
        }}
      />
    </div>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");

    // Demo mode: simulate sign-in
    await new Promise((r) => setTimeout(r, 800));

    // Store demo session in both localStorage and a cookie (for middleware)
    if (typeof window !== "undefined") {
      localStorage.setItem("demo_user", JSON.stringify({ email, signedIn: true }));
      // SameSite=Lax; no HttpOnly so JS can read it in demo mode
      document.cookie = "demo_signed_in=true; path=/; max-age=604800; SameSite=Lax";
    }
    setLoading(false);
    const params = new URLSearchParams(window.location.search);
    router.push(params.get("redirect") ?? "/");
  }

  return (
    <div>
      <LogoMark />

      {/* Heading */}
      <div style={{ marginBottom: "28px", textAlign: "center" }}>
        <h1
          style={{
            fontFamily:   "'DM Serif Display', serif",
            fontStyle:    "italic",
            fontSize:     "28px",
            color:        "var(--text-primary, #F5FFF0)",
            fontWeight:   400,
            marginBottom: "6px",
          }}
        >
          Welcome back
        </h1>
        <p style={{ fontSize: "14px", fontWeight: 300, color: "#6B8C6B" }}>
          Sign in to your account
        </p>
      </div>

      {/* Google button */}
      <button
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          gap:            "10px",
          width:          "100%",
          height:         "44px",
          borderRadius:   "100px",
          background:     "rgba(255,255,255,0.04)",
          border:         "1px solid rgba(95,191,42,0.08)",
          color:          "#6B8C6B",
          fontSize:       "14px",
          fontWeight:     500,
          cursor:         "pointer",
          marginBottom:   "20px",
          transition:     "background 150ms, color 150ms",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.07)";
          e.currentTarget.style.color      = "#F5FFF0";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          e.currentTarget.style.color      = "#6B8C6B";
        }}
      >
        {/* Google G */}
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div
        style={{
          display:    "flex",
          alignItems: "center",
          gap:        "12px",
          marginBottom: "20px",
        }}
      >
        <div style={{ flex: 1, height: "1px", background: "rgba(95,191,42,0.08)" }} />
        <span style={{ fontSize: "12px", color: "#4A6A4A" }}>or</span>
        <div style={{ flex: 1, height: "1px", background: "rgba(95,191,42,0.08)" }} />
      </div>

      {/* Form */}
      <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <InputField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <InputField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete="current-password"
        />

        {error && (
          <p style={{ fontSize: "13px", color: "#E85D8A", margin: 0 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            height:       "44px",
            borderRadius: "100px",
            background:   loading ? "rgba(95,191,42,0.4)" : "#5FBF2A",
            color:        "#020702",
            fontWeight:   700,
            fontSize:     "14px",
            border:       "none",
            cursor:       loading ? "not-allowed" : "pointer",
            boxShadow:    loading ? "none" : "0 0 18px rgba(95,191,42,0.25)",
            transition:   "background 150ms, box-shadow 150ms",
            marginTop:    "4px",
          }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      {/* Footer */}
      <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#6B8C6B" }}>
        No account?{" "}
        <Link href="/sign-up" style={{ color: "#5FBF2A", fontWeight: 500, textDecoration: "none" }}>
          Sign up
        </Link>
      </p>
    </div>
  );
}
