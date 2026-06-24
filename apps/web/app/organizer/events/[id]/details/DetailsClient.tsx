"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  ImageSquare,
  Info,
  MinusCircle,
  PlusCircle,
  Sparkle,
  Tag,
  TextAa,
  Ticket,
  Upload,
  VideoCamera,
  X,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";

type Highlight = { title: string; description: string };
type FAQ = { question: string; answer: string };

type EventData = {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  banner_url: string | null;
  gallery_urls: string[] | null;
  video_url: string | null;
  tags: string[] | null;
  activities: unknown;
  policies: unknown;
  is_age_restricted: boolean | null;
};

export function DetailsClient({ event }: { event: EventData }) {
  const [description, setDescription] = useState(event.description ?? "");
  const [shortDesc, setShortDesc] = useState(event.short_description ?? "");
  const [tags, setTags] = useState<string[]>(event.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [highlights, setHighlights] = useState<Highlight[]>(() => {
    const a = event.activities as { highlights?: Highlight[] } | null;
    return a?.highlights ?? [];
  });
  const [faqs, setFaqs] = useState<FAQ[]>(() => {
    const a = event.activities as { faqs?: FAQ[] } | null;
    return a?.faqs ?? [];
  });
  const [bannerUrl, setBannerUrl] = useState(event.banner_url ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  async function handleBannerUpload(file: File) {
    setUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("eventId", event.id);
      const res = await fetch("/api/upload/cover", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json() as { url: string };
      setBannerUrl(url);
    } catch {
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploadingBanner(false);
    }
  }

  function addTag(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase().replace(/^#/, "");
      if (t && !tags.includes(t)) setTags([...tags, t]);
      setTagInput("");
    }
  }

  function removeTag(t: string) { setTags(tags.filter((x) => x !== t)); }

  function addHighlight() { setHighlights([...highlights, { title: "", description: "" }]); }
  function removeHighlight(i: number) { setHighlights(highlights.filter((_, j) => j !== i)); }
  function updateHighlight(i: number, field: keyof Highlight, val: string) {
    setHighlights(highlights.map((h, j) => (j === i ? { ...h, [field]: val } : h)));
  }

  function addFaq() { setFaqs([...faqs, { question: "", answer: "" }]); }
  function removeFaq(i: number) { setFaqs(faqs.filter((_, j) => j !== i)); }
  function updateFaq(i: number, field: keyof FAQ, val: string) {
    setFaqs(faqs.map((f, j) => (j === i ? { ...f, [field]: val } : f)));
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");
    try {
      const body = {
        description: description.trim() || null,
        shortDescription: shortDesc.trim() || null,
        bannerUrl: bannerUrl || null,
        tags: tags.length ? tags : null,
        activities: { highlights: highlights.filter((h) => h.title), faqs: faqs.filter((f) => f.question) },
      };
      const res = await fetch(`/api/organizer/events/${event.id}/details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-7 md:px-7 space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Step 1</p>
        <h2 className="mt-0.5 text-[1.5rem] font-bold tracking-tight text-[var(--text-primary)]">Build event page</h2>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          A great event page increases ticket sales. Add photos, a detailed description, and helpful info.
        </p>
      </div>

      {/* Cover image */}
      <section className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden shadow-[0_2px_12px_rgba(5,12,8,0.05)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] px-5 py-4">
          <ImageSquare size={16} weight="fill" className="text-[var(--brand)]" />
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">Cover image</p>
        </div>
        <div className="p-5">
          <input
            accept="image/*"
            className="hidden"
            ref={bannerInputRef}
            type="file"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBannerUpload(f); }}
          />
          {bannerUrl ? (
            <div className="group relative overflow-hidden rounded-[14px]">
              <div className="relative h-52 w-full">
                <Image src={bannerUrl} alt="Cover" fill className="object-cover" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-[12px] font-semibold text-white backdrop-blur-sm hover:bg-white/30"
                >
                  <Upload size={13} /> Change
                </button>
                <button
                  type="button"
                  onClick={() => setBannerUrl("")}
                  className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-[12px] font-semibold text-white backdrop-blur-sm hover:bg-white/30"
                >
                  <X size={13} /> Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={uploadingBanner}
              onClick={() => bannerInputRef.current?.click()}
              className="flex h-44 w-full flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-dashed border-[var(--border-subtle)] text-[var(--text-tertiary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)] disabled:opacity-60"
            >
              {uploadingBanner ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
              ) : (
                <Upload size={24} weight="thin" />
              )}
              <span className="text-[13px] font-medium">{uploadingBanner ? "Uploading…" : "Upload cover image"}</span>
              <span className="text-[11px]">Recommended: 2000×1000px</span>
            </button>
          )}
          <p className="mt-3 flex items-start gap-1.5 text-[11px] text-[var(--text-tertiary)]">
            <Info size={12} className="mt-0.5 shrink-0" />
            This image appears on your event listing and at the top of your event page.
          </p>
        </div>
      </section>

      {/* Description */}
      <section className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden shadow-[0_2px_12px_rgba(5,12,8,0.05)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] px-5 py-4">
          <TextAa size={16} weight="fill" className="text-[var(--brand)]" />
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">Description</p>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              Short summary <span className="ml-1 font-normal text-[var(--text-tertiary)]">(shown on event cards)</span>
            </label>
            <textarea
              className="mt-2 w-full resize-none rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-[13px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/10 transition"
              maxLength={200}
              placeholder="One sentence that captures the essence of your event…"
              rows={2}
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
            />
            <div className="mt-1 flex justify-end">
              <span className="text-[10px] text-[var(--text-tertiary)]">{shortDesc.length}/200</span>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              Full description
            </label>
            <textarea
              className="mt-2 w-full resize-none rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-[13px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/10 transition"
              placeholder="Tell people why they should come. Include the lineup, what to expect, who this is for…"
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="mt-1 flex justify-end">
              <span className="text-[10px] text-[var(--text-tertiary)]">{description.length} chars</span>
            </div>
          </div>
        </div>
      </section>

      {/* Video link */}
      <section className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden shadow-[0_2px_12px_rgba(5,12,8,0.05)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] px-5 py-4">
          <VideoCamera size={16} weight="fill" className="text-[var(--brand)]" />
          <div>
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">Promo video</p>
            <p className="text-[11px] text-[var(--text-tertiary)]">Optional — YouTube or Vimeo link</p>
          </div>
        </div>
        <div className="p-5">
          <input
            className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none transition"
            placeholder="https://youtube.com/watch?v=..."
            type="url"
          />
        </div>
      </section>

      {/* Highlights */}
      <section className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden shadow-[0_2px_12px_rgba(5,12,8,0.05)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] px-5 py-4">
          <Sparkle size={16} weight="fill" className="text-[var(--brand)]" />
          <div>
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">Highlights</p>
            <p className="text-[11px] text-[var(--text-tertiary)]">Feature cards shown on your event page — lineups, artists, activities</p>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <AnimatePresence>
            {highlights.map((h, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="group relative rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 space-y-2.5"
              >
                <button
                  type="button"
                  onClick={() => removeHighlight(i)}
                  className="absolute right-3 top-3 text-[var(--text-tertiary)] opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                >
                  <MinusCircle size={16} weight="fill" />
                </button>
                <input
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-[13px] font-semibold text-[var(--text-primary)] placeholder:font-normal placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
                  placeholder="Title (e.g. Headliner: Stonebwoy)"
                  value={h.title}
                  onChange={(e) => updateHighlight(i, "title", e.target.value)}
                />
                <textarea
                  className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-[12px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
                  placeholder="Short description…"
                  rows={2}
                  value={h.description}
                  onChange={(e) => updateHighlight(i, "description", e.target.value)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {highlights.length < 8 && (
            <button
              type="button"
              onClick={addHighlight}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-[var(--border-subtle)] py-3 text-[12px] font-medium text-[var(--text-tertiary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)]"
            >
              <PlusCircle size={15} /> Add highlight
            </button>
          )}
        </div>
      </section>

      {/* FAQs */}
      <section className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden shadow-[0_2px_12px_rgba(5,12,8,0.05)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] px-5 py-4">
          <Info size={16} weight="fill" className="text-[var(--brand)]" />
          <div>
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">FAQ</p>
            <p className="text-[11px] text-[var(--text-tertiary)]">Answer common questions to reduce support messages</p>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <AnimatePresence>
            {faqs.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="group relative rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 space-y-2.5"
              >
                <button
                  type="button"
                  onClick={() => removeFaq(i)}
                  className="absolute right-3 top-3 text-[var(--text-tertiary)] opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                >
                  <MinusCircle size={16} weight="fill" />
                </button>
                <input
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-[13px] font-semibold text-[var(--text-primary)] placeholder:font-normal placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
                  placeholder="Question e.g. Is there parking?"
                  value={f.question}
                  onChange={(e) => updateFaq(i, "question", e.target.value)}
                />
                <textarea
                  className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-[12px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
                  placeholder="Answer…"
                  rows={2}
                  value={f.answer}
                  onChange={(e) => updateFaq(i, "answer", e.target.value)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {faqs.length < 10 && (
            <button
              type="button"
              onClick={addFaq}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-[var(--border-subtle)] py-3 text-[12px] font-medium text-[var(--text-tertiary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)]"
            >
              <PlusCircle size={15} /> Add FAQ
            </button>
          )}
        </div>
      </section>

      {/* Tags */}
      <section className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden shadow-[0_2px_12px_rgba(5,12,8,0.05)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] px-5 py-4">
          <Tag size={16} weight="fill" className="text-[var(--brand)]" />
          <div>
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">Tags</p>
            <p className="text-[11px] text-[var(--text-tertiary)]">Improve discoverability in search</p>
          </div>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="flex items-center gap-1.5 rounded-full bg-[var(--brand)]/10 px-3 py-1 text-[12px] font-medium text-[var(--brand)]">
                #{t}
                <button type="button" onClick={() => removeTag(t)} className="hover:text-red-500 transition">
                  <X size={11} weight="bold" />
                </button>
              </span>
            ))}
            <input
              className="min-w-[140px] rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
              placeholder="Add a tag, press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
            />
          </div>
          <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">Press Enter or comma to add a tag. Up to 10 tags.</p>
        </div>
      </section>

      {/* Error */}
      {error && (
        <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-[13px] text-red-500">{error}</p>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-5">
        <AnimatePresence>
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-[13px] font-semibold text-[var(--brand)]"
            >
              <CheckCircle size={15} weight="fill" /> Saved
            </motion.span>
          )}
        </AnimatePresence>
        <div className="ml-auto flex items-center gap-3">
          <motion.button
            type="button"
            disabled={isSaving}
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-5 py-2.5 text-[13px] font-semibold text-[var(--text-primary)] transition hover:border-[var(--brand)]/30 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : <Ticket size={14} />}
            Save
          </motion.button>
          <Link
            href={`/organizer/events/${event.id}/tickets`}
            className="flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(47,143,69,0.2)] transition hover:opacity-90"
          >
            Next: Tickets <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  );
}
