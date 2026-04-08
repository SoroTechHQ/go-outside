"use client";

import type { ComponentType } from "react";
import {
  Bank,
  Bell,
  Basketball,
  BookmarkSimple,
  Buildings,
  CalendarDots,
  ChartLine,
  CheckCircle,
  Cpu,
  Devices,
  ForkKnife,
  Gauge,
  Handshake,
  House,
  MegaphoneSimple,
  MusicNotesSimple,
  Palette,
  PaintBrush,
  PlusCircle,
  SoccerBall,
  Sparkle,
  SquaresFour,
  Tag,
  Ticket,
  User,
  Users,
  Wallet,
  WarningCircle,
  type IconProps,
} from "@phosphor-icons/react";

const icons = {
  bank: Bank,
  bell: Bell,
  basketball: Basketball,
  bookmark: BookmarkSimple,
  buildings: Buildings,
  calendar: CalendarDots,
  "chart-line": ChartLine,
  "check-circle": CheckCircle,
  cpu: Cpu,
  devices: Devices,
  "fork-knife": ForkKnife,
  gauge: Gauge,
  handshake: Handshake,
  house: House,
  "megaphone": MegaphoneSimple,
  "music-notes": MusicNotesSimple,
  palette: Palette,
  "paint-brush": PaintBrush,
  "plus-circle": PlusCircle,
  "soccer-ball": SoccerBall,
  sparkle: Sparkle,
  "squares-four": SquaresFour,
  tag: Tag,
  ticket: Ticket,
  user: User,
  users: Users,
  "wallet": Wallet,
  "warning-circle": WarningCircle,
} satisfies Record<string, ComponentType<IconProps>>;

export function AppIcon({
  name,
  className,
  size = 20,
  weight = "regular",
}: {
  name: string;
  className?: string;
  size?: number;
  weight?: IconProps["weight"];
}) {
  const Icon = icons[name as keyof typeof icons] ?? Sparkle;
  return <Icon className={className} size={size} weight={weight} />;
}
