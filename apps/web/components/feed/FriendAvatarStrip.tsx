"use client";

export interface FriendAvatar {
  id:       string;
  initials: string;
  name:     string;
}

interface FriendAvatarStripProps {
  friends:    FriendAvatar[];
  className?: string;
}

const AVATAR_COLORS = [
  "rgba(95, 191, 42, 0.20)",
  "rgba(74, 122, 232, 0.20)",
  "rgba(232, 93, 138, 0.20)",
];

export function FriendAvatarStrip({ friends, className = "" }: FriendAvatarStripProps) {
  if (!friends.length) return null;

  const visible = friends.slice(0, 3);
  const remainder = friends.length - visible.length;
  const label = remainder > 0
    ? `${visible[0]!.name} + ${remainder + visible.length - 1} going`
    : visible.length === 1
    ? `${visible[0]!.name} is going`
    : `${visible[0]!.name} + ${visible.length - 1} going`;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Stacked avatars */}
      <div className="flex">
        {visible.map((f, i) => (
          <div
            key={f.id}
            title={f.name}
            style={{
              width:        "16px",
              height:       "16px",
              borderRadius: "50%",
              background:   AVATAR_COLORS[i % AVATAR_COLORS.length],
              border:       "1.5px solid var(--bg-card)",
              display:      "flex",
              alignItems:   "center",
              justifyContent: "center",
              fontSize:     "7px",
              fontWeight:   600,
              color:        "var(--text-primary)",
              marginLeft:   i === 0 ? 0 : "-4px",
              zIndex:       visible.length - i,
              position:     "relative",
              flexShrink:   0,
            }}
          >
            {f.initials.slice(0, 2).toUpperCase()}
          </div>
        ))}
      </div>

      <span
        style={{
          fontSize:  "10px",
          color:     "rgba(245, 255, 240, 0.35)",
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}
      >
        {label}
      </span>
    </div>
  );
}
