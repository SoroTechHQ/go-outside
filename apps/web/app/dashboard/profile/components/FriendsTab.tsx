import { HandWaving } from "@phosphor-icons/react/dist/ssr";
import { SmallAvatar } from "./UserAvatar";

type Friend = {
  id: string;
  name: string;
  avatarUrl: string | null;
  pulseTier: string;
  tierColor: string;
  eventsInCommon: number;
};

type Suggestion = {
  id: string;
  name: string;
  avatarUrl: string | null;
  mutualCount: number;
};

const MOCK_FRIENDS: Friend[] = [
  {
    id: "user-ama-darko",
    name: "Ama Darko",
    avatarUrl: null,
    pulseTier: "Scene Kid",
    tierColor: "#4a9f63",
    eventsInCommon: 4,
  },
  {
    id: "user-kwame-asante",
    name: "Kwame Asante",
    avatarUrl: null,
    pulseTier: "City Native",
    tierColor: "#c87c2a",
    eventsInCommon: 2,
  },
  {
    id: "user-abena-kyei",
    name: "Abena Kyei",
    avatarUrl: null,
    pulseTier: "Explorer",
    tierColor: "#4a9f63",
    eventsInCommon: 1,
  },
];

const MOCK_SUGGESTIONS: Suggestion[] = [
  { id: "user-sug-1", name: "Akua Mensah", avatarUrl: null, mutualCount: 3 },
  { id: "user-sug-2", name: "Koby Appiah", avatarUrl: null, mutualCount: 2 },
];

export function FriendsTab() {
  if (MOCK_FRIENDS.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <HandWaving size={24} className="text-[var(--text-tertiary)]" />
        </div>
        <p className="mt-4 text-[13px] font-medium text-[var(--text-secondary)]">
          No mutual friends yet
        </p>
        <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
          Attend events to find friends on the scene.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Friends list */}
      <div className="space-y-2">
        {MOCK_FRIENDS.map((friend) => (
          <div
            key={friend.id}
            className="flex items-center gap-3 rounded-[14px] border border-[var(--border-card)] bg-[var(--bg-card)] px-3.5 py-3 shadow-[var(--card-shadow)]"
          >
            <SmallAvatar name={friend.name} avatarUrl={friend.avatarUrl} size={38} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
                {friend.name}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                {friend.eventsInCommon} event{friend.eventsInCommon !== 1 ? "s" : ""} in common
              </p>
            </div>

            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold"
              style={{
                color: friend.tierColor,
                backgroundColor: `${friend.tierColor}14`,
                border: `1px solid ${friend.tierColor}28`,
              }}
            >
              {friend.pulseTier}
            </span>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      {MOCK_SUGGESTIONS.length > 0 && (
        <div>
          <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            People you might know
          </p>
          <div className="space-y-2">
            {MOCK_SUGGESTIONS.map((sug) => (
              <div
                key={sug.id}
                className="flex items-center gap-3 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-3"
              >
                <SmallAvatar name={sug.name} avatarUrl={sug.avatarUrl} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">
                    {sug.name}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    {sug.mutualCount} mutual friend{sug.mutualCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <button className="shrink-0 rounded-full border border-[#4a9f63]/30 bg-[#4a9f63]/10 px-3 py-1 text-[10px] font-bold text-[#4a9f63] transition hover:bg-[#4a9f63]/20 active:scale-[0.95]">
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
