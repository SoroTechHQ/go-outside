"use client";

import { useState } from "react";

type Tester = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  status: string;
  invited_at: string;
  joined_at: string | null;
  notes: string | null;
  user_id: string | null;
};

type Feedback = {
  id: string;
  type: string;
  rating: number | null;
  message: string | null;
  page_url: string | null;
  created_at: string;
  user_id: string | null;
  screenshot_url: string | null;
};

type FoundingMember = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_founding_member: boolean;
  pulse_points_balance: number;
};

const STATUS_COLOR: Record<string, string> = {
  invited:   "#f59e0b",
  active:    "#2f8f45",
  completed: "#3b82f6",
  churned:   "#9ca3af",
};

const FEEDBACK_EMOJI: Record<string, string> = {
  bug:         "🐛",
  ux:          "🤔",
  feature:     "💡",
  delight:     "❤️",
  pulse_check: "⭐",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GH", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/* ── Invite form ──────────────────────────────────────────────────────── */
function InviteForm({ onInvited }: { onInvited: (t: Tester) => void }) {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [phone,   setPhone]   = useState("");
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMsg(null);

    const res = await fetch("/api/alpha/invite", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), name: name.trim() || null, phone: phone.trim() || null }),
    });

    if (res.ok) {
      setMsg({ ok: true, text: `Invite sent to ${email}` });
      onInvited({
        id: crypto.randomUUID(),
        email: email.trim(),
        name: name.trim() || null,
        phone: phone.trim() || null,
        status: "invited",
        invited_at: new Date().toISOString(),
        joined_at: null,
        notes: null,
        user_id: null,
      });
      setName(""); setEmail(""); setPhone("");
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg({ ok: false, text: d.error ?? "Failed to send invite." });
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#6f6f6f]">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Kofi Mensah"
            className="h-10 w-full rounded-xl border border-[#e5e7eb] bg-[#f7f7f7] px-3 text-[13px] text-[#0f110f] outline-none focus:border-[#2f8f45] focus:ring-2 focus:ring-[#2f8f45]/10"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#6f6f6f]">Email <span className="text-red-500">*</span></label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="kofi@example.com"
            className="h-10 w-full rounded-xl border border-[#e5e7eb] bg-[#f7f7f7] px-3 text-[13px] text-[#0f110f] outline-none focus:border-[#2f8f45] focus:ring-2 focus:ring-[#2f8f45]/10"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#6f6f6f]">Phone</label>
          <input
            type="text"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+233 XX XXX XXXX"
            className="h-10 w-full rounded-xl border border-[#e5e7eb] bg-[#f7f7f7] px-3 text-[13px] text-[#0f110f] outline-none focus:border-[#2f8f45] focus:ring-2 focus:ring-[#2f8f45]/10"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="h-10 rounded-xl bg-[#2f8f45] px-5 text-[13px] font-semibold text-white transition hover:bg-[#256f36] disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send invite + email"}
        </button>
        {msg && (
          <p className={`text-[13px] font-medium ${msg.ok ? "text-[#2f8f45]" : "text-red-500"}`}>
            {msg.text}
          </p>
        )}
      </div>
    </form>
  );
}

/* ── Main client ──────────────────────────────────────────────────────── */
export function AlphaAdminClient({
  testers: initialTesters,
  feedback,
  founding,
}: {
  testers:  Tester[];
  feedback: Feedback[];
  founding: FoundingMember[];
}) {
  const [testers, setTesters] = useState<Tester[]>(initialTesters);
  const [tab,     setTab]     = useState<"testers" | "feedback" | "founding">("testers");

  const invited   = testers.filter(t => t.status === "invited").length;
  const active    = testers.filter(t => t.status === "active").length;

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* Header */}
      <div className="border-b border-black/[0.06] bg-white px-6 py-5">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f110f]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="3" fill="#2f8f45" />
                  <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.5" />
                </svg>
              </span>
              <div>
                <p className="text-[15px] font-bold text-[#0f110f]">Alpha Program</p>
                <p className="text-[11px] text-[#9ca3af]">GoOutside Founding Explorers</p>
              </div>
            </div>
            <a href="/ad-waitlist" className="text-[12px] text-[#9ca3af] hover:text-[#0f110f]">
              ← Waitlist
            </a>
          </div>

          {/* Stats row */}
          <div className="mt-5 grid grid-cols-4 gap-3">
            {[
              { label: "Total invited",      value: testers.length, color: "#0f110f" },
              { label: "Pending sign-up",    value: invited,         color: "#f59e0b" },
              { label: "Active testers",     value: active,          color: "#2f8f45" },
              { label: "Feedback received",  value: feedback.length, color: "#3b82f6" },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-black/[0.06] bg-white px-4 py-3">
                <p className="text-[22px] font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px] text-[#9ca3af]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {/* Invite form */}
        <div className="mb-6 rounded-2xl border border-black/[0.06] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-[#0f110f]">Invite a tester</p>
            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/alpha`;
                navigator.clipboard.writeText(url);
              }}
              className="rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-[11px] font-semibold text-[#2f8f45] transition hover:bg-[#f0fdf4]"
            >
              Copy public sign-up link →
            </button>
          </div>
          <InviteForm onInvited={t => setTesters(prev => [t, ...prev])} />
          <p className="mt-3 text-[11px] text-[#9ca3af]">
            Sends the founder welcome email. When they create their GoOutside account, the Founding Explorer badge + 2× PP is awarded automatically. Share <strong>gooutside.club/alpha</strong> for self-serve sign-ups.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-xl border border-black/[0.06] bg-white p-1 w-fit">
          {(["testers", "feedback", "founding"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-[12px] font-semibold capitalize transition ${
                tab === t ? "bg-[#0f110f] text-white" : "text-[#6f6f6f] hover:text-[#0f110f]"
              }`}
            >
              {t === "testers"  ? `Testers (${testers.length})` :
               t === "feedback" ? `Feedback (${feedback.length})` :
               `Founding (${founding.length})`}
            </button>
          ))}
        </div>

        {/* ── Testers tab ── */}
        {tab === "testers" && (
          <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
            {testers.length === 0 ? (
              <div className="py-16 text-center text-[14px] text-[#9ca3af]">
                No testers invited yet. Use the form above to get started.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/[0.05]">
                    {["Name", "Email", "Phone", "Status", "Invited", "Joined"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-[#9ca3af]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {testers.map((t, i) => (
                    <tr key={t.id} className={`border-b border-black/[0.04] ${i % 2 === 0 ? "" : "bg-[#fafafa]"}`}>
                      <td className="px-4 py-3 text-[13px] font-medium text-[#0f110f]">{t.name ?? "—"}</td>
                      <td className="px-4 py-3 text-[13px] text-[#4a4a4a]">{t.email}</td>
                      <td className="px-4 py-3 text-[12px] text-[#9ca3af]">{t.phone ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase"
                          style={{
                            color: STATUS_COLOR[t.status] ?? "#9ca3af",
                            background: `${STATUS_COLOR[t.status] ?? "#9ca3af"}18`,
                          }}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#9ca3af]">{fmt(t.invited_at)}</td>
                      <td className="px-4 py-3 text-[12px] text-[#9ca3af]">{t.joined_at ? fmt(t.joined_at) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Feedback tab ── */}
        {tab === "feedback" && (
          <div className="space-y-3">
            {feedback.length === 0 ? (
              <div className="rounded-2xl border border-black/[0.06] bg-white py-16 text-center text-[14px] text-[#9ca3af]">
                No feedback submitted yet.
              </div>
            ) : (
              feedback.map(f => (
                <div key={f.id} className="rounded-2xl border border-black/[0.06] bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-xl">{FEEDBACK_EMOJI[f.type] ?? "💬"}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-[#9ca3af]">{f.type.replace("_", " ")}</span>
                          {f.rating && <span className="text-[11px] text-[#f59e0b]">{"⭐".repeat(f.rating)} {f.rating}/5</span>}
                        </div>
                        <p className="text-[14px] text-[#0f110f] leading-relaxed">{f.message ?? "—"}</p>
                        {f.page_url && (
                          <p className="mt-1 text-[11px] text-[#9ca3af]">{f.page_url}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <p className="text-[11px] text-[#9ca3af]">{fmt(f.created_at)}</p>
                      {f.screenshot_url && (
                        <a href={f.screenshot_url} target="_blank" rel="noreferrer"
                          className="rounded-lg border border-black/[0.08] text-[11px] font-medium text-[#2f8f45] px-2 py-1 hover:bg-[#f0fdf4]">
                          View screenshot →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Founding members tab ── */}
        {tab === "founding" && (
          <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
            {founding.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[14px] text-[#9ca3af]">No founding members yet.</p>
                <p className="mt-2 text-[12px] text-[#c0c0c0]">Invite testers above — they become founding members automatically when they sign up.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/[0.05]">
                    {["Name", "Email", "Pulse Points", "Status"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-[#9ca3af]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {founding.map((u, i) => (
                    <tr key={u.id} className={`border-b border-black/[0.04] ${i % 2 === 0 ? "" : "bg-[#fafafa]"}`}>
                      <td className="px-4 py-3 text-[13px] font-medium text-[#0f110f]">{u.first_name} {u.last_name}</td>
                      <td className="px-4 py-3 text-[13px] text-[#4a4a4a]">{u.email}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-[#2f8f45]">{u.pulse_points_balance ?? 0} PP</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[rgba(47,143,69,0.08)] px-2.5 py-0.5 text-[10px] font-bold uppercase text-[#2f8f45]">
                          ⭐ Founding Explorer
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
