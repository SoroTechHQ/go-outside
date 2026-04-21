"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useOrganizerFollowStatus(organizerId: string | undefined) {
  return useQuery({
    queryKey: ["organizer-follow", organizerId],
    queryFn: async () => {
      const res = await fetch(`/api/organizers/follow?organizerId=${organizerId}`);
      if (!res.ok) return { following: false };
      return res.json() as Promise<{ following: boolean }>;
    },
    enabled: !!organizerId,
    staleTime: 30_000,
  });
}

export function useOrganizerFollowMutation(organizerId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (follow: boolean) => {
      const res = await fetch("/api/organizers/follow", {
        method: follow ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerId }),
      });
      if (!res.ok) throw new Error("Follow action failed");
      return res.json() as Promise<{ following: boolean }>;
    },
    onMutate: async (follow) => {
      await qc.cancelQueries({ queryKey: ["organizer-follow", organizerId] });
      const prev = qc.getQueryData<{ following: boolean }>(["organizer-follow", organizerId]);
      qc.setQueryData(["organizer-follow", organizerId], { following: follow });
      return { prev };
    },
    onError: (_err, _follow, ctx) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData(["organizer-follow", organizerId], ctx.prev);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["organizer-follow", organizerId] });
    },
  });
}
