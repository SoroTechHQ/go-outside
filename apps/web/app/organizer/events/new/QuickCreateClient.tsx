"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CalendarBlank,
  Camera,
  CaretDown,
  CaretUp,
  Check,
  CheckCircle,
  Confetti,
  CurrencyDollar,
  GlobeSimple,
  MinusCircle,
  MonitorPlay,
  PencilSimple,
  Person,
  PlusCircle,
  Question,
  Sparkle,
  Tag,
  Ticket,
  Timer,
  Trash,
  Upload,
  Users,
  Warning,
  X,
} from "@phosphor-icons/react";
import { DateTimePicker } from "../../../../components/ui/DateTimePicker";
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
      className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_2px_12px_rgba(5,12,8,0.05)]"
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
  const [isPrivate, setIsPrivate] = useState(false);

  // Ticket tiers
  type QuickTicket = {
    id: string; name: string; price: number; isFree: boolean;
    capacity: string; description: string; saleStartsAt: string; saleEndsAt: string;
  };
  const EMPTY_TICKET: Omit<QuickTicket, "id"> = {
    name: "", price: 0, isFree: false, capacity: "", description: "", saleStartsAt: "", saleEndsAt: "",
  };
  const TICKET_PRESETS: Array<Pick<QuickTicket, "name" | "price" | "isFree" | "description">> = [
    { name: "Free Entry",         price: 0,   isFree: true,  description: "" },
    { name: "General Admission",  price: 50,  isFree: false, description: "" },
    { name: "VIP",                price: 150, isFree: false, description: "Priority entry & exclusive access" },
    { name: "Early Bird",         price: 30,  isFree: false, description: "Limited early bird pricing" },
  ];
  const [tickets, setTickets] = useState<QuickTicket[]>([]);
  const [ticketForm, setTicketForm] = useState<Omit<QuickTicket, "id"> | null>(null);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [ticketAdvanced, setTicketAdvanced] = useState(false);
  const [aiTicketsLoading, setAiTicketsLoading] = useState(false);

  // Cover image
  const [coverUrl, setCoverUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  // Keynote speakers
  const [speakers, setSpeakers] = useState<{ name: string; role: string; photo: string | null }[]>([]);
  const [speakerPhotoUploading, setSpeakerPhotoUploading] = useState<number | null>(null);

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

  function addSpeaker() { setSpeakers(prev => [...prev, { name: "", role: "", photo: null }]); }
  function removeSpeaker(i: number) { setSpeakers(prev => prev.filter((_, j) => j !== i)); }
  function updateSpeaker(i: number, field: "name" | "role" | "photo", val: string | null) {
    setSpeakers(prev => prev.map((s, j) => j === i ? { ...s, [field]: val } : s));
  }
  async function handleSpeakerPhoto(i: number, file: File) {
    setSpeakerPhotoUploading(i);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/cover", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json() as { url: string };
        updateSpeaker(i, "photo", url);
      }
    } catch { /* ignore */ }
    finally { setSpeakerPhotoUploading(null); }
  }

  function openTicketForm(preset?: typeof TICKET_PRESETS[number]) {
    setTicketForm(preset ? { ...EMPTY_TICKET, ...preset } : { ...EMPTY_TICKET });
    setEditingTicketId(null);
    setTicketAdvanced(false);
  }
  function saveTicketForm() {
    if (!ticketForm || !ticketForm.name.trim()) return;
    const t = { ...ticketForm, id: editingTicketId ?? Math.random().toString(36).slice(2) };
    setTickets(prev =>
      editingTicketId
        ? prev.map(x => x.id === editingTicketId ? t : x)
        : [...prev, t]
    );
    setTicketForm(null);
    setEditingTicketId(null);
  }
  function startEditTicket(t: QuickTicket) {
    setTicketForm({ name: t.name, price: t.price, isFree: t.isFree, capacity: t.capacity, description: t.description, saleStartsAt: t.saleStartsAt, saleEndsAt: t.saleEndsAt });
    setEditingTicketId(t.id);
    setTicketAdvanced(!!(t.capacity || t.description || t.saleStartsAt || t.saleEndsAt));
  }
  async function handleAISuggestTickets() {
    if (!title.trim()) return;
    setAiTicketsLoading(true);
    try {
      const catName = categories.find(c => c.id === categoryId)?.name ?? "";
      const res = await fetch("/api/ai/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), category: catName }),
      });
      if (!res.ok) return;
      const { tiers } = await res.json() as { tiers: Array<{ name: string; price: number; description: string }> };
      const newTickets = tiers.map(t => ({
        ...EMPTY_TICKET,
        id: Math.random().toString(36).slice(2),
        name: t.name,
        price: t.price,
        isFree: t.price === 0,
        description: t.description,
      }));
      setTickets(newTickets);
    } catch { /* silently ignore */ }
    finally { setAiTicketsLoading(false); }
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
        ghanaPost: venue?.ghanaPost ?? null,
        isPrivate,
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

      // Create all ticket tiers
      for (const t of tickets) {
        await fetch("/api/organizer/ticket-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: data.id,
            name: t.name,
            description: t.description || undefined,
            price: t.isFree ? 0 : t.price,
            priceType: t.isFree ? "free" : "paid",
            quantityTotal: t.capacity ? Number(t.capacity) : null,
            saleStartsAt: t.saleStartsAt || null,
            saleEndsAt: t.saleEndsAt || null,
          }),
        });
      }

      // Save keynote speakers
      const validSpeakers = speakers.filter(s => s.name.trim());
      if (validSpeakers.length > 0) {
        await fetch(`/api/organizer/events/${data.id}/speakers`, {
          method: "PUT",

          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            speakers: validSpeakers.map(s => ({ name: s.name, role: s.role, photoUrl: s.photo ?? undefined })),
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
              <motion.div key="venue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
              <motion.div key="online" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
        <Section letter="E" title="Tickets & pricing">
          {/* Quick presets + AI row */}
          <div className="mb-4">
            <p className="mb-2.5 text-[11px] font-semibold text-[var(--text-secondary)]">Quick add</p>
            <div className="flex flex-wrap gap-2">
              {TICKET_PRESETS.map(p => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => openTicketForm(p)}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand)]/50 hover:text-[var(--brand)]"
                >
                  <Ticket size={11} />
                  {p.name}
                  <span className="text-[var(--text-tertiary)]">
                    {p.isFree ? "· Free" : `· GHS ${p.price}`}
                  </span>
                </button>
              ))}
              <button
                type="button"
                disabled={!title.trim() || aiTicketsLoading}
                onClick={handleAISuggestTickets}
                className="flex items-center gap-1.5 rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/8 px-3 py-1.5 text-[11px] font-semibold text-[var(--brand)] transition hover:bg-[var(--brand)]/15 disabled:opacity-40"
              >
                {aiTicketsLoading
                  ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
                  : <Sparkle size={11} weight="fill" />}
                {aiTicketsLoading ? "Thinking…" : "AI Suggest"}
              </button>
            </div>
            {!title.trim() && (
              <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)]">Enter an event name above to enable AI suggestions.</p>
            )}
          </div>

          {/* Added ticket tiers */}
          {tickets.length > 0 && (
            <div className="mb-3 space-y-2">
              {tickets.map(t => (
                <div key={t.id} className="flex items-center gap-3 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3">
                  <Ticket size={14} className="shrink-0 text-[var(--brand)]" weight="fill" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">{t.name}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">
                      {t.isFree ? "Free" : `GHS ${t.price.toLocaleString()}`}
                      {t.capacity ? ` · ${Number(t.capacity).toLocaleString()} capacity` : ""}
                    </p>
                  </div>
                  <button type="button" onClick={() => startEditTicket(t)} className="shrink-0 rounded-full p-1.5 text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]">
                    <PencilSimple size={13} />
                  </button>
                  <button type="button" onClick={() => setTickets(prev => prev.filter(x => x.id !== t.id))} className="shrink-0 rounded-full p-1.5 text-[var(--text-tertiary)] transition hover:text-red-400">
                    <Trash size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Ticket form */}
          {ticketForm ? (
            <div className="rounded-[16px] border border-[var(--brand)]/20 bg-[var(--bg-elevated)] p-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--brand)]">
                {editingTicketId ? "Edit tier" : "New ticket tier"}
              </p>

              {/* Name */}
              <input
                className="w-full rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2.5 text-[13px] font-semibold text-[var(--text-primary)] placeholder:font-normal placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
                placeholder="Tier name (e.g. VIP, General Admission)"
                value={ticketForm.name}
                onChange={e => setTicketForm(f => f ? { ...f, name: e.target.value } : f)}
              />

              {/* Price row */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[var(--text-tertiary)]">GHS</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    disabled={ticketForm.isFree}
                    placeholder="0"
                    value={ticketForm.isFree ? "" : ticketForm.price === 0 ? "" : ticketForm.price}
                    onChange={e => setTicketForm(f => f ? { ...f, price: Number(e.target.value) || 0 } : f)}
                    className="w-full rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-card)] py-2.5 pl-11 pr-4 text-[13px] font-semibold text-[var(--text-primary)] placeholder:font-normal placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none disabled:opacity-40"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setTicketForm(f => f ? { ...f, isFree: !f.isFree, price: 0 } : f)}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--border-subtle)] px-3 py-2 text-[11px] font-semibold transition hover:border-[var(--brand)]/40"
                >
                  <div className={`relative flex h-3.5 w-6 items-center rounded-full transition-colors ${ticketForm.isFree ? "bg-[var(--brand)]" : "bg-[var(--bg-muted)]"}`}>
                    <span className={`absolute h-2.5 w-2.5 rounded-full bg-white shadow transition-transform ${ticketForm.isFree ? "translate-x-3" : "translate-x-0.5"}`} />
                  </div>
                  Free
                </button>
              </div>

              {/* Advanced toggle */}
              <button
                type="button"
                onClick={() => setTicketAdvanced(v => !v)}
                className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-tertiary)] transition hover:text-[var(--text-secondary)]"
              >
                {ticketAdvanced ? <CaretUp size={11} /> : <CaretDown size={11} />}
                {ticketAdvanced ? "Hide" : "Show"} capacity, description &amp; sale dates
              </button>

              {ticketAdvanced && (
                <div className="space-y-3 border-t border-[var(--border-subtle)] pt-3">
                  {/* Capacity + Description */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Capacity</label>
                      <input
                        type="number" min="1" placeholder="Unlimited"
                        value={ticketForm.capacity}
                        onChange={e => setTicketForm(f => f ? { ...f, capacity: e.target.value } : f)}
                        className="w-full rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Description</label>
                      <input
                        type="text" maxLength={80} placeholder="e.g. includes open bar"
                        value={ticketForm.description}
                        onChange={e => setTicketForm(f => f ? { ...f, description: e.target.value } : f)}
                        className="w-full rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
                      />
                    </div>
                  </div>
                  {/* Sale dates */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DateTimePicker
                      label="Sale opens"
                      placeholder="When does sale open?"
                      value={ticketForm.saleStartsAt}
                      onChange={v => setTicketForm(f => f ? { ...f, saleStartsAt: v } : f)}
                      showTime
                    />
                    <DateTimePicker
                      label="Sale closes"
                      placeholder="When does sale close?"
                      value={ticketForm.saleEndsAt}
                      onChange={v => setTicketForm(f => f ? { ...f, saleEndsAt: v } : f)}
                      minDate={ticketForm.saleStartsAt || undefined}
                      showTime
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={!ticketForm.name.trim()}
                  onClick={saveTicketForm}
                  className="rounded-full bg-[var(--brand)] px-4 py-2 text-[12px] font-bold text-black transition hover:bg-[#4fa824] disabled:opacity-40"
                >
                  {editingTicketId ? "Save changes" : "Add tier"}
                </button>
                <button
                  type="button"
                  onClick={() => { setTicketForm(null); setEditingTicketId(null); }}
                  className="rounded-full border border-[var(--border-subtle)] px-4 py-2 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openTicketForm()}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-[var(--border-subtle)] py-3.5 text-[12px] font-medium text-[var(--text-tertiary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)]"
            >
              <PlusCircle size={15} /> Add custom tier
            </button>
          )}

          {tickets.length === 0 && !ticketForm && (
            <p className="mt-2 text-center text-[11px] text-[var(--text-tertiary)]">
              Pick a preset above or add a custom tier. You can also add more tiers after creating.
            </p>
          )}
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
                  className="group flex items-center gap-2"
                >
                  {/* Photo upload */}
                  <label className="relative shrink-0 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={e => { const f = e.target.files?.[0]; if (f) void handleSpeakerPhoto(i, f); }}
                    />
                    <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] ring-2 ring-transparent transition hover:ring-[var(--brand)]/40">
                      {speakerPhotoUploading === i ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
                      ) : s.photo ? (
                        <img src={s.photo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Person size={16} weight="fill" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition group-hover:opacity-100">
                        <Camera size={11} className="text-white" />
                      </div>
                    </div>
                    {s.photo && (
                      <button
                        type="button"
                        onClick={e => { e.preventDefault(); updateSpeaker(i, "photo", null); }}
                        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow"
                      >
                        <X size={8} weight="bold" />
                      </button>
                    )}
                  </label>
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
                    className="mt-1 shrink-0 text-[var(--text-tertiary)] opacity-0 transition hover:text-red-500 group-hover:opacity-100"
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
