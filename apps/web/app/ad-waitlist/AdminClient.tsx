"use client";

import { useState } from "react";

type Signup = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string | null;
  created_at: string;
  email_sent: boolean;
};

// ─── Password Gate ────────────────────────────────────────────────────────────
export function PasswordGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || "Incorrect password.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#0f110f] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="4" fill="#2f8f45" />
                <circle cx="9" cy="9" r="7.5" stroke="white" strokeWidth="1.5" />
              </svg>
            </span>
            <span className="text-[17px] font-bold tracking-tight text-[#0f110f]">GoOutside</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#ececec] shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="inline-flex w-12 h-12 rounded-xl bg-[#f0f0f0] items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="9" width="14" height="9" rx="2" stroke="#6f6f6f" strokeWidth="1.5" />
                <path d="M7 9V6a3 3 0 016 0v3" stroke="#6f6f6f" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-[18px] font-semibold text-[#0f110f] mb-1">Waitlist Admin</h1>
            <p className="text-[13px] text-[#a9a9a9]">Enter the password to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              autoComplete="current-password"
              className="w-full h-11 px-4 rounded-xl border border-[#d8d8d8] bg-white text-[14px] text-[#0f110f] placeholder-[#a9a9a9] outline-none focus:border-[#2f8f45] focus:ring-2 focus:ring-[#2f8f45]/10 transition-all"
            />
            {error && (
              <p className="text-[13px] text-[#e85d8a]">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full h-11 rounded-xl bg-[#0f110f] text-white text-[14px] font-semibold hover:bg-[#2f2f2f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Checking…" : "Enter"}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-[#a9a9a9] mt-4">
          This page is for internal use only.
        </p>
      </div>
    </div>
  );
}

// ─── Signups Table ────────────────────────────────────────────────────────────
export function SignupsTable({ initialSignups }: { initialSignups: Signup[] }) {
  const [signups, setSignups] = useState<Signup[]>(initialSignups);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [sentToast, setSentToast] = useState<string | null>(null);

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/signups");
      if (res.ok) {
        const data = await res.json();
        setSignups(data.signups);
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSendEmail(id: string) {
    setSendingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setSignups((prev) =>
          prev.map((s) => (s.id === id ? { ...s, email_sent: true } : s))
        );
        const signup = signups.find((s) => s.id === id);
        setSentToast(`Sent to ${signup?.email}`);
        setTimeout(() => setSentToast(null), 3000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send email.");
      }
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.reload();
  }

  function downloadCSV() {
    const headers = ["Name", "Email", "Phone", "Role", "Email Sent", "Signed Up"];
    const rows = signups.map((s) => [
      s.name ?? "",
      s.email,
      s.phone ?? "",
      s.role ?? "",
      s.email_sent ? "yes" : "no",
      formatDate(s.created_at),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gooutside-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const unsentCount = signups.filter((s) => !s.email_sent).length;
  const sentCount = signups.filter((s) => s.email_sent).length;

  return (
    <div
      style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" }}
      className="min-h-screen bg-[#fafafa]"
    >
      {/* Toast */}
      {sentToast && (
        <div className="fixed top-4 right-4 z-50 bg-[#0f110f] text-white text-[13px] font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" fill="#2f8f45" />
            <path d="M4.5 7l2 2 3-3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {sentToast}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-[#ececec] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-[#0f110f] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="3" fill="#2f8f45" />
                  <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.2" />
                </svg>
              </span>
              <span className="text-[14px] font-semibold text-[#0f110f]">GoOutside</span>
            </div>
            <span className="text-[#d8d8d8]">/</span>
            <span className="text-[13px] text-[#6f6f6f] font-medium">Waitlist</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-8 px-3 rounded-lg text-[12px] font-medium text-[#6f6f6f] border border-[#d8d8d8] bg-white hover:bg-[#f7f7f7] disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={refreshing ? "animate-spin" : ""}>
                <path d="M10.5 6a4.5 4.5 0 11-1.3-3.17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M9 2.5l.2 1.8 1.8-.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <button
              onClick={downloadCSV}
              className="h-8 px-3 rounded-lg text-[12px] font-semibold text-white bg-[#0f110f] hover:bg-[#2f2f2f] transition-colors flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v7M3 6l3 3 3-3M1.5 10.5h9" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={handleLogout}
              className="h-8 px-3 rounded-lg text-[12px] font-medium text-[#a9a9a9] hover:text-[#6f6f6f] transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Signups", value: signups.length },
            { label: "Emails Sent", value: sentCount },
            { label: "Emails Unsent", value: unsentCount, highlight: unsentCount > 0 },
            { label: "With Phone", value: signups.filter((s) => s.phone).length },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl border p-5 ${stat.highlight ? "bg-[#fff8f0] border-[#f5d6a8]" : "bg-white border-[#ececec]"}`}
            >
              <p className={`text-[28px] font-bold leading-none mb-1 ${stat.highlight ? "text-[#c97c1a]" : "text-[#0f110f]"}`}>
                {stat.value}
              </p>
              <p className="text-[12px] text-[#a9a9a9]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#ececec] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#ececec] flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-[#0f110f]">
              Signups
              <span className="ml-2 px-2 py-0.5 rounded-md bg-[#f0f0f0] text-[11px] font-medium text-[#6f6f6f]">
                {signups.length}
              </span>
            </h2>
            {unsentCount > 0 && (
              <span className="text-[12px] text-[#c97c1a] font-medium">
                {unsentCount} without confirmation email
              </span>
            )}
          </div>

          {signups.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[14px] text-[#a9a9a9]">No signups yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#ececec] bg-[#fafafa]">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#a9a9a9] uppercase tracking-wide">#</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#a9a9a9] uppercase tracking-wide">Email</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#a9a9a9] uppercase tracking-wide">Name</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#a9a9a9] uppercase tracking-wide">Phone</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#a9a9a9] uppercase tracking-wide">Role</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#a9a9a9] uppercase tracking-wide">Email</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#a9a9a9] uppercase tracking-wide">Signed Up</th>
                  </tr>
                </thead>
                <tbody>
                  {signups.map((s, i) => (
                    <tr
                      key={s.id}
                      className="border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors"
                    >
                      <td className="px-5 py-3.5 text-[#a9a9a9] font-mono text-[11px]">
                        {String(signups.length - i).padStart(3, "0")}
                      </td>
                      <td className="px-5 py-3.5 text-[#0f110f] font-medium">{s.email}</td>
                      <td className="px-5 py-3.5 text-[#6f6f6f]">
                        {s.name ?? <span className="text-[#d8d8d8]">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-[#6f6f6f] font-mono">
                        {s.phone ?? <span className="text-[#d8d8d8] font-sans">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {s.role ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#f0f9f2] text-[#2f8f45] border border-[#c8e8ce] capitalize">
                            {s.role}
                          </span>
                        ) : (
                          <span className="text-[#d8d8d8]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {s.email_sent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#f0f9f2] text-[#2f8f45] border border-[#c8e8ce]">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5l2.5 2.5 3.5-4" stroke="#2f8f45" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Sent
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendEmail(s.id)}
                            disabled={sendingIds.has(s.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#fff8f0] text-[#c97c1a] border border-[#f5d6a8] hover:bg-[#ffefd8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {sendingIds.has(s.id) ? (
                              <>
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="animate-spin">
                                  <circle cx="5" cy="5" r="4" stroke="#c97c1a" strokeWidth="1.3" strokeDasharray="6 6" />
                                </svg>
                                Sending…
                              </>
                            ) : (
                              <>
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                  <path d="M1 1l8 4-8 4V6l5-1-5-1V1z" fill="#c97c1a" />
                                </svg>
                                Send
                              </>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[#a9a9a9] whitespace-nowrap">
                        {formatDate(s.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
