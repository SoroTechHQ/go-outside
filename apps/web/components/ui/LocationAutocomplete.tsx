"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { MapPin, X } from "lucide-react";

export interface PlaceResult {
  place_id:          string;
  city_name:         string;
  region:            string;
  country:           string;
  formatted_address: string;
  lat:               number;
  lng:               number;
}

interface Props {
  value?:         PlaceResult | null;
  onChange:       (place: PlaceResult | null) => void;
  placeholder?:   string;
  className?:     string;
  showShortcuts?: boolean;
}

const POPULAR_CITIES: { name: string; region: string }[] = [
  { name: "Accra",      region: "Greater Accra" },
  { name: "Kumasi",     region: "Ashanti"       },
  { name: "Takoradi",   region: "Western"       },
  { name: "Tamale",     region: "Northern"      },
  { name: "Cape Coast", region: "Central"       },
];

let optionsSet = false;

function ensureOptions() {
  if (optionsSet) return;
  optionsSet = true;
  setOptions({
    key:       process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ?? "",
    v:         "weekly",
    libraries: ["places"],
  });
}

type GooglePlacesLib = typeof google.maps.places;

export function LocationAutocomplete({
  value,
  onChange,
  placeholder   = "Search for a city…",
  className     = "",
  showShortcuts = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef    = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputVal, setInputVal] = useState(value?.city_name ?? "");
  const [ready,    setReady]    = useState(false);
  const [focused,  setFocused]  = useState(false);

  useEffect(() => {
    setInputVal(value?.city_name ?? "");
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    ensureOptions();

    importLibrary("places")
      .then((places) => {
        if (cancelled || !inputRef.current) return;
        setReady(true);

        const PlacesLib = places as unknown as GooglePlacesLib;
        const ac = new PlacesLib.Autocomplete(inputRef.current, {
          types:                ["(cities)"],
          componentRestrictions: { country: "gh" },
          fields: [
            "place_id",
            "name",
            "formatted_address",
            "geometry",
            "address_components",
          ],
        });
        acRef.current = ac;

        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          if (!place.geometry?.location) return;

          const comps = place.address_components ?? [];
          const get   = (type: string) =>
            comps.find((c: google.maps.GeocoderAddressComponent) =>
              c.types.includes(type)
            )?.long_name ?? "";

          const result: PlaceResult = {
            place_id:          place.place_id ?? "",
            city_name:         place.name ?? get("locality"),
            region:            get("administrative_area_level_1"),
            country:           get("country"),
            formatted_address: place.formatted_address ?? "",
            lat:               place.geometry.location.lat(),
            lng:               place.geometry.location.lng(),
          };
          onChange(result);
          setInputVal(result.city_name);
        });
      })
      .catch(console.error);

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clear = useCallback(() => {
    setInputVal("");
    onChange(null);
    inputRef.current?.focus();
  }, [onChange]);

  // When user types and blurs without picking from the Google dropdown,
  // try to resolve the city so they can still proceed.
  const handleBlur = useCallback(() => {
    setFocused(false);
    if (value) return;           // already resolved
    const text = inputVal.trim();
    if (!text) return;

    // Check popular cities first (fast, no API call)
    const match = POPULAR_CITIES.find(
      (c) => c.name.toLowerCase() === text.toLowerCase()
    );
    if (match) {
      void handleShortcut(match);
      return;
    }

    // Fallback: text search via Google Places
    if (!ready) return;
    importLibrary("places")
      .then((places) => {
        const PlacesLib = places as unknown as GooglePlacesLib;
        const service   = new PlacesLib.PlacesService(document.createElement("div"));
        service.textSearch(
          { query: `${text} Ghana`, region: "gh" },
          (results: google.maps.places.PlaceResult[] | null, status: string) => {
            const r = results?.[0];
            if (status === "OK" && r?.geometry?.location) {
              const comps = r.address_components ?? [];
              const get   = (type: string) =>
                comps.find((c: google.maps.GeocoderAddressComponent) =>
                  c.types.includes(type)
                )?.long_name ?? "";
              const resolved: PlaceResult = {
                place_id:          r.place_id ?? "",
                city_name:         r.name ?? get("locality") ?? text,
                region:            get("administrative_area_level_1"),
                country:           get("country") || "Ghana",
                formatted_address: r.formatted_address ?? `${text}, Ghana`,
                lat:               r.geometry!.location!.lat(),
                lng:               r.geometry!.location!.lng(),
              };
              onChange(resolved);
              setInputVal(resolved.city_name);
            }
          }
        );
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, inputVal, ready, onChange]);

  async function handleShortcut(city: { name: string; region: string }) {
    if (!ready) {
      onChange({
        place_id:          "",
        city_name:         city.name,
        region:            city.region,
        country:           "Ghana",
        formatted_address: `${city.name}, ${city.region}, Ghana`,
        lat:               0,
        lng:               0,
      });
      setInputVal(city.name);
      return;
    }

    const PlacesLib = (await importLibrary("places")) as unknown as GooglePlacesLib;
    const service   = new PlacesLib.PlacesService(document.createElement("div"));

    service.textSearch(
      { query: `${city.name} Ghana`, region: "gh" },
      (
        results: google.maps.places.PlaceResult[] | null,
        status:  string
      ) => {
        const r = results?.[0];
        if (status === "OK" && r?.geometry?.location) {
          const comps = r.address_components ?? [];
          const get   = (type: string) =>
            comps.find((c: google.maps.GeocoderAddressComponent) =>
              c.types.includes(type)
            )?.long_name ?? "";

          onChange({
            place_id:          r.place_id ?? "",
            city_name:         city.name,
            region:            get("administrative_area_level_1") || city.region,
            country:           get("country") || "Ghana",
            formatted_address: r.formatted_address ?? `${city.name}, Ghana`,
            lat:               r.geometry!.location!.lat(),
            lng:               r.geometry!.location!.lng(),
          });
        } else {
          onChange({
            place_id:          "",
            city_name:         city.name,
            region:            city.region,
            country:           "Ghana",
            formatted_address: `${city.name}, ${city.region}, Ghana`,
            lat:               0,
            lng:               0,
          });
        }
        setInputVal(city.name);
      }
    );
  }

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="relative">
        <MapPin
          size={15}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
          style={{ color: "var(--ob-text-faint)" }}
        />
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-[12px] border px-4 py-3 pl-9 pr-8 text-[14px] outline-none transition"
          style={{
            background:  "var(--ob-input-bg)",
            color:       "var(--ob-input-text)",
            borderColor: focused ? "var(--ob-input-focus-border)" : "var(--ob-input-border)",
            boxShadow:   focused ? "0 0 0 3px var(--ob-input-focus-ring)" : "none",
          }}
        />
        {/* placeholder colour via global rule — inline style not supported for ::placeholder */}
        <style>{`
          input[data-ob-loc]::placeholder { color: var(--ob-input-placeholder); }
        `}</style>
        {inputVal && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 transition"
            style={{ color: "var(--ob-text-faint)" }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {showShortcuts && !value && (
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_CITIES.map((city) => (
            <button
              key={city.name}
              type="button"
              onClick={() => void handleShortcut(city)}
              className="rounded-full border px-3 py-1 text-[11px] transition hover:opacity-80"
              style={{
                background:  "var(--ob-chip-bg)",
                borderColor: "var(--ob-chip-border)",
                color:       "var(--ob-chip-text)",
              }}
            >
              {city.name}
            </button>
          ))}
        </div>
      )}

      {value && (
        <p className="text-[11px]" style={{ color: "var(--ob-text-faint)" }}>
          {value.formatted_address}
        </p>
      )}
    </div>
  );
}
