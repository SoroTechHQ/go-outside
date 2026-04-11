"use client";

import { useState, useRef, useId } from "react";
import {
  Compass,
  UsersThree,
  Crown,
  EnvelopeSimple,
  User,
  Phone,
  Plus,
  Minus,
  CheckCircle,
  CalendarCheck,
  Ticket,
  HandWaving,
  ArrowRight,
  InstagramLogo,
  TiktokLogo,
  TwitterLogo,
} from "@phosphor-icons/react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "organizer" | "attendee" | "both" | null;

// ─── FAQ data ─────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "What is GoOutside?",
    a: "GoOutside is a social city experience platform built for Ghana. Events are the content, friends are the distribution, and the city is the character. It's not just another event listing app — it's how you find out what people like you are doing this weekend.",
  },
  {
    q: "When does it launch?",
    a: "We're in active development and rolling out early access in Accra first. Waitlist members get priority access and will hear from us before anyone else.",
  },
  {
    q: "How does the social layer work?",
    a: "You connect with friends, see what events they're attending or saving, and get recommendations weighted by your social circle. Think 'your friend Kofi bought tickets to this' — not just generic suggestions.",
  },
  {
    q: "What is a Founding Member?",
    a: "The first 1,000 people to join GoOutside get permanent Founding Member status. Your badge lives on your profile forever, and you earn 2× Pulse points for your first 90 days — meaning faster recommendations, bigger influence, and a head start on the scene.",
  },
  {
    q: "I'm an event organizer — is this for me too?",
    a: "Absolutely. Organizers get a dedicated dashboard to list events, embed TikToks and Reels natively, manage tickets, and tap into GoOutside's social graph to reach exactly the audience who'd love their event.",
  },
  {
    q: "Is it free?",
    a: "Discovery and the social feed are free. Premium features come later — but getting started and exploring Accra's scene will always be accessible.",
  },
];

// ─── Role options ─────────────────────────────────────────────────────────────
const ROLES: { value: Role; label: string; sub: string; Icon: React.ElementType }[] = [
  { value: "attendee", label: "Event Goer", sub: "I want to discover & attend events", Icon: Ticket },
  { value: "organizer", label: "Event Organizer", sub: "I run or promote events", Icon: CalendarCheck },
  { value: "both", label: "Both", sub: "I attend and organize", Icon: HandWaving },
];

// ─── Feature cards ────────────────────────────────────────────────────────────
const FEATURES = [
  {
    Icon: Compass,
    title: "Personalised Feed",
    desc: "Events curated to your vibe, budget, and social circle — not just what's generically trending.",
  },
  {
    Icon: UsersThree,
    title: "Social Layer",
    desc: "See who from your network is going, buying tickets, and rating events. Friends are the algorithm.",
  },
  {
    Icon: Crown,
    title: "Founding Member",
    desc: "First 1,000 users earn a permanent badge + 2× Pulse points for 90 days. The earlier you join, the more you earn.",
  },
];

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen((o) => !o)} className="w-full text-left" aria-expanded={open}>
      <div className="flex items-center justify-between py-4 border-b border-[#ececec]">
        <span className="text-[15px] font-medium text-[#0f110f] pr-6 text-left">{q}</span>
        <span className="shrink-0 w-6 h-6 rounded-full border border-[#d8d8d8] flex items-center justify-center text-[#6f6f6f]">
          {open ? <Minus size={11} weight="bold" /> : <Plus size={11} weight="bold" />}
        </span>
      </div>
      <div
        style={{
          maxHeight: open ? "300px" : "0",
          opacity: open ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 280ms cubic-bezier(0.4,0,0.2,1), opacity 220ms ease",
        }}
      >
        <p className="py-3 pr-8 text-[14px] text-[#6f6f6f] leading-relaxed">{a}</p>
      </div>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>(null);
  const [showExtra, setShowExtra] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const id = useId();

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setEmail(val);
    if (val.length > 0 && !showExtra) {
      setShowExtra(true);
      setTimeout(() => nameRef.current?.focus(), 320);
    }
    if (val.length === 0) {
      setShowExtra(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, phone, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong.");
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div
      style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" }}
      className="min-h-screen bg-white text-[#0f110f]"
    >
      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#ececec]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[#0f110f] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="3" fill="#2f8f45" />
                <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.5" />
              </svg>
            </span>
            <span className="text-[15px] font-semibold tracking-tight">GoOutside</span>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <a href="#overview" className="text-[13px] text-[#6f6f6f] hover:text-[#0f110f] transition-colors">Overview</a>
            <a href="#features" className="text-[13px] text-[#6f6f6f] hover:text-[#0f110f] transition-colors">Features</a>
            <a href="#faq" className="text-[13px] text-[#6f6f6f] hover:text-[#0f110f] transition-colors">FAQ</a>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section id="overview" className="pt-20 pb-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0f9f2] border border-[#c8e8ce] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2f8f45]" />
            <span className="text-[12px] font-medium text-[#2f8f45]">Launching in Accra — join the waitlist</span>
          </div>

          <h1 className="text-[44px] sm:text-[56px] font-bold leading-[1.1] tracking-tight text-[#0f110f] mb-5">
            Your city,<br />
            <span className="text-[#2f8f45]">your scene.</span>
          </h1>

          <p className="text-[17px] text-[#6f6f6f] leading-relaxed max-w-lg mx-auto mb-10">
            GoOutside is the social-first events app built for Ghana. Find out what people like you are doing this weekend — and get there with your friends.
          </p>

          {/* ── Form ──────────────────────────────────────────────────── */}
          {status === "success" ? (
            <div className="inline-flex flex-col items-center gap-3 bg-[#f0f9f2] border border-[#c8e8ce] rounded-2xl px-8 py-7 max-w-sm mx-auto w-full">
              <CheckCircle size={40} weight="fill" className="text-[#2f8f45]" />
              <p className="text-[16px] font-semibold text-[#0f110f]">You're on the list!</p>
              <p className="text-[13px] text-[#6f6f6f]">Check your inbox — we sent you a confirmation.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-sm mx-auto">
              <div className="flex flex-col gap-2.5">

                {/* Email */}
                <div className="relative">
                  <label htmlFor={`${id}-email`} className="sr-only">Email address</label>
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a9a9a9] pointer-events-none">
                    <EnvelopeSimple size={16} />
                  </div>
                  <input
                    id={`${id}-email`}
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Enter your email address"
                    required
                    autoComplete="email"
                    className="w-full h-12 pl-9 pr-4 rounded-xl border border-[#d8d8d8] bg-white text-[14px] text-[#0f110f] placeholder-[#a9a9a9] outline-none focus:border-[#2f8f45] focus:ring-2 focus:ring-[#2f8f45]/10 transition-all"
                  />
                </div>

                {/* Name — animated reveal */}
                <div
                  style={{
                    maxHeight: showExtra ? "60px" : "0",
                    opacity: showExtra ? 1 : 0,
                    overflow: "hidden",
                    transition: "max-height 300ms cubic-bezier(0.4,0,0.2,1), opacity 250ms ease",
                  }}
                >
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a9a9a9] pointer-events-none">
                      <User size={16} />
                    </div>
                    <label htmlFor={`${id}-name`} className="sr-only">Full name</label>
                    <input
                      id={`${id}-name`}
                      ref={nameRef}
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                      className="w-full h-12 pl-9 pr-4 rounded-xl border border-[#d8d8d8] bg-white text-[14px] text-[#0f110f] placeholder-[#a9a9a9] outline-none focus:border-[#2f8f45] focus:ring-2 focus:ring-[#2f8f45]/10 transition-all"
                    />
                  </div>
                </div>

                {/* Phone — animated reveal */}
                <div
                  style={{
                    maxHeight: showExtra ? "60px" : "0",
                    opacity: showExtra ? 1 : 0,
                    overflow: "hidden",
                    transition: "max-height 300ms cubic-bezier(0.4,0,0.2,1) 50ms, opacity 250ms ease 50ms",
                  }}
                >
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a9a9a9] pointer-events-none">
                      <Phone size={16} />
                    </div>
                    <label htmlFor={`${id}-phone`} className="sr-only">Phone number (optional)</label>
                    <input
                      id={`${id}-phone`}
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone number (optional)"
                      autoComplete="tel"
                      className="w-full h-12 pl-9 pr-4 rounded-xl border border-[#d8d8d8] bg-white text-[14px] text-[#0f110f] placeholder-[#a9a9a9] outline-none focus:border-[#2f8f45] focus:ring-2 focus:ring-[#2f8f45]/10 transition-all"
                    />
                  </div>
                </div>

                {/* Role selector — animated reveal */}
                <div
                  style={{
                    maxHeight: showExtra ? "340px" : "0",
                    opacity: showExtra ? 1 : 0,
                    overflow: "hidden",
                    transition: "max-height 320ms cubic-bezier(0.4,0,0.2,1) 100ms, opacity 260ms ease 100ms",
                  }}
                >
                  <div className="pt-1">
                    <p className="text-[12px] font-medium text-[#6f6f6f] mb-2 text-left">I want to use GoOutside as a…</p>
                    <div className="flex flex-col gap-2">
                      {ROLES.map(({ value, label, sub, Icon }) => {
                        const selected = role === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setRole(selected ? null : value)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all"
                            style={{
                              borderColor: selected ? "#2f8f45" : "#d8d8d8",
                              background: selected ? "#f0f9f2" : "#ffffff",
                            }}
                          >
                            <span
                              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                              style={{
                                background: selected ? "rgba(47,143,69,0.12)" : "#f5f5f5",
                                color: selected ? "#2f8f45" : "#6f6f6f",
                              }}
                            >
                              <Icon size={16} weight="duotone" />
                            </span>
                            <span>
                              <span className="block text-[13px] font-semibold text-[#0f110f]">{label}</span>
                              <span className="block text-[11px] text-[#a9a9a9]">{sub}</span>
                            </span>
                            {selected && (
                              <span className="ml-auto">
                                <CheckCircle size={18} weight="fill" className="text-[#2f8f45]" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Error */}
                {status === "error" && (
                  <p className="text-[13px] text-[#e85d8a] text-left">{errorMsg}</p>
                )}

                {/* Submit — always green */}
                <button
                  type="submit"
                  disabled={status === "loading" || !email}
                  className="h-12 rounded-xl bg-[#2f8f45] text-white text-[14px] font-semibold hover:bg-[#256f36] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {status === "loading" ? (
                    "Joining…"
                  ) : (
                    <>
                      Join the Waitlist
                      <ArrowRight size={16} weight="bold" />
                    </>
                  )}
                </button>

                <p className="text-[12px] text-[#a9a9a9] text-center">
                  No spam. We'll reach out when early access opens.
                </p>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ── Founding Member Banner ─────────────────────────────────── */}
      <section className="px-6 pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-[#c8e8ce] bg-[#f0f9f2] px-6 py-5 flex items-start gap-4">
            <Crown size={28} weight="fill" className="text-[#2f8f45] shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-semibold text-[#0f110f] mb-1">Founding Member — first 1,000 spots</p>
              <p className="text-[13px] text-[#4a7a55] leading-relaxed">
                Your badge lives on your profile forever. Earn <strong>2× Pulse points</strong> for your first 90 days on the app — the earlier you join, the bigger your head start on the scene.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6 bg-[#fafafa] border-y border-[#ececec]">
        <div className="max-w-5xl mx-auto">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-[#a9a9a9] text-center mb-3">
            What's inside
          </p>
          <h2 className="text-[28px] sm:text-[32px] font-bold text-center text-[#0f110f] mb-12 tracking-tight">
            Built different. Built for here.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-[#ececec] p-6 hover:border-[#c8e8ce] hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[#f0f9f2] flex items-center justify-center mb-4 text-[#2f8f45]">
                  <Icon size={20} weight="duotone" />
                </div>
                <h3 className="text-[16px] font-semibold text-[#0f110f] mb-2">{title}</h3>
                <p className="text-[14px] text-[#6f6f6f] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="mt-12 grid grid-cols-3 gap-6 border-t border-[#ececec] pt-10">
            {[
              { n: "1,000", label: "Founding Member spots available" },
              { n: "2×", label: "Pulse points for your first 90 days" },
              { n: "1", label: "City first — Accra is the starting line" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[32px] font-bold text-[#2f8f45] leading-none mb-1">{s.n}</p>
                <p className="text-[12px] text-[#6f6f6f]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-[#a9a9a9] text-center mb-3">
            The difference
          </p>
          <h2 className="text-[28px] sm:text-[32px] font-bold text-center text-[#0f110f] mb-10 tracking-tight">
            Not just events. Your city's social graph.
          </h2>
          <div className="space-y-3">
            {[
              { label: "Without GoOutside", text: '"You like Music events — here are Music events"', highlight: false },
              { label: "With GoOutside", text: '"3 of your friends saved this — Kofi just bought tickets"', highlight: true },
              { label: "With GoOutside", text: '"Ama went last month and rated it 5 stars"', highlight: true },
              { label: "With GoOutside", text: '"The people you go out with most are all going to this"', highlight: true },
            ].map((row, i) => (
              <div
                key={i}
                className="flex gap-3 p-4 rounded-xl border"
                style={{
                  borderColor: row.highlight ? "#c8e8ce" : "#ececec",
                  background: row.highlight ? "#f0f9f2" : "#fafafa",
                }}
              >
                <div
                  className="mt-0.5 w-1 rounded-full self-stretch shrink-0"
                  style={{ background: row.highlight ? "#2f8f45" : "#d8d8d8" }}
                />
                <div>
                  <p
                    className="text-[11px] font-semibold uppercase tracking-wide mb-1"
                    style={{ color: row.highlight ? "#2f8f45" : "#a9a9a9" }}
                  >
                    {row.label}
                  </p>
                  <p className="text-[14px] text-[#0f110f] italic">{row.text}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-[#6f6f6f] text-center mt-6">
            The social layer converts people to ticket buyers 3–5× more often. Every major platform that's added friends has seen this.
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-6 bg-[#fafafa] border-t border-[#ececec]">
        <div className="max-w-2xl mx-auto">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-[#a9a9a9] text-center mb-3">
            FAQ
          </p>
          <h2 className="text-[28px] sm:text-[32px] font-bold text-center text-[#0f110f] mb-10 tracking-tight">
            Questions? Answered.
          </h2>
          <div>
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-[#ececec]">
        <div className="max-w-xl mx-auto text-center">
          <Crown size={32} weight="fill" className="text-[#2f8f45] mx-auto mb-4" />
          <h2 className="text-[28px] sm:text-[36px] font-bold text-[#0f110f] mb-3 tracking-tight">
            Accra's scene is waiting for you.
          </h2>
          <p className="text-[15px] text-[#6f6f6f] mb-8">
            Secure your Founding Member spot before they're gone.
          </p>
          <a
            href="#overview"
            className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-[#2f8f45] text-white text-[14px] font-semibold hover:bg-[#256f36] transition-colors"
          >
            Join the Waitlist
            <ArrowRight size={16} weight="bold" />
          </a>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-[#ececec] py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-[#0f110f] flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="5.5" r="2.2" fill="#2f8f45" />
                <circle cx="5.5" cy="5.5" r="4.5" stroke="white" strokeWidth="1" />
              </svg>
            </span>
            <span className="text-[13px] font-semibold">GoOutside</span>
          </div>
          <div className="flex items-center gap-3">
            {[
              { label: "Instagram", Icon: InstagramLogo, href: "https://instagram.com" },
              { label: "X / Twitter", Icon: TwitterLogo, href: "https://twitter.com" },
              { label: "TikTok", Icon: TiktokLogo, href: "https://tiktok.com" },
            ].map(({ label, Icon, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-[#ececec] flex items-center justify-center text-[#a9a9a9] hover:text-[#2f8f45] hover:border-[#c8e8ce] transition-colors"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
          <p className="text-[12px] text-[#a9a9a9]">
            © {new Date().getFullYear()} GoOutside. Built for Ghana.
          </p>
        </div>
      </footer>
    </div>
  );
}
