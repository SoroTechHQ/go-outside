"use client";

import { useQuery } from "@tanstack/react-query";
import { appBootstrapQueryKey, DEFAULT_APP_BOOTSTRAP, type AppBootstrap } from "../lib/app-contracts";

async function fetchAppBootstrap(): Promise<AppBootstrap> {
  const res = await fetch("/api/bootstrap", {
    credentials: "same-origin",
  });

  if (!res.ok) {
    return DEFAULT_APP_BOOTSTRAP;
  }

  return res.json() as Promise<AppBootstrap>;
}

export function useAppBootstrap() {
  return useQuery({
    queryKey: appBootstrapQueryKey,
    queryFn: fetchAppBootstrap,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
