"use client";

import { useState } from "react";
import { X, Check, User, Camera } from "@phosphor-icons/react";
import type { UserProfile } from "../types";
import { UserAvatar } from "./UserAvatar";
import { getTierInfo } from "../types";

type Props = {
  profile: UserProfile;
  onClose: () => void;
  onSave: (updated: Partial<UserProfile>) => void;
};

export function EditProfileSheet({ profile, onClose, onSave }: Props) {
  const [name,     setName]     = useState(profile.name);
  const [handle,   setHandle]   = useState(profile.handle);
  const [bio,      setBio]      = useState(profile.bio);
  const [location, setLocation] = useState(profile.location);
  const [saving,   setSaving]   = useState(false);

  const bioRemaining = 160 - bio.length;
  const tierInfo = getTierInfo(profile.pulseTier);

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    onSave({ name, handle, bio, location });
    setSaving(false);
    onClose();
  }

  const inputCls =
    "w-full rounded-[12px] border border-white/10 bg-white/6 px-4 py-3 text-[13px] text-white placeholder-white/25 outline-none transition focus:border-[#4a9f63]/50 focus:ring-1 focus:ring-[#4a9f63]/20";

  return (
    <>
      {/* Drag handle */}
      <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/15" />

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4">
        <p className="font-display text-[17px] font-bold italic text-white">Edit Profile</p>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/50 transition hover:bg-white/15 hover:text-white active:scale-[0.95]"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {/* Avatar section */}
        <div className="relative flex items-center gap-4 rounded-[16px] border border-white/8 bg-white/4 p-4">
          <div className="relative">
            <UserAvatar
              name={profile.name}
              avatarUrl={profile.avatarUrl}
              size={60}
              ringClass={tierInfo.ringClass}
            />
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-[#152a1a] shadow">
              <Camera size={11} className="text-white/70" />
            </div>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-white/70">Profile photo</p>
            <button className="mt-0.5 text-[11px] text-[#4a9f63] hover:underline">
              Change photo
            </button>
          </div>
          {/* Cover photo */}
          <button className="ml-auto flex items-center gap-1.5 rounded-[10px] border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-white/40 transition hover:bg-white/10 hover:text-white/70">
            <User size={11} />
            Cover
          </button>
        </div>

        {/* Display name */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
            Display name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            placeholder="Your display name"
          />
        </div>

        {/* Handle */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
            Handle
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-white/30">
              @
            </span>
            <input
              value={handle}
              onChange={(e) =>
                setHandle(e.target.value.replace(/[^a-z0-9._]/gi, "").toLowerCase())
              }
              className={`${inputCls} pl-8`}
              placeholder="your.handle"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
              Bio
            </label>
            <span
              className={`text-[10px] tabular-nums ${
                bioRemaining < 20 ? "text-[#e85d8a]" : "text-white/25"
              }`}
            >
              {bioRemaining}
            </span>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 160))}
            rows={3}
            className={`${inputCls} resize-none`}
            placeholder="Tell the scene who you are…"
          />
        </div>

        {/* Location */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
            Location
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={inputCls}
            placeholder="City, neighbourhood"
          />
        </div>

        {/* Connected accounts */}
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
            Connected accounts
          </p>
          <div className="flex items-center justify-between rounded-[14px] border border-white/8 bg-white/3 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/8">
                <span className="text-sm font-black leading-none text-white/60">𝕏</span>
              </div>
              <span className="text-[12px] text-white/50">X / Twitter</span>
            </div>
            <button className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold text-white/35 transition hover:border-[#4a9f63]/40 hover:text-[#4a9f63] active:scale-[0.95]">
              Connect
            </button>
          </div>
        </div>
      </div>

      {/* Save footer */}
      <div className="shrink-0 border-t border-white/8 px-5 pb-8 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#4a9f63] py-3.5 text-[13px] font-bold text-white shadow-[0_4px_16px_rgba(74,159,99,0.35)] transition hover:bg-[#3d8f56] disabled:opacity-60 active:scale-[0.98]"
        >
          {saving ? (
            <span className="opacity-70">Saving…</span>
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
