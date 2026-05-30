import {
  ArrowCounterClockwise,
  X,
  IdentificationCard,
  Smiley,
  Camera,
  CameraSlash,
  TShirt,
  DoorOpen,
  IdentificationBadge,
  ClockCountdown,
  ForkKnife,
  Barbell,
  Dog,
  Money,
  Wheelchair,
  PawPrint,
} from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

export type PolicyKey =
  | "cancellation_full"
  | "cancellation_none"
  | "age_18"
  | "age_21"
  | "age_all"
  | "photo_allowed"
  | "photo_banned"
  | "dress_code"
  | "no_reentry"
  | "id_required"
  | "gates_30min"
  | "no_outside_food"
  | "fitness_required"
  | "cash_only"
  | "accessible"
  | "no_pets"
  | "pets_welcome";

export type PolicyDef = {
  key: PolicyKey;
  label: string;
  icon: ReactNode;
  color?: string;
};

export const POLICY_DEFS: PolicyDef[] = [
  { key: "cancellation_full", label: "Full refund 48h before",  icon: <ArrowCounterClockwise size={16} weight="bold" /> },
  { key: "cancellation_none", label: "No refunds",              icon: <X size={16} weight="bold" />,                       color: "text-red-500" },
  { key: "age_18",            label: "18+ only",                icon: <IdentificationCard size={16} weight="bold" /> },
  { key: "age_21",            label: "21+ only",                icon: <IdentificationCard size={16} weight="bold" /> },
  { key: "age_all",           label: "All ages welcome",        icon: <Smiley size={16} weight="bold" />,                   color: "text-emerald-500" },
  { key: "photo_allowed",     label: "Photography allowed",     icon: <Camera size={16} weight="bold" />,                   color: "text-emerald-500" },
  { key: "photo_banned",      label: "No photography",          icon: <CameraSlash size={16} weight="bold" />,              color: "text-red-500" },
  { key: "dress_code",        label: "Dress code enforced",     icon: <TShirt size={16} weight="bold" /> },
  { key: "no_reentry",        label: "No re-entry",             icon: <DoorOpen size={16} weight="bold" />,                 color: "text-amber-500" },
  { key: "id_required",       label: "Valid ID required",       icon: <IdentificationBadge size={16} weight="bold" /> },
  { key: "gates_30min",       label: "Gates open 30 min early", icon: <ClockCountdown size={16} weight="bold" /> },
  { key: "no_outside_food",   label: "No outside food/drinks",  icon: <ForkKnife size={16} weight="bold" /> },
  { key: "fitness_required",  label: "Moderate fitness needed", icon: <Barbell size={16} weight="bold" /> },
  { key: "cash_only",         label: "Cash payments only",      icon: <Money size={16} weight="bold" /> },
  { key: "accessible",        label: "Accessible venue",        icon: <Wheelchair size={16} weight="bold" />,               color: "text-emerald-500" },
  { key: "no_pets",           label: "No pets",                 icon: <PawPrint size={16} weight="bold" />,                 color: "text-red-500" },
  { key: "pets_welcome",      label: "Pets welcome",            icon: <Dog size={16} weight="bold" />,                      color: "text-emerald-500" },
];

export const POLICY_MAP = Object.fromEntries(POLICY_DEFS.map((p) => [p.key, p])) as Record<PolicyKey, PolicyDef>;

export type EventPolicies = {
  standard: PolicyKey[];
  custom: string[];
};
