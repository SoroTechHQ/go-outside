import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../../lib/supabase";

const TIER_THRESHOLDS = [
  { tier: "Legend",      min: 2000 },
  { tier: "City Native", min: 1000 },
  { tier: "Scene Kid",   min: 600  },
  { tier: "Regular",     min: 300  },
  { tier: "Explorer",    min: 100  },
  { tier: "Newcomer",    min: 0    },
];

function getTier(score: number) {
  return TIER_THRESHOLDS.find((t) => score >= t.min)?.tier ?? "Newcomer";
}

export async function GET() {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("users")
    .select("pulse_score, pulse_tier")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  const pulse_score = (data as { pulse_score?: number } | null)?.pulse_score ?? 0;
  const pulse_tier  = (data as { pulse_tier?: string } | null)?.pulse_tier ?? getTier(pulse_score);

  return NextResponse.json({ pulse_score, pulse_tier });
}
