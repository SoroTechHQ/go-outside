"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkle,
  PaperPlaneTilt,
  CaretDown,
  CalendarBlank,
  MapPin,
  ArrowRight,
} from "@phosphor-icons/react";
import { thumbnailUrl } from "../../lib/image-url";
import type { AssistantResponse } from "../../lib/ai-assistant";

const QUICK_PROMPTS = [
  "Something free and chill tonight",
  "Live music in Osu this weekend",
  "Best networking event this week",
  "Date night with good drinks",
];

export function WeekendAssistant() {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<AssistantResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function ask(message: string) {
    if (!message.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res  = await fetch("/api/ai/weekend", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message }),
      });
      const data = await res.json() as AssistantResponse;
      setResult(data);
    } catch {
      setResult({
        intro: "Couldn't load suggestions right now.",
        summary: "Try again in a moment and I will pull matching live events from the site.",
        followUps: [],
        picks: [],
        totalMatches: 0,
        searchHref: null,
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void ask(input);
    setInput("");
  }

  return (
    <div className="rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 transition hover:bg-[var(--bg-muted)]"
        type="button"
      >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)]/15">
              <Sparkle size={16} weight="fill" className="text-[var(--brand)]" />
            </div>
            <div className="text-left">
              <p className="text-[13px] font-bold text-[var(--text-primary)]">Event Assistant</p>
              <p className="text-[11px] text-[var(--text-tertiary)]">Ask for live plans, vibes, and event picks</p>
            </div>
          </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <CaretDown size={15} className="text-[var(--text-tertiary)]" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="border-t border-[var(--border-subtle)] px-5 pb-5 pt-4">
              {/* Quick prompts */}
              {!result && !loading && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => void ask(p)}
                      className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand)]/30 hover:text-[var(--brand)] active:scale-95"
                      type="button"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g. Rooftop vibes in East Legon on Friday…"
                  className="flex-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-4 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition focus:border-[var(--brand)]/40 focus:ring-2 focus:ring-[var(--brand)]/15"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white shadow-[0_4px_12px_rgba(95,191,42,0.3)] transition hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:shadow-none"
                >
                  <PaperPlaneTilt size={16} weight="fill" />
                </button>
              </form>

              {/* Loading */}
              {loading && (
                <div className="mt-5 flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full border-2 border-[var(--brand)] border-t-transparent animate-spin" />
                  <span className="text-[13px] text-[var(--text-tertiary)]">Pulling the strongest live matches from the site…</span>
                </div>
              )}

              {/* Results */}
              {result && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className="mt-4 space-y-3"
                >
                  <div className="space-y-1">
                    <p className="text-[13px] text-[var(--text-secondary)]">{result.intro}</p>
                    <p className="text-[12px] text-[var(--text-tertiary)]">{result.summary}</p>
                    {result.totalMatches > 0 && (
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                        {result.totalMatches} live match{result.totalMatches === 1 ? "" : "es"}
                      </p>
                    )}
                  </div>

                  {result.picks.length === 0 && (
                    <p className="text-[13px] text-[var(--text-tertiary)]">No events found. Try a different search.</p>
                  )}

                  {result.picks.map((pick, i) => (
                    <motion.div
                      key={pick.event_id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      {pick.event ? (
                        <Link
                          href={`/events/${pick.event.slug}`}
                          className="group flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-3 transition hover:border-[var(--brand)]/30 hover:bg-[var(--bg-card-hover)]"
                        >
                          {pick.event.banner_url && (
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                              <Image
                                src={thumbnailUrl(pick.event.banner_url) ?? pick.event.banner_url}
                                alt={pick.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{pick.title}</p>
                            <p className="mt-0.5 text-[11px] text-[var(--text-secondary)] line-clamp-2">{pick.reason}</p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[var(--text-tertiary)]">
                              {pick.event.start_datetime && (
                                <span className="flex items-center gap-1">
                                  <CalendarBlank size={10} />
                                  {new Date(pick.event.start_datetime).toLocaleDateString("en-GH", {
                                    weekday: "short", month: "short", day: "numeric",
                                  })}
                                </span>
                              )}
                              {pick.event.venue_name && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={10} />
                                  {pick.event.venue_name}
                                </span>
                              )}
                              <span>{pick.event.price_label}</span>
                            </div>
                          </div>
                          <ArrowRight size={14} className="shrink-0 text-[var(--text-tertiary)] transition group-hover:text-[var(--brand)] group-hover:translate-x-0.5" />
                        </Link>
                      ) : (
                        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-3">
                          <p className="text-[13px] font-semibold text-[var(--text-primary)]">{pick.title}</p>
                          <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{pick.reason}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {result.followUps.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {result.followUps.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => void ask(prompt)}
                          className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand)]/30 hover:text-[var(--brand)] active:scale-95"
                          type="button"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}

                  {result.searchHref && result.picks.length > 0 && (
                    <Link
                      href={result.searchHref}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--brand)] transition hover:opacity-70"
                    >
                      See all matching events
                      <ArrowRight size={12} />
                    </Link>
                  )}

                  <button
                    onClick={() => { setResult(null); inputRef.current?.focus(); }}
                    className="text-[12px] font-semibold text-[var(--brand)] transition hover:opacity-70"
                    type="button"
                  >
                    Ask something else
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
