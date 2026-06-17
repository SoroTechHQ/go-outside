import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { resolveUserIdFromClerkId, followUser, unfollowUser } from "../../../../lib/social/follows";

// POST /api/social/follows — follow a user
export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { targetUserId?: string };
  if (!body.targetUserId) {
    return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
  }

  const viewerId = await resolveUserIdFromClerkId(clerk.id);
  if (!viewerId) return NextResponse.json({ error: "Account not fully set up" }, { status: 400 });

  const { error } = await followUser(viewerId, body.targetUserId);
  if (error) return NextResponse.json({ error }, { status: 400 });

  return NextResponse.json({ following: true, mutual: false });
}

// DELETE /api/social/follows — unfollow a user
export async function DELETE(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { targetUserId?: string };
  if (!body.targetUserId) {
    return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
  }

  const viewerId = await resolveUserIdFromClerkId(clerk.id);
  if (!viewerId) return NextResponse.json({ error: "Account not fully set up" }, { status: 400 });

  const { error } = await unfollowUser(viewerId, body.targetUserId);
  if (error) return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json({ following: false });
}
