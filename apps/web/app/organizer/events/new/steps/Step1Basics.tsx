"use client";

import { useEffect, useRef, useState } from "react";
import { useWizard } from "../WizardContext";
import { CategoryIcon } from "../../../../../lib/category-icons";

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

      {/* Category */}
      {categories.length > 0 && (
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Category
          </label>
          <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">Choose one — this controls where your event appears in the app.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => {
              const isSelected = state.categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-left text-[13px] font-medium transition ${
                    isSelected
                      ? "border-[var(--brand)]/40 bg-[var(--brand)]/10 text-[var(--brand)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--brand)]/25 hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
                  }`}
                  type="button"
                  onClick={() => setField("categoryId", cat.id)}
                >
                  <span className="flex h-6 w-6 items-center justify-center">
                    <CategoryIcon slug={cat.slug} size={16} weight="bold" />
                  </span>
                  <span className="truncate text-[12px]">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Short description */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Short description
        </label>
        <textarea
          className="mt-2 w-full resize-none rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-[13px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/10"
          maxLength={200}
          placeholder="One or two sentences shown on the event card."
          rows={3}
          value={state.shortDescription}
          onChange={(e) => setField("shortDescription", e.target.value)}
        />
        <p className="mt-1 text-right text-[11px] text-[var(--text-tertiary)]">
          {state.shortDescription.length}/200
        </p>
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
    </div>
  );
}
