import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getChatWithMessages, deleteChat } from "../../../../../lib/ai-core/chat-history";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { chat, messages } = await getChatWithMessages(id, clerk.id);
  if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ chat, messages });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ok = await deleteChat(id, clerk.id);
  return NextResponse.json({ ok });
}
