import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSupabaseUser } from "../../../../lib/db/users";
import { redeemRewardForUser } from "../../../../lib/db/rewards";

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { rewardId } = (await req.json()) as { rewardId?: string };
    if (!rewardId) {
      return NextResponse.json({ error: "rewardId required" }, { status: 400 });
    }

    const result = await redeemRewardForUser(user.id, rewardId);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown_error";

    if (msg === "insufficient_points") {
      return NextResponse.json({ error: "Not enough Pulse Points" }, { status: 422 });
    }
    if (msg === "reward_sold_out") {
      return NextResponse.json({ error: "This reward is sold out" }, { status: 409 });
    }
    if (msg === "reward_not_found") {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }

    console.error("[POST /api/rewards/redeem]", err);
    return NextResponse.json({ error: "Redemption failed" }, { status: 500 });
  }
}
