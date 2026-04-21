import { supabaseAdmin } from "../supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

export type RewardCategory =
  | "ticket_discount"
  | "access_perk"
  | "profile_status"
  | "organizer_funded";

export interface PulseReward {
  id: string;
  category: RewardCategory;
  title: string;
  description: string;
  pp_cost: number;
  discount_ghs: number | null;
  remaining_qty: number | null;
  display_order: number;
}

export interface LedgerEntry {
  id: string;
  transaction_type: string;
  delta: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export interface RewardsBadge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_key: string;
  unlock_condition: string;
  pp_bonus: number;
  display_order: number;
  special_label: string | null;
  earned: boolean;
  earned_at: string | null;
  is_pinned: boolean;
}

export interface PulsePointsSummary {
  balance: number;
  lifetime: number;
}

export interface RedeemResult {
  coupon_code: string;
  balance_after: number;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getUserPulsePoints(
  userId: string
): Promise<PulsePointsSummary> {
  try {
    const { data } = await supabaseAdmin
      .from("users")
      .select("pulse_points_balance, pulse_points_lifetime")
      .eq("id", userId)
      .maybeSingle();

    return {
      balance: (data as { pulse_points_balance?: number } | null)?.pulse_points_balance ?? 0,
      lifetime: (data as { pulse_points_lifetime?: number } | null)?.pulse_points_lifetime ?? 0,
    };
  } catch {
    return { balance: 0, lifetime: 0 };
  }
}

export async function getActiveRewards(
  category?: RewardCategory
): Promise<PulseReward[]> {
  try {
    const now = new Date().toISOString();
    let query = supabaseAdmin
      .from("rewards")
      .select(
        "id, category, title, description, pp_cost, discount_ghs, remaining_qty, display_order"
      )
      .eq("is_active", true)
      .or(`valid_until.is.null,valid_until.gt.${now}`)
      .order("display_order", { ascending: true });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[getActiveRewards]", error);
      return [];
    }
    return (data ?? []) as PulseReward[];
  } catch {
    return [];
  }
}

export async function getPulseLedger(
  userId: string,
  limit = 30
): Promise<LedgerEntry[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("pulse_points_ledger")
      .select(
        "id, transaction_type, delta, balance_after, description, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[getPulseLedger]", error);
      return [];
    }
    return (data ?? []) as LedgerEntry[];
  } catch {
    return [];
  }
}

export async function getUserRewardsBadges(
  userId: string
): Promise<RewardsBadge[]> {
  try {
    const [{ data: allBadges, error: badgeErr }, { data: earnedRows }] =
      await Promise.all([
        supabaseAdmin
          .from("rewards_badges")
          .select(
            "id, slug, name, description, icon_key, unlock_condition, pp_bonus, display_order, special_label"
          )
          .order("display_order", { ascending: true }),
        supabaseAdmin
          .from("user_rewards_badges")
          .select("badge_id, earned_at, is_pinned")
          .eq("user_id", userId),
      ]);

    if (badgeErr) {
      console.error("[getUserRewardsBadges]", badgeErr);
      return [];
    }

    const earnedMap = new Map(
      (earnedRows ?? []).map((r) => [
        r.badge_id,
        { earned_at: r.earned_at as string, is_pinned: r.is_pinned as boolean },
      ])
    );

    return (allBadges ?? []).map((b) => {
      const earned = earnedMap.get(b.id as string);
      return {
        ...(b as object),
        earned: !!earned,
        earned_at: earned?.earned_at ?? null,
        is_pinned: earned?.is_pinned ?? false,
      } as RewardsBadge;
    });
  } catch {
    return [];
  }
}

// ─── Mutation (called from API route) ────────────────────────────────────────

export async function redeemRewardForUser(
  userId: string,
  rewardId: string
): Promise<RedeemResult> {
  const { data, error } = await supabaseAdmin.rpc("redeem_reward", {
    p_user_id: userId,
    p_reward_id: rewardId,
  });

  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return row as RedeemResult;
}
