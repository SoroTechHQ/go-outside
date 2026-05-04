import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getStreamServerClient } from "../../../../lib/stream";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json().catch(() => ({}))) as { name?: string; image?: string | null };

    // Always fetch latest name/avatar/username from Supabase so Stream stays in sync
    const { data: dbUser } = await supabaseAdmin
      .from("users")
      .select("first_name, last_name, avatar_url, username")
      .eq("clerk_id", clerk.id)
      .maybeSingle();

    const name =
      [dbUser?.first_name, dbUser?.last_name].filter(Boolean).join(" ").trim() ||
      body.name?.trim() ||
      [clerk.firstName, clerk.lastName].filter(Boolean).join(" ").trim() ||
      clerk.username ||
      "GoOutside User";

    const image = dbUser?.avatar_url ?? body.image ?? clerk.imageUrl ?? undefined;
    const username = dbUser?.username ?? clerk.username ?? undefined;

    const serverClient = getStreamServerClient();

    await serverClient.upsertUser({
      id: clerk.id,
      name,
      ...(image ? { image } : {}),
      ...(username ? { username } : {}),
    });

    // Token valid for 24 h — short enough to limit exposure, long enough for a session
    const expiry = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
    const token = serverClient.createToken(clerk.id, expiry);

    return NextResponse.json({ token, user: { id: clerk.id, name, image: image ?? null, username: username ?? null } });
  } catch (err) {
    console.error("[POST /api/chat/token]", err);
    return NextResponse.json({ error: "Could not create chat token." }, { status: 500 });
  }
}
