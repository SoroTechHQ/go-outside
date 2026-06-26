"use client";

import { useEffect, useRef, useState } from "react";
import { useWizard } from "../WizardContext";
import { RichTextEditor } from "../RichTextEditor";
import { CategoryIcon } from "../../../../../lib/category-icons";
import { Lock } from "@phosphor-icons/react";

type Category = { id: string; name: string; slug: string };

export function Step1Basics() {
  const { state, setField, dispatch } = useWizard();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagInput, setTagInput] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => {});
  }, []);

  function addTag(raw: string) {
    const trimmed = raw.trim().replace(/^#/, "").toLowerCase();
    if (!trimmed || state.tags.includes(trimmed)) return;
    dispatch({ type: "SET_TAG", tags: [...state.tags, trimmed] });
  }

  function removeTag(tag: string) {
    dispatch({ type: "SET_TAG", tags: state.tags.filter((t) => t !== tag) });
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Event title
        </label>
        <input
          ref={titleRef}
          className="mt-2 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3.5 text-[15px] font-semibold text-[var(--text-primary)] placeholder:font-normal placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/10"
          maxLength={120}
          placeholder="e.g. Afrobeats Night Vol. 8"
          type="text"
          value={state.title}
          onChange={(e) => setField("title", e.target.value)}
        />
        <p className="mt-1.5 text-right text-[11px] text-[var(--text-tertiary)]">{state.title.length}/120</p>
      </div>

      {/* Event type (multi-select, max 3) */}
      {categories.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Event type
            </label>
            <span className="text-[11px] text-[var(--text-tertiary)]">
              {state.categoryIds.length}/3 selected
            </span>
          </div>
          <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">Pick up to 3 — controls where your event appears.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => {
              const isSelected = state.categoryIds.includes(cat.id);
              const isDisabled = !isSelected && state.categoryIds.length >= 3;
              return (
                <button
                  key={cat.id}
                  disabled={isDisabled}
                  className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-left text-[13px] font-medium transition ${
                    isSelected
                      ? "border-[var(--brand)]/40 bg-[var(--brand)]/10 text-[var(--brand)]"
                      : isDisabled
                      ? "cursor-not-allowed border-[var(--border-subtle)] bg-[var(--bg-elevated)] opacity-40"
                      : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--brand)]/25 hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
                  }`}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setField("categoryIds", state.categoryIds.filter((id) => id !== cat.id));
                    } else if (!isDisabled) {
                      setField("categoryIds", [...state.categoryIds, cat.id]);
                    }
                  }}
                >
                  <span className="flex h-6 w-6 items-center justify-center">
                    <CategoryIcon slug={cat.slug} size={16} weight="bold" />
                  </span>
                  <span className="truncate text-[12px]">{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Custom event type */}
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] text-[var(--text-tertiary)]">
              Don&apos;t see your type? Add a custom one:
            </p>
            <input
              className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/10"
              maxLength={40}
              placeholder="e.g. Comedy Night, Fashion Show, Marathon…"
              type="text"
              value={state.customEventType}
              onChange={(e) => setField("customEventType", e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Short description */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Short description
          <span className="ml-1.5 normal-case font-normal tracking-normal text-[var(--text-tertiary)]">shown on event card</span>
        </label>
        <textarea
          className="mt-2 w-full resize-none rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-[13px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/10"
          maxLength={200}
          placeholder="One or two sentences shown on the event card."
          rows={2}
          value={state.shortDescription}
          onChange={(e) => setField("shortDescription", e.target.value)}
        />
        <p className="mt-1 text-right text-[11px] text-[var(--text-tertiary)]">
          {state.shortDescription.length}/200
        </p>
      </div>

      {/* Full description */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Full description
          <span className="ml-1.5 normal-case font-normal tracking-normal text-[var(--text-tertiary)]">shown on event page · supports bold, lists &amp; links</span>
        </label>
        <div className="mt-2">
          <RichTextEditor
            value={state.description}
            onChange={(html) => setField("description", html)}
            placeholder="Tell attendees everything they need to know — what to expect, what to bring, dress code, line-up, schedule…"
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Tags <span className="normal-case font-normal tracking-normal text-[var(--text-tertiary)]">(optional)</span>
        </label>
        <div className="mt-2 flex min-h-[50px] flex-wrap items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2.5">
          {state.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand)]/10 px-2.5 py-1 text-[12px] font-medium text-[var(--brand)]"
            >
              #{tag}
              <button
                className="text-[var(--brand)]/60 hover:text-[var(--brand)]"
                type="button"
                onClick={() => removeTag(tag)}
              >
                ×
              </button>
            </span>
          ))}
          <input
            className="min-w-[140px] flex-1 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
            placeholder="Type a tag and press Enter…"
            type="text"
            value={tagInput}
            onBlur={() => {
              if (tagInput.trim()) {
                addTag(tagInput);
                setTagInput("");
              }
            }}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
          />
        </div>
        <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">Press Enter or comma to add</p>
      </div>

      {/* Age restriction */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Age restriction
        </label>
        <button
          type="button"
          className={`mt-2 flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
            state.isAgeRestricted
              ? "border-amber-500/40 bg-amber-500/8"
              : "border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-default)]"
          }`}
          onClick={() => setField("isAgeRestricted", !state.isAgeRestricted)}
        >
          <div className="flex items-center gap-3">
            <Lock
              size={18}
              weight={state.isAgeRestricted ? "fill" : "regular"}
              className={state.isAgeRestricted ? "text-amber-500" : "text-[var(--text-tertiary)]"}
            />
            <div>
              <p className={`text-[13px] font-semibold ${state.isAgeRestricted ? "text-amber-500" : "text-[var(--text-primary)]"}`}>
                18+ event
              </p>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                Attendees must be 18 or older to purchase tickets
              </p>
            </div>
          </div>
          <div className={`h-5 w-9 rounded-full transition-colors ${state.isAgeRestricted ? "bg-amber-500" : "bg-[var(--border-default)]"}`}>
            <div className={`mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${state.isAgeRestricted ? "translate-x-4.5" : "translate-x-0.5"}`} />
          </div>
        </button>
      </div>
    </div>
  );
}
