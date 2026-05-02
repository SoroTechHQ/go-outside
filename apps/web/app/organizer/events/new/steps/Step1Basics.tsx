"use client";

import { useEffect, useRef, useState } from "react";
import { useWizard } from "../WizardContext";

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
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Event title
        </label>
        <input
          ref={titleRef}
          className="mt-2 w-full rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-[15px] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
          maxLength={120}
          placeholder="e.g. Afrobeats Night Vol. 8"
          type="text"
          value={state.title}
          onChange={(e) => setField("title", e.target.value)}
        />
      </div>

      {categories.length > 0 && (
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Category
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`rounded-[14px] border px-3 py-3 text-left text-[13px] font-medium transition ${
                  state.categoryId === cat.id
                    ? "border-[var(--brand)]/40 bg-[var(--brand)]/10 text-[var(--brand)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--brand)]/25 hover:text-[var(--text-primary)]"
                }`}
                type="button"
                onClick={() => setField("categoryId", cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Short description
        </label>
        <textarea
          className="mt-2 w-full resize-none rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-[13px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
          maxLength={200}
          placeholder="One or two sentences that show up on the event card."
          rows={3}
          value={state.shortDescription}
          onChange={(e) => setField("shortDescription", e.target.value)}
        />
        <p className="mt-1 text-right text-[11px] text-[var(--text-tertiary)]">
          {state.shortDescription.length}/200
        </p>
      </div>

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Tags
        </label>
        <div className="mt-2 flex min-h-[48px] flex-wrap items-center gap-2 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2">
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
            className="min-w-[120px] flex-1 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
            placeholder="Type a tag and press Enter"
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
        <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">Press Enter or comma to add a tag</p>
      </div>
    </div>
  );
}
