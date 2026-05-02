"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { PencilSimple } from "@phosphor-icons/react";
import OrganizerBadge from "./OrganizerBadge";
import { EditOrganizerProfileSheet } from "./EditOrganizerProfileSheet";
import type { OrganizerDashboardData } from "../_lib/dashboard";

type OrganizerInfo = OrganizerDashboardData["organizer"];

function Overlay({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      {/* Mobile: slide-up sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex max-h-[90dvh] flex-col overflow-hidden rounded-t-[28px] border-t border-[#4a9f63]/15 bg-[#0c1a10] shadow-[0_-24px_64px_rgba(0,0,0,0.7)] transition-transform duration-300 ease-out md:hidden ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {children}
      </div>
      {/* Desktop: centered modal */}
      <div
        className={`fixed left-1/2 top-1/2 z-50 hidden w-[520px] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[24px] border border-[#4a9f63]/15 bg-[#0c1a10] shadow-[0_32px_72px_rgba(0,0,0,0.65)] transition-[opacity,transform] duration-200 md:flex ${
          open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-[0.96] pointer-events-none"
        }`}
      >
        {children}
      </div>
    </>
  );
}

export function OrganizerIdentityCardClient({ organizer }: { organizer: OrganizerInfo }) {
  const [editOpen, setEditOpen] = useState(false);
  const [local, setLocal] = useState(organizer);

  function handleSave(updated: Partial<{
    bio: string;
    logoUrl: string | null;
    websiteUrl: string | null;
    social_links: Record<string, string> | null;
  }>) {
    setLocal((prev) => ({ ...prev, ...updated }));
  }

  return (
    <article className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Organizer identity</p>
          <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
            Public profile footprint and account signals.
          </p>
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)] active:scale-95"
        >
          <PencilSimple size={12} />
          Edit
        </button>
      </div>

      {/* Logo + badge */}
      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={() => setEditOpen(true)}
          className="relative shrink-0 overflow-hidden rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] transition hover:opacity-85"
          style={{ width: 52, height: 52 }}
        >
          {local.logoUrl ? (
            <Image src={local.logoUrl} alt={local.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[18px] font-black text-[var(--brand)]">
              {local.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center rounded-[14px] bg-black/0 opacity-0 transition-opacity hover:bg-black/30 hover:opacity-100">
            <PencilSimple size={14} className="text-white" />
          </div>
        </button>
        <OrganizerBadge />
      </div>

      <h2 className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">
        {local.name}
      </h2>
      <p className="mt-3 text-[13px] leading-6 text-[var(--text-secondary)] line-clamp-3">{local.bio}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-[var(--bg-muted)] px-3 py-1.5 text-[12px] text-[var(--text-secondary)]">
          {local.city}
        </span>
        <span className="rounded-full bg-[var(--bg-muted)] px-3 py-1.5 text-[12px] text-[var(--text-secondary)]">
          {local.totalEvents} hosted
        </span>
      </div>

      {local.socialLinks.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {local.socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href.startsWith("http") ? link.href : `https://${link.href}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-[11px] font-medium text-[var(--brand)] hover:underline"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      <Overlay open={editOpen} onClose={() => setEditOpen(false)}>
        <EditOrganizerProfileSheet
          organizer={{
            name:       local.name,
            bio:        local.bio,
            logoUrl:    local.logoUrl,
            websiteUrl: local.websiteUrl,
            social_links: local.social_links,
          }}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
        />
      </Overlay>
    </article>
  );
}
