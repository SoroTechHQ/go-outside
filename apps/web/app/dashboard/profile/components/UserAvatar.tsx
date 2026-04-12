"use client";

import Image from "next/image";
import Avatar from "boring-avatars";

const AVATAR_COLORS = ["#0e2212", "#4a9f63", "#B0E454", "#152a1a", "#EAFFD0"];

type Props = {
  name: string;
  avatarUrl: string | null;
  /** Pixel size used for the SVG/image. Wrapper can be overridden via wrapperClassName. */
  size: number;
  ringClass?: string;
  className?: string;
};

export function UserAvatar({ name, avatarUrl, size, ringClass = "", className = "" }: Props) {
  const base = `overflow-hidden rounded-full shrink-0 ${ringClass} ${className}`;

  if (avatarUrl) {
    return (
      <div className={base} style={{ width: size, height: size }}>
        <Image src={avatarUrl} alt={name} width={size} height={size} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={base} style={{ width: size, height: size }}>
      <Avatar size={size} name={name} variant="beam" colors={AVATAR_COLORS} />
    </div>
  );
}

/**
 * ProfileAvatar — renders at 80px on mobile, 96px on desktop.
 * Uses two instances hidden/shown via Tailwind so boring-avatars gets the correct numeric size.
 */
export function ProfileAvatar({
  name,
  avatarUrl,
  ringClass = "",
  borderClass = "",
}: {
  name: string;
  avatarUrl: string | null;
  ringClass?: string;
  borderClass?: string;
}) {
  return (
    <>
      <div className="md:hidden">
        <UserAvatar name={name} avatarUrl={avatarUrl} size={80} ringClass={ringClass} className={borderClass} />
      </div>
      <div className="hidden md:block">
        <UserAvatar name={name} avatarUrl={avatarUrl} size={96} ringClass={ringClass} className={borderClass} />
      </div>
    </>
  );
}

export function SmallAvatar({
  name,
  avatarUrl,
  size = 36,
}: {
  name: string;
  avatarUrl: string | null;
  size?: number;
}) {
  return <UserAvatar name={name} avatarUrl={avatarUrl} size={size} />;
}
