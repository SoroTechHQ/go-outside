"use client";

type Stat = {
  label: string;
  value: number;
  tabId: string;
};

type Props = {
  eventsAttended: number;
  friendCount: number;
  followingCount: number;
  snippetCount: number;
  onStatClick: (tabId: string) => void;
};

export function StatsRow({
  eventsAttended,
  friendCount,
  followingCount,
  snippetCount,
  onStatClick,
}: Props) {
  const stats: Stat[] = [
    { label: "events",    value: eventsAttended, tabId: "been-there" },
    { label: "friends",   value: friendCount,    tabId: "friends" },
    { label: "following", value: followingCount,  tabId: "following" },
    { label: "snippets",  value: snippetCount,    tabId: "snippets" },
  ];

  return (
    <div className="flex gap-2.5">
      {stats.map((stat) => (
        <button
          key={stat.label}
          onClick={() => onStatClick(stat.tabId)}
          className="flex flex-1 flex-col items-center rounded-[18px] border border-[var(--border-card)] bg-[var(--bg-card)] px-2 py-3 text-center shadow-[var(--card-shadow)] transition hover:border-[#4a9f63]/30 hover:bg-[var(--bg-card-hover)] active:scale-[0.96]"
        >
          <span className="font-display text-xl font-bold italic text-[var(--text-primary)]">
            {stat.value}
          </span>
          <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            {stat.label}
          </span>
        </button>
      ))}
    </div>
  );
}
