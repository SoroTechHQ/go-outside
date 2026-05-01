import Image from "next/image";
import Link from "next/link";
import Avatar from "boring-avatars";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";

const AVATAR_COLORS = ["#0e2212", "#4a9f63", "#B0E454", "#152a1a", "#EAFFD0"];

type Props = {
  username: string | null;
  name: string;
  avatarUrl: string | null;
  size?: number;
  showVerified?: boolean;
  isVerified?: boolean;
  clickable?: boolean;
  className?: string;
};

export function UserAvatar({
  username,
  name,
  avatarUrl,
  size = 40,
  showVerified = false,
  isVerified = false,
  clickable = true,
  className = "",
}: Props) {
  const avatar = (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      ) : (
        <Avatar size={size} name={name} variant="beam" colors={AVATAR_COLORS} />
      )}
      {showVerified && isVerified && (
        <CheckCircle
          size={Math.max(12, size * 0.3)}
          weight="fill"
          className="absolute bottom-0 right-0 text-[#4a9f63]"
          style={{ background: "var(--bg-base)", borderRadius: "50%" }}
        />
      )}
    </div>
  );

  if (!clickable || !username) return avatar;

  return (
    <Link href={`/${username}`} className="shrink-0">
      {avatar}
    </Link>
  );
}

export function UserAvatarWithName({
  username,
  name,
  avatarUrl,
  size = 36,
  subtitle,
  pulseTier,
  clickable = true,
}: Props & { subtitle?: string; pulseTier?: string }) {
  return (
    <Link
      href={username && clickable ? `/${username}` : "#"}
      className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
    >
      <UserAvatar
        username={username}
        name={name}
        avatarUrl={avatarUrl}
        size={size}
        clickable={false}
      />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{name}</p>
        {subtitle && (
          <p className="truncate text-[11px] text-[var(--text-tertiary)]">{subtitle}</p>
        )}
        {pulseTier && !subtitle && (
          <p className="text-[10px] font-medium text-[#4a9f63]">{pulseTier}</p>
        )}
      </div>
    </Link>
  );
}
