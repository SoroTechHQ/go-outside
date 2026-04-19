import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSavedEvents } from "../../../../lib/db/saved";
import { getSupabaseUserIdByClerkId } from "../../../../lib/db/users";

// GET /api/events/saved — returns the current user's saved events
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json([], { status: 200 });

  const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
  if (!supabaseUserId) return NextResponse.json([], { status: 200 });

  const savedEvents = await getSavedEvents(supabaseUserId);
  return NextResponse.json(savedEvents);
}
