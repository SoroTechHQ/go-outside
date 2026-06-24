"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowSquareOut,
  CalendarBlank,
  Check,
  ChartBar,
  Circle,
  Eye,
  GearSix,
  ListChecks,
  MapPin,
  Megaphone,
  PencilSimple,
  Ticket,
  UploadSimple,
  UsersThree,
} from "@phosphor-icons/react";

type EventHubEvent = {
  id: string;
  title: string;
  slug: string;
  status: string;
  start_datetime: string | null;
  banner_url: string | null;
};

type StepKey = "details" | "tickets" | "publish";

const STEPS: { key: StepKey; label: string; description: string; icon: typeof Ticket }[] = [
  { key: "details",  label: "Build event page",  description: "Images, description, highlights", icon: PencilSimple },
  { key: "tickets",  label: "Add tickets",        description: "Ticket types, pricing, promos",   icon: Ticket       },
  { key: "publish",  label: "Publish",            description: "Category, tags, visibility",       icon: UploadSimple },
];

const MANAGE_LINKS = [
  { href: "dashboard", label: "Dashboard",      icon: ChartBar   },
  { href: "tickets",   label: "Orders",          icon: ListChecks },
  { href: "marketing", label: "Marketing",       icon: Megaphone  },
  { href: "attendees", label: "Manage Attendees",icon: UsersThree },
];

const SETTINGS_LINKS = [
  { href: "settings",  label: "Order options & settings", icon: GearSix },
];

function formatDate(s: string | null) {
  if (!s) return "No date set";
  return new Date(s).toLocaleDateString("en-GH", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function StepItem({
  step, active, completed, href,
}: {
  step: typeof STEPS[number]; active: boolean; completed: boolean; href: string;
}) {
  const Icon = step.icon;
  return (
    <Link href={href}>
      <div className={`flex items-start gap-3 rounded-[14px] px-3 py-2.5 transition ${active ? "bg-[var(--brand)]/10" : "hover:bg-[var(--bg-muted)]"}`}>
        {/* Step indicator */}
        <div className="relative mt-0.5 shrink-0">
          {completed ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)]"
            >
              <Check size={11} weight="bold" className="text-white" />
            </motion.div>
          ) : active ? (
            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--brand)] bg-[var(--brand)]/10">
              <Icon size={11} weight="fill" className="text-[var(--brand)]" />
            </div>
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--border-subtle)]">
              <Circle size={10} className="text-[var(--text-tertiary)]" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className={`text-[13px] font-semibold leading-snug ${active ? "text-[var(--brand)]" : completed ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
            {step.label}
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-tertiary)]">{step.description}</p>
        </div>
      </div>
    </Link>
  );
}

export function EventEditHub({
  event,
  children,
}: {
  event: EventHubEvent;
  children: ReactNode;
}) {
  const pathname = usePathname();

  function getActiveStep(): StepKey | null {
    if (pathname.includes("/details")) return "details";
    if (pathname.includes("/tickets")) return "tickets";
    if (pathname.includes("/publish")) return "publish";
    return null;
  }

  const activeStep = getActiveStep();

  const hasDescription = false;
  const hasTickets = false;

  const completedSteps: StepKey[] = [
    ...(hasDescription ? ["details" as StepKey] : []),
    ...(hasTickets ? ["tickets" as StepKey] : []),
  ];

  const statusLabel =
    event.status === "published" ? "Live" :
    event.status === "cancelled" ? "Cancelled" : "Draft";

  const statusColor =
    statusLabel === "Live" ? "text-[var(--brand)] bg-[var(--brand)]/10 border-[var(--brand)]/20" :
    statusLabel === "Cancelled" ? "text-red-500 bg-red-500/10 border-red-500/20" :
    "text-amber-500 bg-amber-500/10 border-amber-500/20";

  return (
    <div className="flex h-full">
      {/* Left sidebar */}
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-card)] lg:flex overflow-y-auto">
        <div className="flex flex-col gap-1 p-4">
          {/* Back */}
          <Link
            href="/organizer/events"
            className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"
          >
            <ArrowLeft size={13} weight="bold" />
            Back to events
          </Link>

          {/* Event thumbnail card */}
          <div className="mb-4 overflow-hidden rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
            {event.banner_url ? (
              <div className="relative h-20 w-full">
                <Image src={event.banner_url} alt={event.title} fill className="object-cover" />
              </div>
            ) : (
              <div className="flex h-20 items-center justify-center bg-gradient-to-br from-[var(--brand)]/10 to-[var(--brand)]/5">
                <Ticket size={24} weight="thin" className="text-[var(--brand)]/40" />
              </div>
            )}
            <div className="p-3">
              <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-[var(--text-primary)]">
                {event.title}
              </p>
              <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">
                {formatDate(event.start_datetime)}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColor}`}>
                  {statusLabel}
                </span>
                <Link
                  href={`/events/${event.slug}`}
                  target="_blank"
                  className="ml-auto flex items-center gap-0.5 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--brand)] transition"
                >
                  <Eye size={10} /> Preview
                </Link>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div>
            <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Steps</p>
            <div className="space-y-0.5">
              {STEPS.map((step) => (
                <StepItem
                  key={step.key}
                  step={step}
                  active={activeStep === step.key}
                  completed={completedSteps.includes(step.key)}
                  href={`/organizer/events/${event.id}/${step.key}`}
                />
              ))}
            </div>
          </div>

          <div className="my-3 border-t border-[var(--border-subtle)]" />

          {/* Manage links */}
          <div>
            <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Manage</p>
            <div className="space-y-0.5">
              {MANAGE_LINKS.map((link) => {
                const Icon = link.icon;
                const href = link.href === "marketing" || link.href === "attendees"
                  ? `/organizer/${link.href}`
                  : `/organizer/events/${event.id}/${link.href}`;
                const isActive = pathname.endsWith(`/${link.href}`);
                return (
                  <Link
                    key={link.href}
                    href={href}
                    className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[12px] font-medium transition ${
                      isActive
                        ? "bg-[var(--brand)]/10 text-[var(--brand)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <Icon size={14} weight={isActive ? "fill" : "regular"} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="my-3 border-t border-[var(--border-subtle)]" />

          {/* Settings */}
          <div className="space-y-0.5">
            {SETTINGS_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={`/organizer/events/${event.id}/${link.href}`}
                  className="flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[12px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                >
                  <Icon size={14} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* View event */}
          <div className="mt-4">
            <Link
              href={`/events/${event.slug}`}
              target="_blank"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border-subtle)] py-2.5 text-[12px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand)]/30 hover:text-[var(--brand)]"
            >
              <ArrowSquareOut size={13} />
              View public event
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 lg:hidden">
          <Link href="/organizer/events" className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-secondary)]">
            <ArrowLeft size={15} weight="bold" />
            Events
          </Link>
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">{event.title}</p>
          <Link href={`/events/${event.slug}`} target="_blank" className="text-[var(--text-tertiary)] hover:text-[var(--brand)]">
            <ArrowSquareOut size={16} />
          </Link>
        </div>

        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
