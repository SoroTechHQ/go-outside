"use client";

import { useState, useRef, useCallback } from "react";

type Role = "admin" | "organizer" | "attendee";

type UserResult = {
  clerk_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  role: Role;
  avatar_url: string | null;
  created_at: string;
};

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  organizer: "Organizer",
  attendee: "Attendee",
};

const ROLE_COLORS: Record<Role, string> = {
  admin: "bg-[rgba(167,139,250,0.15)] text-[var(--accent-violet)] border border-[rgba(167,139,250,0.25)]",
  organizer: "bg-[rgba(56,189,248,0.15)] text-[var(--accent-cyan)] border border-[rgba(56,189,248,0.25)]",
  attendee: "bg-[var(--bg-muted)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]",
};

function Avatar({ user }: { user: UserResult }) {
  const initials = [user.first_name, user.last_name]
    .filter(Boolean)
    .map((n) => n![0])
    .join("")
    .toUpperCase() || user.email[0].toUpperCase();

  return user.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={user.avatar_url}
      alt={initials}
      className="h-9 w-9 rounded-full object-cover shrink-0"
    />
  ) : (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-bold text-[#0e1410]">
      {initials}
    </div>
  );
}

function RoleSelect({
  currentRole,
  clerkId,
  onUpdate,
}: {
  currentRole: Role;
  clerkId: string;
  onUpdate: (clerkId: string, newRole: Role) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Role>(currentRole);

  async function handleChange(newRole: Role) {
    if (newRole === selected) return;
    setLoading(true);
    try {
      const res = await fetch("/api/team/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetClerkId: clerkId, role: newRole }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (json.ok) {
        setSelected(newRole);
        onUpdate(clerkId, newRole);
      } else {
        alert(json.error ?? "Update failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={selected}
      disabled={loading}
      onChange={(e) => handleChange(e.target.value as Role)}
      className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-violet)] disabled:opacity-50 cursor-pointer"
    >
      <option value="attendee">Attendee</option>
      <option value="organizer">Organizer</option>
      <option value="admin">Admin</option>
    </select>
  );
}

export function TeamRoleEditor({ admins }: { admins: UserResult[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [teamList, setTeamList] = useState<UserResult[]>(admins);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/team/role?q=${encodeURIComponent(q)}`);
        const json = await res.json() as { users: UserResult[] };
        setResults(json.users ?? []);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, []);

  function handleRoleUpdate(clerkId: string, newRole: Role) {
    // Update in search results
    setResults((prev) => prev.map((u) => u.clerk_id === clerkId ? { ...u, role: newRole } : u));
    // Update in team list (admins panel)
    if (newRole === "admin") {
      const promoted = results.find((u) => u.clerk_id === clerkId);
      if (promoted && !teamList.find((u) => u.clerk_id === clerkId)) {
        setTeamList((prev) => [...prev, { ...promoted, role: "admin" }]);
      } else {
        setTeamList((prev) => prev.map((u) => u.clerk_id === clerkId ? { ...u, role: newRole } : u));
      }
    } else {
      setTeamList((prev) => prev.filter((u) => u.clerk_id !== clerkId));
    }
  }

  return (
    <div className="space-y-8">
      {/* Search & invite */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
        <h2 className="mb-1 text-base font-semibold text-[var(--text-primary)]">Find a user</h2>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Search by email, username, or name to update their platform role.
        </p>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
            width="16" height="16" fill="none" viewBox="0 0 20 20"
          >
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
            <path d="M15 15l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search users..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-violet)]"
          />
          {searching && (
            <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-[var(--text-tertiary)]" width="16" height="16" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
          )}
        </div>

        {results.length > 0 && (
          <div className="mt-3 divide-y divide-[var(--border-subtle)] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-hidden">
            {results.map((user) => (
              <div key={user.clerk_id} className="flex items-center gap-3 px-4 py-3">
                <Avatar user={user} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {[user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "—"}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] truncate">{user.email}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_COLORS[user.role]}`}>
                  {ROLE_LABELS[user.role]}
                </span>
                <RoleSelect
                  currentRole={user.role}
                  clerkId={user.clerk_id}
                  onUpdate={handleRoleUpdate}
                />
              </div>
            ))}
          </div>
        )}

        {query.length >= 2 && !searching && results.length === 0 && (
          <p className="mt-3 text-center text-sm text-[var(--text-tertiary)]">No users found for &ldquo;{query}&rdquo;</p>
        )}
      </div>

      {/* Current admins */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
        <h2 className="mb-1 text-base font-semibold text-[var(--text-primary)]">Platform admins</h2>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          {teamList.length} {teamList.length === 1 ? "person has" : "people have"} admin access.
        </p>
        {teamList.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)]">No admins found.</p>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {teamList.map((user) => (
              <div key={user.clerk_id} className="flex items-center gap-3 py-3">
                <Avatar user={user} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {[user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "—"}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] truncate">{user.email}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_COLORS[user.role]}`}>
                  {ROLE_LABELS[user.role]}
                </span>
                <RoleSelect
                  currentRole={user.role}
                  clerkId={user.clerk_id}
                  onUpdate={handleRoleUpdate}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
