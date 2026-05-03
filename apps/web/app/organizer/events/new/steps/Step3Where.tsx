"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { MapPin, Video, X } from "@phosphor-icons/react";
import { useWizard } from "../WizardContext";

type LocationMode = "venue" | "custom" | "online";

type PlaceResult = {
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
};

const ONLINE_PROVIDERS = [
  { id: "zoom", label: "Zoom" },
  { id: "meet", label: "Google Meet" },
  { id: "teams", label: "Microsoft Teams" },
  { id: "youtube", label: "YouTube Live" },
  { id: "twitch", label: "Twitch" },
  { id: "other", label: "Other" },
];

let googleOptionsSet = false;
function ensureGoogleOptions() {
  if (googleOptionsSet) return;
  googleOptionsSet = true;
  setOptions({
    key: process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY ?? "",
    v: "weekly",
    libraries: ["places"],
  });
}

export function Step3Where() {
  const { state, setField } = useWizard();
  const [mode, setMode] = useState<LocationMode>(
    state.isOnline ? "online" : state.venueAddress ? "venue" : state.customLocation ? "custom" : "venue"
  );

  // Venue search state
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputVal, setInputVal] = useState(state.venueName ?? "");
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(
    state.venueName ? { name: state.venueName, formatted_address: state.venueAddress ?? "", lat: state.venueLat ?? 0, lng: state.venueLng ?? 0 } : null
  );

  useEffect(() => {
    if (mode === "online") {
      setField("isOnline", true);
      setField("venueId", null);
      setField("customLocation", null);
      setField("venueName", null);
      setField("venueAddress", null);
      setField("venueLat", null);
      setField("venueLng", null);
    } else if (mode === "venue") {
      setField("isOnline", false);
    } else {
      setField("isOnline", false);
      setField("venueId", null);
      setField("venueName", null);
      setField("venueAddress", null);
      setField("venueLat", null);
      setField("venueLng", null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (mode !== "venue" || !inputRef.current) return;
    let cancelled = false;
    ensureGoogleOptions();

    importLibrary("places")
      .then((places) => {
        if (cancelled || !inputRef.current) return;
        const PlacesLib = places as unknown as typeof google.maps.places;
        const ac = new PlacesLib.Autocomplete(inputRef.current, {
          types: ["establishment", "geocode"],
          fields: ["name", "formatted_address", "geometry", "place_id"],
        });
        acRef.current = ac;

        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          if (!place.geometry?.location) return;
          const result: PlaceResult = {
            name: place.name ?? place.formatted_address ?? "",
            formatted_address: place.formatted_address ?? "",
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          setSelectedPlace(result);
          setInputVal(result.name);
          setField("venueName", result.name);
          setField("venueAddress", result.formatted_address);
          setField("customLocation", result.formatted_address);
          setField("venueLat", result.lat);
          setField("venueLng", result.lng);
          setField("venueId", null);
        });
      })
      .catch(console.error);

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function clearVenue() {
    setSelectedPlace(null);
    setInputVal("");
    setField("venueName", null);
    setField("venueAddress", null);
    setField("customLocation", null);
    setField("venueLat", null);
    setField("venueLng", null);
  }

  return (
    <div className="space-y-6">
      {/* Mode tabs */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Location type
        </label>
        <div className="mt-2 flex gap-2">
          {(["venue", "custom", "online"] as LocationMode[]).map((m) => (
            <button
              key={m}
              className={`rounded-full px-4 py-2 text-[13px] font-medium transition ${
                mode === m
                  ? "bg-[var(--brand)] text-black"
                  : "border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--brand)]/30"
              }`}
              type="button"
              onClick={() => setMode(m)}
            >
              {m === "venue" ? "Venue / Address" : m === "custom" ? "Custom" : "Online"}
            </button>
          ))}
        </div>
      </div>

      {/* Venue search via Google Places */}
      {mode === "venue" && (
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Search venue or address
          </label>
          <div className="relative mt-2">
            <MapPin className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-[var(--text-tertiary)]" size={15} />
            <input
              ref={inputRef}
              className="w-full rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] py-3 pl-9 pr-9 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
              placeholder="e.g. Labadi Beach Hotel, Accra…"
              type="text"
              autoComplete="off"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                if (!e.target.value) clearVenue();
              }}
            />
            {inputVal && (
              <button
                type="button"
                onClick={clearVenue}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {selectedPlace && (
            <div className="mt-3 flex items-start gap-3 rounded-[14px] bg-[var(--brand)]/8 px-4 py-3">
              <MapPin className="mt-0.5 shrink-0 text-[var(--brand)]" size={16} weight="fill" />
              <div>
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">{selectedPlace.name}</p>
                <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">{selectedPlace.formatted_address}</p>
                {selectedPlace.lat !== 0 && (
                  <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]/60">
                    {selectedPlace.lat.toFixed(5)}, {selectedPlace.lng.toFixed(5)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom location text */}
      {mode === "custom" && (
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Custom location
          </label>
          <input
            className="mt-2 w-full rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
            placeholder="e.g. Labadi Beach, Accra, Ghana"
            type="text"
            value={state.customLocation ?? ""}
            onChange={(e) => setField("customLocation", e.target.value)}
          />
        </div>
      )}

      {/* Online event */}
      {mode === "online" && (
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Platform
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ONLINE_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setField("onlinePlatform", p.id)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition ${
                    state.onlinePlatform === p.id
                      ? "bg-[var(--brand)] text-black"
                      : "border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--brand)]/30"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Video conferencing link
            </label>
            <div className="relative mt-2">
              <Video className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={15} />
              <input
                className="w-full rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] py-3 pl-9 pr-4 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
                placeholder="https://zoom.us/j/... or meet.google.com/..."
                type="url"
                value={state.onlineLink ?? ""}
                onChange={(e) => setField("onlineLink", e.target.value || null)}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">
              Attendees receive this link in their ticket confirmation email.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
