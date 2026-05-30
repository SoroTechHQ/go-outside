"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EventItem } from "@gooutside/demo-data";

export function useEventSave(eventId: string) {
  const queryClient = useQueryClient();

  const { data: savedEvents = [] } = useQuery<EventItem[]>({
    queryKey: ["saved-events"],
    queryFn: () => fetch("/api/events/saved").then((r) => r.json()),
    staleTime: 60_000,
  });

  const isSaved = savedEvents.some((e) => e.id === eventId);

  const { mutate, isPending } = useMutation({
    mutationFn: async (willSave: boolean) => {
      const res = await fetch("/api/events/save", {
        method: willSave ? "POST" : "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (!res.ok) throw new Error("Failed to update saved state");
    },
    onMutate: async (willSave) => {
      await queryClient.cancelQueries({ queryKey: ["saved-events"] });
      const previous = queryClient.getQueryData<EventItem[]>(["saved-events"]);
      queryClient.setQueryData<EventItem[]>(["saved-events"], (old = []) =>
        willSave
          ? [...old, { id: eventId } as EventItem]
          : old.filter((e) => e.id !== eventId),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(["saved-events"], ctx?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-events"] });
    },
  });

  return {
    isSaved,
    isPending,
    toggleSave: () => mutate(!isSaved),
  };
}
