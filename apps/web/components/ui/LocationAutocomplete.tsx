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
    key:       process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY ?? "",
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

  // Sync controlled value → display text
  useEffect(() => {
    setInputVal(value?.city_name ?? "");
  }, [value]);

  // Load Google Places and attach Autocomplete
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

  const baseCls =
    "w-full rounded-[12px] border bg-[#131A13] px-4 py-3 text-[14px] text-[#F5FFF0] placeholder-[#3a5a3a] outline-none transition";
  const borderCls = focused
    ? "border-[rgba(95,191,42,0.4)] ring-1 ring-[rgba(95,191,42,0.1)]"
    : "border-[rgba(95,191,42,0.12)]";

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="relative">
        <MapPin
          size={15}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3a5a3a]"
        />
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={`${baseCls} ${borderCls} pl-9 pr-8`}
          autoComplete="off"
        />
        {inputVal && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[#3a5a3a] transition hover:text-[#6B8C6B]"
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
              className="rounded-full border border-[rgba(95,191,42,0.12)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-[11px] text-[#6B8C6B] transition hover:border-[rgba(95,191,42,0.3)] hover:text-[#5FBF2A]"
            >
              {city.name}
            </button>
          ))}
        </div>
      )}

      {value && (
        <p className="text-[11px] text-[#4A6A4A]">{value.formatted_address}</p>
      )}
    </div>
  );
}
