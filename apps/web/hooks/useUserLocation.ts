"use client";

import { useState, useCallback } from "react";
import type { PlaceResult } from "../components/ui/LocationAutocomplete";

type Status = "idle" | "loading" | "success" | "denied" | "error";

export function useUserLocation() {
  const [status, setStatus]   = useState<Status>("idle");
  const [result, setResult]   = useState<PlaceResult | null>(null);
  const [error,  setError]    = useState<string | null>(null);

  const detect = useCallback(async () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setError("Geolocation not supported");
      return null;
    }

    setStatus("loading");
    setError(null);

    return new Promise<PlaceResult | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          try {
            const res = await fetch("/api/users/me/location/gps", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({ lat: coords.latitude, lng: coords.longitude }),
            });

            if (!res.ok) throw new Error("Reverse geocode failed");

            const data = await res.json() as PlaceResult & {
              formatted_address: string;
            };

            const place: PlaceResult = {
              place_id:          data.place_id,
              city_name:         data.city_name,
              region:            data.region,
              country:           data.country,
              formatted_address: data.formatted_address,
              lat:               coords.latitude,
              lng:               coords.longitude,
            };

            setResult(place);
            setStatus("success");
            resolve(place);
          } catch (e) {
            setStatus("error");
            setError((e as Error).message);
            resolve(null);
          }
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setStatus("denied");
            setError("Location permission denied");
          } else {
            setStatus("error");
            setError(err.message);
          }
          resolve(null);
        },
        { timeout: 10_000, enableHighAccuracy: false }
      );
    });
  }, []);

  return { detect, status, result, error };
}
