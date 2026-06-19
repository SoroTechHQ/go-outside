import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sessionId } = await params;

  try {
    const client = await clerkClient();

    const sessions = await client.sessions.getSessionList({ userId, status: "active" });
    const owns = sessions.data.some((s) => s.id === sessionId);
    if (!owns) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await client.sessions.revokeSession(sessionId);

    return NextResponse.json({ revoked: true });
  } catch (err) {
    console.error("[account/sessions DELETE]", err);
    return NextResponse.json({ error: "Failed to revoke session" }, { status: 500 });
  }
}
