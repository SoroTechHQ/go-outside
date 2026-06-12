import { naviiAvatarUrl } from "../../lib/navii-avatar";

type NaviiAvatarProps = {
  seed: string | null | undefined;
  title?: string;
  size: number;
  className?: string;
};

export function NaviiAvatar({ seed, title = "Profile avatar", size, className = "" }: NaviiAvatarProps) {
  return (
    <img
      alt={title}
      className={className}
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
      src={naviiAvatarUrl(seed, size)}
      width={size}
    />
  );
}
