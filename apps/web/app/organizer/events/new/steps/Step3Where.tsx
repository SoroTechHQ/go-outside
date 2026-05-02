"use client";

import { useState, useEffect, useRef } from "react";
import { useWizard } from "../WizardContext";

type Venue = { id: string; name: string; city: string; address?: string };
type LocationMode = "venue" | "custom" | "online";

export function Step3Where() {
  const { state, setField } = useWizard();
  const [mode, setMode] = useState<LocationMode>(
    state.isOnline ? "online" : state.venueId ? "venue" : state.customLocation ? "custom" : "venue"
  );
  const [query, setQuery] = useState("");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mode === "online") {
      setField("isOnline", true);
      setField("venueId", null);
      setField("customLocation", null);
    } else if (mode === "venue") {
      setField("isOnline", false);
    } else {
      setField("isOnline", false);
      setField("venueId", null);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "venue" || query.length < 2) {
      setVenues([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/venues/search?q=${encodeURIComponent(query)}`);
        const data = await r.json();
        setVenues(data.venues ?? []);
      } catch {
        setVenues([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [query, mode]);

  function selectVenue(venue: Venue) {
    setSelectedVenue(venue);
    setQuery(venue.name);
    setVenues([]);
    setField("venueId", venue.id);
    setField("customLocation", null);
  }

  return (
    <div className="space-y-6">
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
              {m === "venue" ? "Venue" : m === "custom" ? "Custom location" : "Online"}
            </button>
          ))}
        </div>
      </div>

      {mode === "venue" && (
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Search venues
          </label>
          <div className="relative mt-2">
            <input
              className="w-full rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
              placeholder="Search by venue name or city…"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value) {
                  setSelectedVenue(null);
                  setField("venueId", null);
                }
              }}
            />
            {searching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
              </div>
            )}
            {venues.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_8px_32px_rgba(5,12,8,0.16)]">
                {venues.map((v) => (
                  <button
                    key={v.id}
                    className="flex w-full flex-col px-4 py-3 text-left transition hover:bg-[var(--bg-elevated)]"
                    type="button"
                    onClick={() => selectVenue(v)}
                  >
                    <span className="text-[13px] font-medium text-[var(--text-primary)]">{v.name}</span>
                    <span className="text-[11px] text-[var(--text-tertiary)]">
                      {v.city}{v.address ? ` · ${v.address}` : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedVenue && (
            <div className="mt-3 flex items-center gap-3 rounded-[14px] bg-[var(--brand)]/8 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand)]/15">
                <span className="text-sm text-[var(--brand)]">📍</span>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">{selectedVenue.name}</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">{selectedVenue.city}</p>
              </div>
            </div>
          )}
        </div>
      )}

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

      {mode === "online" && (
        <div className="rounded-[16px] bg-[var(--brand)]/8 px-4 py-4">
          <p className="text-[13px] font-semibold text-[var(--brand)]">Online event</p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Attendees will receive a join link in their ticket confirmation email.
          </p>
        </div>
      )}
    </div>
  );
}
