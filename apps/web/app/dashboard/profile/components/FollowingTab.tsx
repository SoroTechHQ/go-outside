"use client";

import { useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { SmallAvatar } from "./UserAvatar";

type FollowType = "organizer" | "person";
type Filter = "all" | "organizers" | "people";

type Following = {
  id: string;
  name: string;
  tag: string;
  avatarUrl: string | null;
  type: FollowType;
  tierBadge?: string;
  verified?: boolean;
};

const MOCK_FOLLOWING: Following[] = [
  {
    id: "org-sankofa-sessions",
    name: "Sankofa Sessions",
    tag: "Curated city culture",
    avatarUrl: null,
    type: "organizer",
    verified: true,
  },
  {
    id: "org-build-ghana",
    name: "Build Ghana Collective",
    tag: "Tech & innovation",
    avatarUrl: null,
    type: "organizer",
    verified: true,
  },
  {
    id: "user-esi-badu",
    name: "Esi Badu",
    tag: "@esi.badu",
    avatarUrl: null,
    type: "person",
    tierBadge: "Scene Kid",
  },
  {
    id: "user-nii-ofori",
    name: "Nii Ofori",
    tag: "@nii.ofori",
    avatarUrl: null,
    type: "person",
    tierBadge: "Explorer",
  },
];

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all",        label: "All" },
  { id: "organizers", label: "Organizers" },
  { id: "people",     label: "People" },
];

export function FollowingTab() {
  const [filter,     setFilter]     = useState<Filter>("all");
  const [unfollowed, setUnfollowed] = useState<Set<string>>(new Set());

  const visible = MOCK_FOLLOWING.filter((f) => {
    if (unfollowed.has(f.id)) return false;
    if (filter === "organizers") return f.type === "organizer";
    if (filter === "people")     return f.type === "person";
    return true;
  });

  return (
    <div>
      {/* Filter chips */}
      <div className="mb-4 flex gap-2">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
              filter === id
                ? "bg-[#4a9f63] text-white shadow-sm"
                : "border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-tertiary)] hover:border-[#4a9f63]/40 hover:text-[#4a9f63]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {visible.map((person) => (
          <div
            key={person.id}
            className="flex items-center gap-3 rounded-[14px] border border-[var(--border-card)] bg-[var(--bg-card)] px-3.5 py-3 shadow-[var(--card-shadow)]"
          >
            <SmallAvatar name={person.name} avatarUrl={person.avatarUrl} size={36} />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
                  {person.name}
                </p>
                {person.verified && (
                  <CheckCircle size={13} weight="fill" className="shrink-0 text-[#4a9f63]" />
                )}
              </div>
              <p className="truncate text-[10px] text-[var(--text-tertiary)]">{person.tag}</p>
            </div>

            {/* Badge */}
            {person.tierBadge && (
              <span className="shrink-0 rounded-full border border-[#4a9f63]/25 bg-[#4a9f63]/8 px-2 py-0.5 text-[9px] font-medium text-[#4a9f63]">
                {person.tierBadge}
              </span>
            )}
            {person.type === "organizer" && (
              <span className="shrink-0 rounded-full border border-[#c87c2a]/25 bg-[#c87c2a]/8 px-2 py-0.5 text-[9px] font-medium text-[#c87c2a]">
                Organizer
              </span>
            )}

            <button
              onClick={() => setUnfollowed((prev) => new Set([...prev, person.id]))}
              className="ml-1 shrink-0 rounded-full border border-[var(--border-default)] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)] transition hover:border-red-400/40 hover:text-red-400 active:scale-[0.95]"
            >
              Unfollow
            </button>
          </div>
        ))}

        {visible.length === 0 && (
          <p className="py-12 text-center text-[12px] text-[var(--text-tertiary)]">Nothing here.</p>
        )}
      </div>
    </div>
  );
}
