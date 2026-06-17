import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { resolveUserIdFromClerkId, getFollowStatus } from "../../../../lib/social/follows";

// GET /api/social/follow-status?targetUserId=<uuid>
export async function GET(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) {
    return NextResponse.json({ following: false, followedBy: false, mutual: false });
  }

  const targetUserId = req.nextUrl.searchParams.get("targetUserId");
  if (!targetUserId) {
    return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
  }

  const viewerId = await resolveUserIdFromClerkId(clerk.id);
  if (!viewerId) {
    return NextResponse.json({ following: false, followedBy: false, mutual: false });
  }

  const status = await getFollowStatus(viewerId, targetUserId);
  return NextResponse.json(status);
}
