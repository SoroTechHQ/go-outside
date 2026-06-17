// Deprecated — kept for backward compat. Delegates to canonical social service.
// Use /api/social/follows instead.
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  resolveUserIdFromClerkId,
  followUser,
  unfollowUser,
} from "../../../lib/social/follows";

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { targetClerkId?: string };
  if (!body.targetClerkId) {
    return NextResponse.json({ error: "targetClerkId required" }, { status: 400 });
  }
  if (body.targetClerkId === clerk.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const [fromId, toId] = await Promise.all([
    resolveUserIdFromClerkId(clerk.id),
    resolveUserIdFromClerkId(body.targetClerkId),
  ]);

  if (!fromId) return NextResponse.json({ error: "Your account is not fully set up" }, { status: 400 });
  if (!toId) return NextResponse.json({ error: "Target user not found" }, { status: 404 });

  const { error } = await followUser(fromId, toId);
  if (error) return NextResponse.json({ error }, { status: 400 });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { targetClerkId?: string };
  if (!body.targetClerkId) {
    return NextResponse.json({ error: "targetClerkId required" }, { status: 400 });
  }

  const [fromId, toId] = await Promise.all([
    resolveUserIdFromClerkId(clerk.id),
    resolveUserIdFromClerkId(body.targetClerkId),
  ]);

  if (!fromId || !toId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { error } = await unfollowUser(fromId, toId);
  if (error) return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json({ success: true });
}
