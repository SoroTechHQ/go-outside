// Deprecated — kept for backward compat. Delegates to canonical social service.
// Use /api/social/follows instead.
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  resolveUserIdFromClerkId,
  followUser,
  unfollowUser,
  getFollowStatus,
} from "../../../../../lib/social/follows";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: targetUserId } = await params;

  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const viewerId = await resolveUserIdFromClerkId(clerk.id);
  if (!viewerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (viewerId === targetUserId) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const { error } = await followUser(viewerId, targetUserId);
  if (error) return NextResponse.json({ error }, { status: 400 });

  return NextResponse.json({ following: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: targetUserId } = await params;

  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const viewerId = await resolveUserIdFromClerkId(clerk.id);
  if (!viewerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await unfollowUser(viewerId, targetUserId);
  if (error) return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json({ following: false });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: targetUserId } = await params;

  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ following: false });

  const viewerId = await resolveUserIdFromClerkId(clerk.id);
  if (!viewerId) return NextResponse.json({ following: false });

  const status = await getFollowStatus(viewerId, targetUserId);
  return NextResponse.json(status);
}
