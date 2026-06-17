import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { resolveUserIdFromClerkId } from "../../../../lib/social/follows";
import { getSocialActivity } from "../../../../lib/social/activity";
import type { FeedMode } from "../../../../lib/social/types";

// GET /api/social/activity?mode=following|plans|profile&cursor=
export async function GET(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ items: [], nextCursor: null });

  const { searchParams } = req.nextUrl;
  const mode = (searchParams.get("mode") ?? "following") as "following" | "plans" | "profile";
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);

  const viewerId = await resolveUserIdFromClerkId(clerk.id);
  if (!viewerId) return NextResponse.json({ items: [], nextCursor: null });

  const result = await getSocialActivity({ viewerId, mode, cursor, limit });
  return NextResponse.json(result);
}
