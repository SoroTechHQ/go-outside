import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../../lib/supabase";

// Single source of truth for tier definitions
const TIER_THRESHOLDS = [
  { slug: "legend",      label: "Legend",      min: 2000, max: Infinity },
  { slug: "city_native", label: "City Native", min: 1000, max: 1999     },
  { slug: "scene_kid",   label: "Scene Kid",   min: 600,  max: 999      },
  { slug: "regular",     label: "Regular",     min: 300,  max: 599      },
  { slug: "explorer",    label: "Explorer",    min: 100,  max: 299      },
  { slug: "newcomer",    label: "Newcomer",    min: 0,    max: 99       },
] as const;

function getTierInfo(score: number) {
  return TIER_THRESHOLDS.find((t) => score >= t.min) ?? TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
}

function getProgressPct(score: number): number {
  const tier = getTierInfo(score);
  const next = TIER_THRESHOLDS.find((t) => t.min > tier.min);
  if (!next) return 100;
  const range = next.min - tier.min;
  const earned = score - tier.min;
  return Math.min(100, Math.round((earned / range) * 100));
}

export async function GET() {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("pulse_score, pulse_points_balance, location_city")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  const pulse_score = (user as { pulse_score?: number } | null)?.pulse_score ?? 0;
  const pulse_points_balance = (user as { pulse_points_balance?: number } | null)?.pulse_points_balance ?? 0;
  const location_city = (user as { location_city?: string } | null)?.location_city ?? null;

  const tierInfo = getTierInfo(pulse_score);
  const nextTier = TIER_THRESHOLDS.find((t) => t.min > tierInfo.min) ?? null;
  const pts_to_next_tier = nextTier ? nextTier.min - pulse_score : null;
  const progress_pct = getProgressPct(pulse_score);

  // Compute city percentile rank
  let city_rank_percent: number | null = null;
  let city_rank_label: string | null = null;

  if (location_city) {
    const [{ count: betterCount }, { count: totalCount }] = await Promise.all([
      supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("location_city", location_city)
        .gt("pulse_score", pulse_score),
      supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("location_city", location_city)
        .gt("pulse_score", 0),
    ]);

    if (totalCount && totalCount > 1) {
      // percentile = what % of city users this user is ahead of
      const pct = Math.round((1 - (betterCount ?? 0) / totalCount) * 100);
      city_rank_percent = Math.max(1, Math.min(99, pct));
      city_rank_label = `Top ${city_rank_percent}% in ${location_city}`;
    }
  }

  return NextResponse.json({
    pulse_score,
    pulse_tier: tierInfo.label,
    pulse_tier_slug: tierInfo.slug,
    pulse_points_balance,
    progress_pct,
    pts_to_next_tier,
    next_tier_label: nextTier?.label ?? null,
    city: location_city,
    city_rank_percent,
    city_rank_label,
  });
}
