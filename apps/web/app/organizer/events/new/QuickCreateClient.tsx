"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CalendarBlank,
  Check,
  CheckCircle,
  Confetti,
  CurrencyDollar,
  GlobeSimple,
  MinusCircle,
  MonitorPlay,
  Person,
  PlusCircle,
  Question,
  Sparkle,
  Tag,
  Ticket,
  Timer,
  Upload,
  Users,
  Warning,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import { VenueMapPicker, type VenueResult } from "../../../../components/organizer/VenueMapPicker";

type Category = { id: string; name: string; slug: string };

// ─── Date helpers ─────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_OF_WEEK = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// ─── Mini calendar ────────────────────────────────────────────────────────────
function MiniCalendar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const selected = value ? new Date(value + "T12:00:00") : null;
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  function prev() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function next() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }
  function pick(day: number) {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${viewYear}-${m}-${d}`);
  }
  function isSelected(day: number) {
    return selected?.getFullYear() === viewYear && selected?.getMonth() === viewMonth && selected?.getDate() === day;
  }
  function isPast(day: number) {
    return new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  return (
    <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 shadow-[0_4px_20px_rgba(5,12,8,0.12)]">
      <div className="flex items-center justify-between mb-2.5">
        <button type="button" onClick={prev} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition text-base">‹</button>
        <p className="text-[12px] font-bold text-[var(--text-primary)]">{MONTHS[viewMonth]} {viewYear}</p>
        <button type="button" onClick={next} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition text-base">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="text-center text-[9px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const sel = isSelected(day);
          const past = isPast(day);
          return (
            <button
              key={day}
              type="button"
              disabled={past}
              onClick={() => pick(day)}
              className={`flex h-7 w-full items-center justify-center rounded-lg text-[11px] font-medium transition ${
                sel
                  ? "bg-[var(--brand)] text-white font-bold shadow-[0_2px_8px_rgba(47,143,69,0.3)]"
                  : past
                    ? "cursor-not-allowed text-[var(--text-tertiary)] opacity-30"
                    : "text-[var(--text-primary)] hover:bg-[var(--brand)]/10 hover:text-[var(--brand)]"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Hour slots ───────────────────────────────────────────────────────────────
const HOUR_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const ampm = i < 12 ? "AM" : "PM";
  const d = i === 0 ? 12 : i > 12 ? i - 12 : i;
  return { value: i, label: `${d}:00 ${ampm}` };
});

// ─── Time picker ──────────────────────────────────────────────────────────────
function TimePicker({ value, onChange, label }: { value: number; onChange: (h: number) => void; label: string }) {
  const selected = HOUR_SLOTS.find(s => s.value === value) ?? HOUR_SLOTS[19]!;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex w-full items-center gap-2 rounded-2xl border bg-[var(--bg-elevated)] px-3.5 py-3 text-[13px] font-medium text-[var(--text-primary)] transition ${open ? "border-[var(--brand)]/50 ring-2 ring-[var(--brand)]/10" : "border-[var(--border-subtle)] hover:border-[var(--brand)]/30"}`}
      >
        <Timer size={14} className="text-[var(--brand)]" weight="fill" />
        {selected.label}
        <span className="ml-auto text-[10px] text-[var(--text-tertiary)]">▾</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-48 overflow-y-auto overscroll-contain rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_8px_24px_rgba(5,12,8,0.12)]"
          >
            {HOUR_SLOTS.map(slot => (
              <button
                key={slot.value}
                type="button"
                onClick={() => { onChange(slot.value); setOpen(false); }}
                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium transition ${
                  slot.value === value
                    ? "bg-[var(--brand)]/10 text-[var(--brand)] font-bold"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                }`}
              >
                {slot.value === value && <Check size={12} weight="bold" className="text-[var(--brand)]" />}
                {slot.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── AI title suggestions ─────────────────────────────────────────────────────
function AISuggestions({ category, partial, onPick }: { category: string; partial: string; onPick: (s: string) => void }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const doFetch = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const res = await fetch("/api/organizer/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, partial }),
        signal: abortRef.current.signal,
      });
      const data = await res.json() as { suggestions?: string[] };
      setSuggestions(data.suggestions ?? []);
    } catch { /* aborted */ }
    finally { setLoading(false); }
  }, [category, partial]);

  useEffect(() => {
    const t = setTimeout(doFetch, 600);
    return () => clearTimeout(t);
  }, [doFetch]);

  if (!loading && suggestions.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkle size={11} weight="fill" className="text-[var(--brand)]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">AI suggestions</span>
        {loading && <div className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-[var(--brand)] border-t-transparent ml-1" />}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <AnimatePresence>
          {suggestions.map((s, i) => (
            <motion.button
              key={s}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onPick(s)}
              className="rounded-full border border-[var(--brand)]/25 bg-[var(--brand)]/8 px-3 py-1.5 text-[11px] font-medium text-[var(--brand)] transition hover:bg-[var(--brand)]/14 hover:border-[var(--brand)]/40"
            >
              {s}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Event ready ──────────────────────────────────────────────────────────────
function EventReadyScreen({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex min-h-screen flex-col items-center justify-center px-4 py-16"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[var(--brand)]/10"
      >
        <Confetti size={40} weight="fill" className="text-[var(--brand)]" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 text-center">
        <h1 className="text-[1.8rem] font-bold tracking-tight text-[var(--text-primary)]">Your event is ready!</h1>
        <p className="mt-2 max-w-[400px] text-[14px] text-[var(--text-secondary)]">
          <strong>{eventTitle}</strong> has been created as a draft. Complete the details to publish.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="mt-8 w-full max-w-[440px] rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_4px_24px_rgba(5,12,8,0.08)]"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)] mb-3">Complete your event</p>
        {[
          { label: "Add cover image & gallery", href: `/organizer/events/${eventId}/details` },
          { label: "Write your full description", href: `/organizer/events/${eventId}/details` },
          { label: "Configure ticket types & pricing", href: `/organizer/events/${eventId}/tickets` },
          { label: "Review and publish", href: `/organizer/events/${eventId}/publish` },
        ].map((step, i) => (
          <motion.div key={step.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.07 }}>
            <Link href={step.href} className="flex items-center gap-3 rounded-[10px] px-3 py-2 transition hover:bg-[var(--bg-elevated)]">
              <div className="h-3.5 w-3.5 rounded-full border-2 border-[var(--border-subtle)]" />
              <span className="text-[12px] font-medium text-[var(--text-primary)]">{step.label}</span>
              <ArrowRight size={12} className="ml-auto text-[var(--text-tertiary)]" />
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="mt-6 flex flex-col items-center gap-3 sm:flex-row"
      >
        <Link href={`/organizer/events/${eventId}/details`}
          className="flex items-center gap-2 rounded-full bg-[var(--brand)] px-7 py-3 text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(47,143,69,0.28)] transition hover:opacity-90"
        >
          <Sparkle size={16} weight="fill" /> Complete event
        </Link>
        <button
          type="button"
          onClick={() => router.push(`/organizer/events/${eventId}`)}
          className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-7 py-3 text-[14px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        >
          Go to dashboard
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ letter, title, children }: { letter: string; title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_2px_12px_rgba(5,12,8,0.05)]"
    >
      <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[11px] font-bold text-[var(--brand)]">{letter}</span>
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </motion.section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function QuickCreateClient({ categories }: { categories: Category[] }) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [startHour, setStartHour] = useState(19);
  const [endHour, setEndHour] = useState(22);
  const [showCal, setShowCal] = useState(false);
  const [locationType, setLocationType] = useState<"venue" | "online" | "tba">("venue");
  const [venue, setVenue] = useState<VenueResult | null>(null);
  const [onlineLink, setOnlineLink] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  // Cover image
  const [coverUrl, setCoverUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  // Keynote speakers
  const [speakers, setSpeakers] = useState<{ name: string; role: string }[]>([]);

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdEvent, setCreatedEvent] = useState<{ id: string; title: string } | null>(null);

  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setShowCal(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedCategory = categories.find(c => c.id === categoryId);

  async function handleCoverUpload(file: File) {
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/cover", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const { url } = await res.json() as { url: string };
      setCoverUrl(url);
    } catch { /* ignore */ }
    finally { setUploadingCover(false); }
  }

  function addTag(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase().replace(/^#/, "");
      if (t && !tags.includes(t) && tags.length < 10) setTags(prev => [...prev, t]);
      setTagInput("");
    }
  }

  function addSpeaker() { setSpeakers(prev => [...prev, { name: "", role: "" }]); }
  function removeSpeaker(i: number) { setSpeakers(prev => prev.filter((_, j) => j !== i)); }
  function updateSpeaker(i: number, field: "name" | "role", val: string) {
    setSpeakers(prev => prev.map((s, j) => j === i ? { ...s, [field]: val } : s));
  }

  function formatDate(d: string) {
    if (!d) return "";
    const dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("en-GH", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Event name is required"); return; }
    setIsSubmitting(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        categoryId: categoryId || undefined,
        isOnline: locationType === "online",
        customLocation: locationType === "venue"
          ? (venue?.address ?? null)
          : locationType === "tba" ? "To be announced" : null,
        onlineLink: locationType === "online" ? onlineLink || null : null,
        venueLat: venue?.lat ?? null,
        venueLng: venue?.lng ?? null,
        startDatetime: date ? `${date}T${String(startHour).padStart(2,"0")}:00:00` : undefined,
        endDatetime: date ? `${date}T${String(endHour).padStart(2,"0")}:00:00` : undefined,
        timezone: "Africa/Accra",
        bannerUrl: coverUrl || null,
        tags: tags.length ? tags : undefined,
      };
      const res = await fetch("/api/organizer/events/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? "Failed to create event");
      }
      const data = await res.json() as { id: string };

      // Create GA ticket if price/capacity provided
      if (price || isFree || capacity) {
        await fetch("/api/organizer/ticket-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: data.id,
            name: "General Admission",
            price: isFree ? 0 : Number(price) || 0,
            priceType: isFree ? "free" : "paid",
            quantityTotal: capacity ? Number(capacity) : null,
          }),
        });
      }

      setCreatedEvent({ id: data.id, title: title.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (createdEvent) {
    return <EventReadyScreen eventId={createdEvent.id} eventTitle={createdEvent.title} />;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/organizer/events" className="mb-5 inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition">
          <X size={13} weight="bold" /> Discard
        </Link>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--brand)]">Create Event</p>
        <h1 className="mt-1 text-[1.7rem] font-bold tracking-tight text-[var(--text-primary)]">Let&apos;s get started</h1>
        <p className="mt-1.5 text-[13px] text-[var(--text-secondary)]">Fill in the basics and we&apos;ll get you to your event dashboard.</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">

        {/* A — What */}
        <Section letter="A" title="What's the event?">
          {/* Category pills */}
          {categories.length > 0 && (
            <div className="mb-4">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] mb-2">Event type</label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                      categoryId === cat.id
                        ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)] font-semibold"
                        : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--brand)]/30 hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Event name */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] mb-1.5">
              Event name <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              maxLength={120}
              placeholder="e.g. Afrobeats Night Vol. 8"
              type="text"
              value={title}
              onChange={e => { setTitle(e.target.value); setError(""); }}
              className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3.5 text-[15px] font-semibold text-[var(--text-primary)] placeholder:font-normal placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/10 transition"
            />
            <div className="mt-1 flex justify-end">
              <span className="text-[10px] text-[var(--text-tertiary)]">{title.length}/120</span>
            </div>
            {(title.length >= 2 || categoryId) && (
              <AISuggestions
                category={selectedCategory?.name ?? ""}
                partial={title}
                onPick={s => setTitle(s)}
              />
            )}
          </div>

          {/* Public / private */}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`relative flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${isPrivate ? "bg-[var(--brand)]" : "bg-[var(--bg-muted)]"}`}
            >
              <span className={`absolute h-4 w-4 rounded-full bg-white shadow transition-transform ${isPrivate ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
            <div>
              <p className="text-[12px] font-medium text-[var(--text-primary)]">{isPrivate ? "Private event" : "Public event"}</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">{isPrivate ? "Only people with the link can find it" : "Discoverable to everyone on GoOutside"}</p>
            </div>
          </div>
        </Section>

        {/* B — When */}
        <Section letter="B" title="When does it happen?">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Date with custom calendar */}
            <div ref={calRef} className="relative sm:col-span-1">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCal(o => !o)}
                className={`flex w-full items-center gap-2 rounded-2xl border bg-[var(--bg-elevated)] px-3.5 py-3 text-left text-[13px] font-medium transition ${showCal ? "border-[var(--brand)]/50 ring-2 ring-[var(--brand)]/10" : "border-[var(--border-subtle)] hover:border-[var(--brand)]/30"} ${date ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}`}
              >
                <CalendarBlank size={14} className="shrink-0 text-[var(--brand)]" weight="fill" />
                <span className="truncate text-[12px]">{date ? formatDate(date) : "Pick a date"}</span>
              </button>
              <AnimatePresence>
                {showCal && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute left-0 top-full z-50 mt-1.5 w-64"
                  >
                    <MiniCalendar value={date} onChange={d => { setDate(d); setShowCal(false); }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <TimePicker value={startHour} onChange={setStartHour} label="Start time" />
            <TimePicker value={endHour} onChange={setEndHour} label="End time" />
          </div>
        </Section>

        {/* C — Where */}
        <Section letter="C" title="Where is it?">
          <div className="flex gap-2 mb-4">
            {(["venue", "online", "tba"] as const).map(key => {
              const icons = { venue: null, online: <MonitorPlay size={13} />, tba: <Question size={13} /> };
              const labels = { venue: "Venue / Address", online: "Online", tba: "To be announced" };
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLocationType(key)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl border py-2.5 text-[11px] font-semibold transition ${
                    locationType === key
                      ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]"
                      : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--brand)]/25"
                  }`}
                >
                  {icons[key]} <span className="hidden sm:inline">{labels[key]}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {locationType === "venue" && (
              <motion.div key="venue" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <VenueMapPicker
                  value={venue}
                  onChange={setVenue}
                  placeholder="Search venue, street, or Ghana Post address…"
                />
                {!venue && (
                  <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">Supports Ghana Post digital addresses (e.g. GA-XXX-XXXX)</p>
                )}
              </motion.div>
            )}
            {locationType === "online" && (
              <motion.div key="online" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] mb-1.5">Meeting / stream link</label>
                <div className="relative">
                  <GlobeSimple size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                  <input
                    type="url"
                    className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-3 pl-9 pr-4 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none transition"
                    placeholder="https://zoom.us/j/… or YouTube Live URL"
                    value={onlineLink}
                    onChange={e => setOnlineLink(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
            {locationType === "tba" && (
              <motion.div key="tba" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3.5"
              >
                <Warning size={16} className="text-amber-500 shrink-0" weight="fill" />
                <p className="text-[12px] text-[var(--text-secondary)]">Location will be announced later — add it on your event page anytime.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Section>

        {/* D — Cover image */}
        <Section letter="D" title="Cover image">
          <input
            accept="image/*"
            className="hidden"
            ref={coverRef}
            type="file"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }}
          />
          {coverUrl ? (
            <div className="group relative overflow-hidden rounded-[14px]">
              <div className="relative h-48 w-full">
                <Image src={coverUrl} alt="Cover" fill className="object-cover" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 transition group-hover:opacity-100">
                <button type="button" onClick={() => coverRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-2 text-[12px] font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition">
                  <Upload size={12} /> Change
                </button>
                <button type="button" onClick={() => setCoverUrl("")}
                  className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-2 text-[12px] font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition">
                  <X size={12} /> Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={uploadingCover}
              onClick={() => coverRef.current?.click()}
              className="flex h-40 w-full flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-dashed border-[var(--border-subtle)] text-[var(--text-tertiary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)] disabled:opacity-60"
            >
              {uploadingCover
                ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
                : <Upload size={22} weight="thin" />}
              <div className="text-center">
                <p className="text-[12px] font-medium">{uploadingCover ? "Uploading…" : "Upload cover image"}</p>
                <p className="text-[10px] mt-0.5 text-[var(--text-tertiary)]">Recommended: 2000×1000px · JPG or PNG</p>
              </div>
            </button>
          )}
          <p className="mt-2.5 text-[11px] text-[var(--text-tertiary)]">You can add more photos, gallery images, and promo videos in the event details page after creating.</p>
        </Section>

        {/* E — Tickets */}
        <Section letter="E" title="Tickets & capacity">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] mb-1.5">
                <CurrencyDollar size={11} className="inline mr-1" weight="bold" />Ticket price
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[var(--text-tertiary)]">GHS</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={isFree}
                  placeholder={isFree ? "Free" : "0.00"}
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-3 pl-12 pr-4 text-[13px] font-semibold text-[var(--text-primary)] placeholder:font-normal placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none transition disabled:opacity-50"
                />
              </div>
              <button
                type="button"
                onClick={() => { setIsFree(f => !f); if (!isFree) setPrice(""); }}
                className="mt-2.5 flex items-center gap-2 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
              >
                <div className={`relative flex h-4 w-7 items-center rounded-full transition-colors ${isFree ? "bg-[var(--brand)]" : "bg-[var(--bg-muted)]"}`}>
                  <span className={`absolute h-3 w-3 rounded-full bg-white shadow transition-transform ${isFree ? "translate-x-3.5" : "translate-x-0.5"}`} />
                </div>
                Free event
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] mb-1.5">
                <Users size={11} className="inline mr-1" weight="bold" />Capacity
              </label>
              <div className="relative">
                <Ticket size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={capacity}
                  onChange={e => setCapacity(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-3 pl-9 pr-4 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none transition"
                />
              </div>
              <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)]">Leave blank for unlimited</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-[var(--text-tertiary)]">You can add multiple ticket tiers, promo codes, and refund policies in the tickets tab after creating.</p>
        </Section>

        {/* F — Speakers */}
        <Section letter="F" title="Keynote speakers & lineup">
          <p className="mb-3 text-[12px] text-[var(--text-secondary)]">Add performers, speakers, or special guests your attendees will recognize.</p>
          <div className="space-y-2.5">
            <AnimatePresence>
              {speakers.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="group flex gap-2"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]">
                    <Person size={16} weight="fill" />
                  </div>
                  <input
                    className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-[12px] font-semibold text-[var(--text-primary)] placeholder:font-normal placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
                    placeholder="Name (e.g. Stonebwoy)"
                    value={s.name}
                    onChange={e => updateSpeaker(i, "name", e.target.value)}
                  />
                  <input
                    className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
                    placeholder="Role (Headliner, MC, DJ…)"
                    value={s.role}
                    onChange={e => updateSpeaker(i, "role", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeSpeaker(i)}
                    className="mt-1 text-[var(--text-tertiary)] opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                  >
                    <MinusCircle size={16} weight="fill" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {speakers.length < 10 && (
            <button
              type="button"
              onClick={addSpeaker}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-[var(--border-subtle)] py-2.5 text-[12px] font-medium text-[var(--text-tertiary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)]"
            >
              <PlusCircle size={14} /> Add speaker / performer
            </button>
          )}
        </Section>

        {/* G — Tags */}
        <Section letter="G" title="Tags for discoverability">
          <p className="mb-3 text-[12px] text-[var(--text-secondary)]">Tags help people find your event in search. Add up to 10.</p>
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <span key={t} className="flex items-center gap-1.5 rounded-full bg-[var(--brand)]/10 px-3 py-1.5 text-[12px] font-medium text-[var(--brand)]">
                <Tag size={11} weight="fill" />#{t}
                <button type="button" onClick={() => setTags(prev => prev.filter(x => x !== t))} className="hover:text-red-500 transition">
                  <X size={10} weight="bold" />
                </button>
              </span>
            ))}
            {tags.length < 10 && (
              <input
                className="min-w-[150px] rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
                placeholder="Add a tag, press Enter"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
              />
            )}
          </div>
          <p className="mt-2 text-[10px] text-[var(--text-tertiary)]">Press Enter or comma to add · e.g. acoustic, open-air, afrobeats, free-entry</p>
        </Section>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 rounded-2xl bg-red-500/10 px-4 py-3"
          >
            <Warning size={16} className="shrink-0 text-red-500" weight="fill" />
            <p className="text-[13px] text-red-500">{error}</p>
          </motion.div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between gap-4 pt-2 pb-8">
          <Link href="/organizer/events" className="text-[13px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition">
            Cancel
          </Link>
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 rounded-full bg-[var(--brand)] px-8 py-3 text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(47,143,69,0.28)] transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting
              ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : <Sparkle size={16} weight="fill" />}
            {isSubmitting ? "Creating…" : "Create Event"}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
