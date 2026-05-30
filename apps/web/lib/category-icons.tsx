import {
  MicrophoneStage,
  ForkKnife,
  Code,
  PaintBrush,
  SoccerBall,
  Handshake,
  Users,
  Mountains,
  Moon,
  GlobeSimple,
  Ticket,
  Heart,
  Star,
  Camera,
  Books,
  Barbell,
  MusicNote,
  Wine,
  Plant,
  Confetti,
} from "@phosphor-icons/react";
import type { ComponentProps, ReactNode } from "react";

type IconProps = ComponentProps<typeof MusicNote>;

const ICON_MAP: Record<string, (props: IconProps) => ReactNode> = {
  // Music / Entertainment
  music:        (p) => <MicrophoneStage {...p} />,
  "music-arts": (p) => <MicrophoneStage {...p} />,
  entertainment:(p) => <Confetti {...p} />,

  // Food & Drink
  "food-drink": (p) => <ForkKnife {...p} />,
  food:         (p) => <ForkKnife {...p} />,
  drink:        (p) => <Wine {...p} />,

  // Tech
  tech:         (p) => <Code {...p} />,
  technology:   (p) => <Code {...p} />,

  // Arts & Culture
  arts:         (p) => <PaintBrush {...p} />,
  art:          (p) => <PaintBrush {...p} />,
  culture:      (p) => <GlobeSimple {...p} />,
  film:         (p) => <Camera {...p} />,

  // Sports & Fitness
  sports:       (p) => <SoccerBall {...p} />,
  sport:        (p) => <SoccerBall {...p} />,
  fitness:      (p) => <Barbell {...p} />,

  // Networking / Business
  networking:   (p) => <Handshake {...p} />,
  business:     (p) => <Handshake {...p} />,

  // Community / Social
  community:    (p) => <Users {...p} />,
  social:       (p) => <Heart {...p} />,

  // Outdoors / Nature
  outdoors:     (p) => <Mountains {...p} />,
  nature:       (p) => <Plant {...p} />,

  // Nightlife
  nightlife:    (p) => <Moon {...p} />,
  night:        (p) => <Moon {...p} />,

  // Education
  education:    (p) => <Books {...p} />,
  learning:     (p) => <Books {...p} />,

  // Default fallback
  default:      (p) => <Star {...p} />,
  other:        (p) => <Ticket {...p} />,
};

export function CategoryIcon({
  slug,
  iconKey,
  size = 16,
  weight = "bold",
  className,
}: {
  slug?: string;
  iconKey?: string;
  size?: number;
  weight?: IconProps["weight"];
  className?: string;
}) {
  const key = iconKey ?? slug ?? "default";
  const render = ICON_MAP[key] ?? ICON_MAP[slug ?? ""] ?? ICON_MAP.default!;
  return <>{render({ size, weight, className })}</>;
}
