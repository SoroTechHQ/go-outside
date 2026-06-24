"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building,
  CheckCircle,
  Globe,
  InstagramLogo,
  MapPin,
  TwitterLogo,
  User,
} from "@phosphor-icons/react";

type OrgProfile = {
  id: string;
  organization_name: string | null;
  bio: string | null;
  website_url: string | null;
  logo_url: string | null;
  cover_url: string | null;
  location_city: string | null;
  social_links: Record<string, string> | null;
  slug: string | null;
} | null;

export function ProfileSettingsClient({ profile, userId }: { profile: OrgProfile; userId: string }) {
  const [name, setName] = useState(profile?.organization_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [website, setWebsite] = useState(profile?.website_url ?? "");
  const [city, setCity] = useState(profile?.location_city ?? "");
  const [instagram, setInstagram] = useState(profile?.social_links?.instagram ?? "");
  const [twitter, setTwitter] = useState(profile?.social_links?.twitter ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setIsSaving(true);
    setError("");
    try {
      const body = {
        organizationName: name.trim() || null,
        bio: bio.trim() || null,
        websiteUrl: website.trim() || null,
        locationCity: city.trim() || null,
        socialLinks: {
          ...(instagram && { instagram: instagram.trim().replace(/^@/, "") }),
          ...(twitter && { twitter: twitter.trim().replace(/^@/, "") }),
        },
      };
      const res = await fetch("/api/organizer/profile", {
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
    <div className="p-5 md:p-7 space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Settings</p>
        <h1 className="mt-0.5 text-[1.6rem] font-bold tracking-tight text-[var(--text-primary)]">Organizer profile</h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Your public profile that attendees see when they browse your events.
        </p>
      </div>

      <div className="mx-auto max-w-xl space-y-5">
        {/* Name */}
        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_2px_12px_rgba(5,12,8,0.05)]">
          <div className="flex items-center gap-2 mb-4">
            <Building size={15} weight="fill" className="text-[var(--brand)]" />
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">Organization name</p>
          </div>
          <input
            className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-[14px] font-semibold text-[var(--text-primary)] placeholder:font-normal placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/10 transition"
            placeholder="Your organization or artist name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Bio */}
        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_2px_12px_rgba(5,12,8,0.05)]">
          <div className="flex items-center gap-2 mb-4">
            <User size={15} weight="fill" className="text-[var(--brand)]" />
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">Bio</p>
          </div>
          <textarea
            className="w-full resize-none rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-[13px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/10 transition"
            maxLength={500}
            placeholder="Tell attendees what you're about, what kind of events you host, and why they should follow you…"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <div className="mt-1 flex justify-end">
            <span className="text-[10px] text-[var(--text-tertiary)]">{bio.length}/500</span>
          </div>
        </div>

        {/* Location + Website */}
        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_2px_12px_rgba(5,12,8,0.05)] space-y-4">
          <div>
            <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              <MapPin size={12} className="text-[var(--brand)]" /> Location
            </label>
            <input
              className="mt-2 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none transition"
              placeholder="e.g. Accra, Ghana"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              <Globe size={12} className="text-[var(--brand)]" /> Website
            </label>
            <input
              className="mt-2 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none transition"
              placeholder="https://yourwebsite.com"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
        </div>

        {/* Social */}
        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_2px_12px_rgba(5,12,8,0.05)] space-y-4">
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">Social links</p>
          <div>
            <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              <InstagramLogo size={12} /> Instagram
            </label>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-[var(--text-tertiary)]">@</span>
              <input
                className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-3 pl-8 pr-4 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none transition"
                placeholder="your_handle"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              <TwitterLogo size={12} /> X (Twitter)
            </label>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-[var(--text-tertiary)]">@</span>
              <input
                className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-3 pl-8 pr-4 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none transition"
                placeholder="your_handle"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-[13px] text-red-500">{error}</p>}

        <div className="flex items-center justify-between gap-4">
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
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            disabled={isSaving}
            onClick={handleSave}
            className="ml-auto flex items-center gap-2 rounded-full bg-[var(--brand)] px-7 py-3 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(47,143,69,0.2)] transition hover:opacity-90 disabled:opacity-60"
          >
            {isSaving ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <CheckCircle size={14} weight="fill" />}
            Save profile
          </motion.button>
        </div>
      </div>
    </div>
  );
}
