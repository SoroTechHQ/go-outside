"use client";

import { useState } from "react";
import { Check, Link as LinkIcon } from "@phosphor-icons/react";

export function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/events/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for browsers that don't support clipboard API
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)] active:scale-[0.97]"
    >
      {copied ? (
        <>
          <Check size={14} weight="bold" className="text-[var(--brand)]" />
          <span className="text-[var(--brand)]">Copied!</span>
        </>
      ) : (
        <>
          <LinkIcon size={14} />
          Copy link
        </>
      )}
    </button>
  );
}
