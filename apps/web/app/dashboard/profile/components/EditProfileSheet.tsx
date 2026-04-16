"use client";

import { useState } from "react";
import { X, Check, Camera } from "@phosphor-icons/react";
import type { UserProfile } from "../types";
import { UserAvatar } from "./UserAvatar";
import { getTierInfo } from "../types";
import { LocationAutocomplete, type PlaceResult } from "../../../../components/ui/LocationAutocomplete";

type Props = {
  profile: UserProfile;
  onClose: () => void;
  onSave:  (updated: Partial<UserProfile>) => void;
};

export function EditProfileSheet({ profile, onClose, onSave }: Props) {
  const [firstName, setFirstName] = useState(profile.name.split(" ")[0] ?? "");
  const [lastName,  setLastName]  = useState(profile.name.split(" ").slice(1).join(" ") ?? "");
  const [handle,    setHandle]    = useState(profile.handle);
  const [bio,       setBio]       = useState(profile.bio ?? "");
  const [locationPlace, setLocationPlace] = useState<PlaceResult | null>(
    profile.location
      ? { place_id: "", city_name: profile.location, region: "", country: "Ghana", formatted_address: profile.location, lat: 0, lng: 0 }
      : null
  );
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const bioRemaining = 160 - bio.length;
  const tierInfo     = getTierInfo(profile.pulseTier);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/users/me", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name:         firstName.trim(),
          last_name:          lastName.trim(),
          username:           handle.replace(/^@/, ""),
          bio:                bio.trim(),
          location_city:      locationPlace?.city_name ?? "",
          location_city_name: locationPlace?.city_name ?? "",
          location_region:    locationPlace?.region ?? "",
          location_country:   locationPlace?.country ?? "Ghana",
          location_formatted: locationPlace?.formatted_address ?? "",
          location_place_id:  locationPlace?.place_id ?? "",
          location_source:    "manual",
          ...(locationPlace?.lat && locationPlace?.lng
            ? { location_lat: locationPlace.lat, location_lng: locationPlace.lng }
            : {}),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");

      onSave({
        name:     `${firstName} ${lastName}`.trim(),
        handle:   handle.replace(/^@/, ""),
        bio:      bio.trim(),
        location: locationPlace?.city_name ?? "",
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
        <p className="font-display text-[17px] font-bold italic text-white">Edit Profile</p>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/50 transition hover:bg-white/15 hover:text-white active:scale-[0.95]"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {/* Avatar */}
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
            <p className="mt-0.5 text-[11px] text-white/30">Synced from your account</p>
          </div>
        </div>

        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
              First name
            </label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputCls}
              placeholder="Kwame"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
              Last name
            </label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputCls}
              placeholder="Mensah"
            />
          </div>
        </div>

        {/* Handle */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
            Handle
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-white/30">@</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace(/[^a-z0-9._]/gi, "").toLowerCase())}
              className={`${inputCls} pl-8`}
              placeholder="your.handle"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Bio</label>
            <span className={`text-[10px] tabular-nums ${bioRemaining < 20 ? "text-[#e85d8a]" : "text-white/25"}`}>
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
            City
          </label>
          <LocationAutocomplete
            value={locationPlace}
            onChange={setLocationPlace}
            placeholder="Search for your city…"
            showShortcuts
          />
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
