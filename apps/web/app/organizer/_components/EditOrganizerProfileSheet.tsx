"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { X, Check, Camera } from "@phosphor-icons/react";
import { compressForUpload } from "../../../lib/compress-image";

type OrganizerData = {
  name: string;
  bio: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  social_links: Record<string, string> | null;
};

type Props = {
  organizer: OrganizerData;
  onClose: () => void;
  onSave: (updated: Partial<OrganizerData>) => void;
};

export function EditOrganizerProfileSheet({ organizer, onClose, onSave }: Props) {
  const [bio,        setBio]        = useState(organizer.bio ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(organizer.websiteUrl ?? "");
  const [instagram,  setInstagram]  = useState(organizer.social_links?.instagram ?? "");
  const [twitter,    setTwitter]    = useState(organizer.social_links?.twitter ?? "");
  const [facebook,   setFacebook]   = useState(organizer.social_links?.facebook ?? "");
  const [logoUrl,    setLogoUrl]    = useState(organizer.logoUrl);
  const [logoUploading, setLogoUploading] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const bioRemaining = 300 - bio.length;

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setError(null);
    try {
      const compressed = await compressForUpload(file, "logo");
      const fd = new FormData();
      fd.append("file", compressed, "logo.webp");
      const res = await fetch("/api/upload/logo", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = (await res.json()) as { url: string };
      setLogoUrl(url);
      await fetch("/api/organizer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_url: url }),
      });
    } catch {
      setError("Failed to upload logo. Try again.");
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const social_links: Record<string, string> = {};
      if (instagram.trim()) social_links.instagram = instagram.trim();
      if (twitter.trim())   social_links.twitter   = twitter.trim();
      if (facebook.trim())  social_links.facebook  = facebook.trim();

      const res = await fetch("/api/organizer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio:         bio.trim(),
          website_url: websiteUrl.trim() || null,
          social_links: Object.keys(social_links).length > 0 ? social_links : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");

      onSave({
        bio:       bio.trim(),
        logoUrl,
        websiteUrl: websiteUrl.trim() || null,
        social_links: Object.keys(social_links).length > 0 ? social_links : null,
      });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-[12px] border border-white/10 bg-white/6 px-4 py-3 text-[13px] text-white placeholder-white/25 outline-none transition focus:border-[#4a9f63]/50 focus:ring-1 focus:ring-[#4a9f63]/20";

  return (
    <>
      <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/15" />

      <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4">
        <p className="font-display text-[17px] font-bold italic text-white">Edit Organizer Profile</p>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/50 transition hover:bg-white/15 hover:text-white active:scale-[0.95]"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {/* Logo upload */}
        <div className="flex items-center gap-4 rounded-[16px] border border-white/8 bg-white/4 p-4">
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
          <button
            type="button"
            className="relative shrink-0"
            onClick={() => logoInputRef.current?.click()}
            disabled={logoUploading}
          >
            <div className="relative h-[64px] w-[64px] overflow-hidden rounded-[16px] border border-white/15 bg-white/8">
              {logoUrl ? (
                <Image src={logoUrl} alt={organizer.name} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[22px] font-black text-[#4a9f63]">
                  {organizer.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              {logoUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-[#152a1a] shadow">
              {logoUploading ? (
                <span className="h-3 w-3 animate-spin rounded-full border border-white/40 border-t-white" />
              ) : (
                <Camera size={11} className="text-white/70" />
              )}
            </div>
          </button>
          <div>
            <p className="text-[12px] font-semibold text-white/70">Organisation logo</p>
            <p className="mt-0.5 text-[11px] text-white/30">
              {logoUploading ? "Uploading…" : "Tap to change · Square, compressed to WebP"}
            </p>
            <p className="mt-1 text-[11px] text-white/20 truncate max-w-[180px]">{organizer.name}</p>
          </div>
        </div>

        {/* Bio */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Bio</label>
            <span className={`text-[10px] tabular-nums ${bioRemaining < 30 ? "text-[#e85d8a]" : "text-white/25"}`}>
              {bioRemaining}
            </span>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 300))}
            rows={3}
            className={`${inputCls} resize-none`}
            placeholder="Tell attendees who you are and what kind of events you run…"
          />
        </div>

        {/* Website */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
            Website
          </label>
          <input
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className={inputCls}
            placeholder="https://yoursite.com"
            type="url"
          />
        </div>

        {/* Social links */}
        <div>
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
            Social links
          </label>
          <div className="space-y-2.5">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-white/25">IG</span>
              <input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className={`${inputCls} pl-10`}
                placeholder="@handle or full URL"
              />
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-white/25">𝕏</span>
              <input
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                className={`${inputCls} pl-10`}
                placeholder="@handle or full URL"
              />
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-white/25">FB</span>
              <input
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                className={`${inputCls} pl-10`}
                placeholder="Page name or full URL"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="rounded-[10px] border border-red-500/20 bg-red-500/10 px-4 py-2 text-[12px] text-red-400">
            {error}
          </p>
        )}
      </div>

      <div className="shrink-0 border-t border-white/8 px-5 pb-8 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#4a9f63] py-3.5 text-[13px] font-bold text-white shadow-[0_4px_16px_rgba(74,159,99,0.35)] transition hover:bg-[#3d8f56] disabled:opacity-60 active:scale-[0.98]"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving…
            </>
          ) : (
            <>
              <Check size={15} />
              Save changes
            </>
          )}
        </button>
      </div>
    </>
  );
}
