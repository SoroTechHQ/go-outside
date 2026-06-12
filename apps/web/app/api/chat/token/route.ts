import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getStreamServerClient } from "../../../../lib/stream";
import { supabaseAdmin } from "../../../../lib/supabase";

const STREAM_USER_SYNC_TTL_MS = 5 * 60 * 1000;

type CachedStreamUser = {
  image?: string;
  name: string;
  syncedAt: number;
  username?: string;
};

const streamUserSyncCache = new Map<string, CachedStreamUser>();

function shouldSyncStreamUser(
  clerkId: string,
  next: Omit<CachedStreamUser, "syncedAt">,
) {
  const cached = streamUserSyncCache.get(clerkId);
  if (!cached) return true;
  if (Date.now() - cached.syncedAt > STREAM_USER_SYNC_TTL_MS) return true;
  return cached.name !== next.name || cached.image !== next.image || cached.username !== next.username;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json().catch(() => ({}))) as {
      image?: string | null;
      name?: string;
      username?: string | null;
    };

    let name = body.name?.trim() || "";
    let image = body.image ?? undefined;
    let username = body.username ?? undefined;

    if (!name) {
      const clerk = await currentUser();
      const { data: dbUser } = await supabaseAdmin
        .from("users")
        .select("first_name, last_name, avatar_url, username")
        .eq("clerk_id", userId)
        .maybeSingle();

      name =
        [dbUser?.first_name, dbUser?.last_name].filter(Boolean).join(" ").trim() ||
        [clerk?.firstName, clerk?.lastName].filter(Boolean).join(" ").trim() ||
        clerk?.username ||
        "GoOutside User";
      image = dbUser?.avatar_url ?? clerk?.imageUrl ?? undefined;
      username = dbUser?.username ?? clerk?.username ?? undefined;
    }

    const serverClient = getStreamServerClient();
    const streamUser = { name, image, username };

    if (shouldSyncStreamUser(userId, streamUser)) {
      await serverClient.upsertUser({
        id: userId,
        name,
        ...(image ? { image } : {}),
        ...(username ? { username } : {}),
      });
      streamUserSyncCache.set(userId, { ...streamUser, syncedAt: Date.now() });
    }

    // Token valid for 24 h — short enough to limit exposure, long enough for a session
    const expiry = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
    const token = serverClient.createToken(userId, expiry);

    return NextResponse.json({ token, user: { id: userId, name, image: image ?? null, username: username ?? null } });
  } catch (err) {
    console.error("[POST /api/chat/token]", err);
    return NextResponse.json({ error: "Could not create chat token." }, { status: 500 });
  }
}
