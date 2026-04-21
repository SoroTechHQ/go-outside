"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type FollowStatus = {
  following:  boolean;
  followedBy: boolean;
  mutual:     boolean;
};

// ── Query: is current user following targetClerkId? ───────────────────────────

export function useFollowStatus(targetClerkId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["follow-status", targetClerkId],
    queryFn:  async (): Promise<FollowStatus> => {
      const res = await fetch(`/api/follow/status?targetId=${targetClerkId}`);
      if (!res.ok) return { following: false, followedBy: false, mutual: false };
      return res.json() as Promise<FollowStatus>;
    },
    enabled:   enabled && !!targetClerkId,
    staleTime: 30_000,
  });
}

// ── Mutation: toggle follow with optimistic update ────────────────────────────

export function useFollowMutation(targetClerkId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (follow: boolean) => {
      const res = await fetch("/api/follow", {
        method:  follow ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ targetClerkId }),
      });
      if (!res.ok) throw new Error("Follow request failed");
    },

    onMutate: async (follow: boolean) => {
      await qc.cancelQueries({ queryKey: ["follow-status", targetClerkId] });
      const prev = qc.getQueryData<FollowStatus>(["follow-status", targetClerkId]);

      qc.setQueryData<FollowStatus>(["follow-status", targetClerkId], (old) => ({
        following:  follow,
        followedBy: old?.followedBy ?? false,
        mutual:     follow && (old?.followedBy ?? false),
      }));

      return { prev };
    },

    onError: (_err, _follow, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["follow-status", targetClerkId], ctx.prev);
      }
    },

    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["follow-status", targetClerkId] });
      // Refresh profile stats since follower/following counts change
      void qc.invalidateQueries({ queryKey: ["profile-stats"] });
    },
  });
}
