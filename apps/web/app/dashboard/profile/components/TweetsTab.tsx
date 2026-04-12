"use client";

import { XLogo, ArrowRight } from "@phosphor-icons/react";

type Props = {
  tweetIds: string[];
};

export function TweetsTab({ tweetIds }: Props) {
  if (tweetIds.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <XLogo size={24} className="text-[var(--text-tertiary)]" />
        </div>
        <p className="mt-5 font-display text-[15px] font-bold italic text-[var(--text-primary)]">
          Link your X account
        </p>
        <p className="mt-2 max-w-[220px] text-[12px] leading-relaxed text-[var(--text-tertiary)]">
          Connect X to showcase your GoOutside moments alongside your event history.
        </p>
        <button className="mt-6 flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-5 py-2.5 text-[12px] font-bold text-[var(--text-secondary)] shadow-sm transition hover:border-[#4a9f63]/40 hover:text-[#4a9f63] active:scale-[0.97]">
          <XLogo size={14} />
          Connect X Account
          <ArrowRight size={13} />
        </button>
      </div>
    );
  }

  // When tweet IDs are available, render via react-tweet:
  // import { Tweet } from 'react-tweet'
  // {tweetIds.map((id) => <Tweet key={id} id={id} />)}
  return (
    <div className="space-y-4">
      {tweetIds.map((id) => (
        <div
          key={id}
          className="rounded-[18px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 text-sm text-[var(--text-tertiary)]"
        >
          Tweet {id}
        </div>
      ))}
    </div>
  );
}
