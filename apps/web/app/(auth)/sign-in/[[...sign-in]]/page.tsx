"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EnvelopeSimple, Lock, ArrowRight } from "@phosphor-icons/react";

// ─── Input field matching waitlist aesthetic ───────────────────────────────
function InputField({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  icon: Icon,
}: {
  label:         string;
  type:          string;
  value:         string;
  onChange:      (v: string) => void;
  placeholder:   string;
  autoComplete?: string;
  icon:          React.ElementType;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label
        style={{
          display:       "block",
          fontSize:      "11px",
          fontWeight:    600,
          textTransform: "uppercase",
          letterSpacing: ".07em",
          color:         "#6f6f6f",
          marginBottom:  "6px",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <div
          style={{
            position:  "absolute",
            left:      "13px",
            top:       "50%",
            transform: "translateY(-50%)",
            color:     focused ? "#2f8f45" : "#a9a9a9",
            pointerEvents: "none",
            transition: "color 150ms",
          }}
        >
          <Icon size={16} />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            display:      "block",
            width:        "100%",
            height:       "48px",
            paddingLeft:  "40px",
            paddingRight: "14px",
            background:   "#ffffff",
            border:       focused
              ? "1.5px solid #2f8f45"
              : "1.5px solid #d8d8d8",
            borderRadius:  "12px",
            color:         "#0f110f",
            fontSize:      "14px",
            outline:       "none",
            boxShadow:     focused ? "0 0 0 3px rgba(47,143,69,0.1)" : "none",
            transition:    "border-color 150ms, box-shadow 150ms",
            boxSizing:     "border-box",
          }}
        />
      </div>
    </div>
  );
}

// ─── Sign-in page ──────────────────────────────────────────────────────────
export default function SignInPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [googleHover, setGoogleHover] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");

    await new Promise((r) => setTimeout(r, 800));

    if (typeof window !== "undefined") {
      localStorage.setItem("demo_user", JSON.stringify({ email, signedIn: true }));
      document.cookie = "demo_signed_in=true; path=/; max-age=604800; SameSite=Lax";
    }
    setLoading(false);
    const params = new URLSearchParams(window.location.search);
    router.push(params.get("redirect") ?? "/");
  }

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
        <span style={{ fontSize: "17px", fontWeight: 700, color: "#0f110f", letterSpacing: "-0.02em" }}>
          GoOutside
        </span>
      </div>

      {/* Heading */}
      <div style={{ marginBottom: "28px", textAlign: "center" }}>
        <h1
          style={{
            fontSize:     "26px",
            fontWeight:   700,
            color:        "#0f110f",
            marginBottom: "6px",
            letterSpacing: "-0.02em",
          }}
        >
          Welcome back
        </h1>
        <p style={{ fontSize: "14px", color: "#6f6f6f" }}>
          Sign in to your account
        </p>
      </div>

      {/* Google button */}
      <button
        onMouseEnter={() => setGoogleHover(true)}
        onMouseLeave={() => setGoogleHover(false)}
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          gap:            "10px",
          width:          "100%",
          height:         "48px",
          borderRadius:   "12px",
          background:     googleHover ? "#fafafa" : "#ffffff",
          border:         `1.5px solid ${googleHover ? "#c8c8c8" : "#d8d8d8"}`,
          color:          "#0f110f",
          fontSize:       "14px",
          fontWeight:     500,
          cursor:         "pointer",
          marginBottom:   "20px",
          transition:     "background 150ms, border-color 150ms",
          boxShadow:      googleHover ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div style={{ flex: 1, height: "1px", background: "#ececec" }} />
        <span style={{ fontSize: "12px", color: "#a9a9a9", fontWeight: 500 }}>or</span>
        <div style={{ flex: 1, height: "1px", background: "#ececec" }} />
      </div>

      {/* Form */}
      <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <InputField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
          icon={EnvelopeSimple}
        />
        <InputField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete="current-password"
          icon={Lock}
        />

        {error && (
          <p style={{ fontSize: "13px", color: "#e85d8a", margin: 0 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            height:        "48px",
            borderRadius:  "12px",
            background:    loading ? "rgba(47,143,69,0.5)" : "#2f8f45",
            color:         "#ffffff",
            fontWeight:    700,
            fontSize:      "14px",
            border:        "none",
            cursor:        loading ? "not-allowed" : "pointer",
            transition:    "background 150ms, transform 100ms",
            marginTop:     "4px",
            display:       "flex",
            alignItems:    "center",
            justifyContent: "center",
            gap:           "8px",
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#256f36"; }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#2f8f45"; }}
        >
          {loading ? "Signing in…" : (
            <>
              Sign In
              <ArrowRight size={16} weight="bold" />
            </>
          )}
        </button>
      </form>

      {/* Forgot password */}
      <p style={{ textAlign: "center", marginTop: "12px", fontSize: "13px" }}>
        <Link
          href="/forgot-password"
          style={{ color: "#6f6f6f", textDecoration: "none", transition: "color 150ms" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#2f8f45")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#6f6f6f")}
        >
          Forgot your password?
        </Link>
      </p>

      {/* Switch to sign-up */}
      <div
        style={{
          marginTop:    "24px",
          paddingTop:   "20px",
          borderTop:    "1px solid #ececec",
          textAlign:    "center",
          fontSize:     "14px",
          color:        "#6f6f6f",
        }}
      >
        No account?{" "}
        <Link
          href="/sign-up"
          style={{ color: "#2f8f45", fontWeight: 600, textDecoration: "none", transition: "color 150ms" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#256f36")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#2f8f45")}
        >
          Sign up free
        </Link>
      </div>
    </div>
  );
}
