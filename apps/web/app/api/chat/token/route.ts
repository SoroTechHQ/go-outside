import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getStreamServerClient } from "../../../../lib/stream";

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json().catch(() => ({}))) as { name?: string; image?: string | null };

    const name =
      body.name?.trim() ||
      [clerk.firstName, clerk.lastName].filter(Boolean).join(" ").trim() ||
      clerk.username ||
      "GoOutside User";

    const image = body.image ?? clerk.imageUrl ?? undefined;

    const serverClient = getStreamServerClient();

    await serverClient.upsertUser({ id: clerk.id, name, ...(image ? { image } : {}) });

    const token = serverClient.createToken(clerk.id);

    return NextResponse.json({ token, user: { id: clerk.id, name, image: image ?? null } });
  } catch (err) {
    console.error("[POST /api/chat/token]", err);
    return NextResponse.json({ error: "Could not create chat token." }, { status: 500 });
  }
}
