"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, NavigationArrow } from "@phosphor-icons/react";

export type VenueResult = {
  placeId: string;
  name: string;
  address: string;
  ghanaPost?: string;
  lat: number;
  lng: number;
  mapUrl: string;
};

type GoogleAutocompleteResult = {
  place_id: string;
  structured_formatting: { main_text: string; secondary_text: string };
  description: string;
};

type GooglePlaceDetail = {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: { location: { lat: () => number; lng: () => number } };
  plus_code?: { global_code?: string; compound_code?: string };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoogleMapsPlaces = any;

declare global {
  interface Window {
    // Using `any` to avoid conflicts with @types/google.maps if present
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: any;
    initGoogleMapsPlaces?: () => void;
  }
}

let googleMapsLoaded = false;
let googleMapsLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (googleMapsLoaded) { resolve(); return; }
    loadCallbacks.push(resolve);
    if (googleMapsLoading) return;
    googleMapsLoading = true;
    window.initGoogleMapsPlaces = () => {
      googleMapsLoaded = true;
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsPlaces`;
    script.async = true;
    document.head.appendChild(script);
  });
}

export function VenueMapPicker({
  value,
  onChange,
  placeholder = "Search for a venue or address…",
}: {
  value: VenueResult | null;
  onChange: (v: VenueResult | null) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleAutocompleteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const autocompleteRef = useRef<GoogleMapsPlaces>(null);
  const serviceEl = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY ?? "";

  useEffect(() => {
    if (!apiKey) return;
    loadGoogleMaps(apiKey).then(() => {
      setMapsReady(true);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      autocompleteRef.current = new (window.google as GoogleMapsPlaces).maps.places.AutocompleteService();
    });
  }, [apiKey]);

  const search = useCallback((q: string) => {
    if (!mapsReady || !autocompleteRef.current || q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    autocompleteRef.current.getPlacePredictions(
      { input: q, componentRestrictions: { country: "gh" }, types: ["establishment", "geocode"] },
      (preds: GoogleAutocompleteResult[] | null, status: string) => {
        setLoading(false);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (status === (window.google as GoogleMapsPlaces)?.maps?.places?.PlacesServiceStatus?.OK && preds) {
          setResults(preds.slice(0, 6));
        } else {
          setResults([]);
        }
      }
    );
  }, [mapsReady]);

  function handleInput(v: string) {
    setQuery(v);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 280);
  }

  function selectPlace(pred: GoogleAutocompleteResult) {
    if (!mapsReady || !serviceEl.current) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const svc = new (window.google as GoogleMapsPlaces).maps.places.PlacesService(serviceEl.current);
    svc.getDetails(
      { placeId: pred.place_id, fields: ["place_id", "name", "formatted_address", "geometry", "plus_code"] },
      (detail: GooglePlaceDetail | null, status: string) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (status !== (window.google as GoogleMapsPlaces)?.maps?.places?.PlacesServiceStatus?.OK || !detail) return;
        const lat = detail.geometry.location.lat();
        const lng = detail.geometry.location.lng();
        const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${detail.place_id}&zoom=15`;
        onChange({
          placeId: detail.place_id,
          name: detail.name,
          address: detail.formatted_address,
          ghanaPost: detail.plus_code?.global_code ?? detail.plus_code?.compound_code,
          lat,
          lng,
          mapUrl,
        });
        setQuery(detail.name);
        setOpen(false);
        setResults([]);
      }
    );
  }

  function clear() {
    onChange(null);
    setQuery("");
    setResults([]);
  }

  return (
    <div className="relative">
      {/* Hidden div for PlacesService */}
      <div ref={serviceEl} className="hidden" />

      {/* Input */}
      <div className="relative">
        <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" weight="fill" />
        <input
          className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-3 pl-9 pr-10 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/10 transition"
          placeholder={!apiKey ? "Venue search unavailable — contact support" : placeholder}
          value={query}
          disabled={!apiKey}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true); }}
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
        )}
        {value && !loading && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_8px_32px_rgba(5,12,8,0.14)]"
          >
            {results.map((r) => (
              <button
                key={r.place_id}
                type="button"
                onClick={() => selectPlace(r)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[var(--bg-elevated)]"
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-[var(--brand)]" weight="fill" />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                    {r.structured_formatting.main_text}
                  </p>
                  <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                    {r.structured_formatting.secondary_text}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected venue card + map */}
      <AnimatePresence>
        {value && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
          >
            {/* Map embed */}
            <div className="relative h-36 w-full overflow-hidden">
              <iframe
                title="Venue map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={value.mapUrl}
              />
            </div>
            {/* Venue info */}
            <div className="p-3.5">
              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[var(--brand)]/10">
                  <MapPin size={13} weight="fill" className="text-[var(--brand)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">{value.name}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">{value.address}</p>
                  {value.ghanaPost && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <NavigationArrow size={11} className="text-[var(--brand)]" weight="fill" />
                      <span className="font-mono text-[10px] font-semibold text-[var(--brand)]">
                        {value.ghanaPost}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">Ghana Post code</span>
                    </div>
                  )}
                </div>
                <a
                  href={`https://maps.google.com/?q=${value.lat},${value.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-[10px] font-semibold text-[var(--brand)] hover:opacity-70 transition"
                >
                  Open in Maps →
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
