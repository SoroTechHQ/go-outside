import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getStreamServerClient } from "../../../../lib/stream";

const DEMO_USERS = [
  {
    id: "demo_kofi_asante",
    name: "Kofi Asante",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&w=96&h=96&fit=crop&crop=faces",
  },
  {
    id: "demo_ama_owusu",
    name: "Ama Owusu",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&w=96&h=96&fit=crop&crop=faces",
  },
  {
    id: "demo_kwame_boateng",
    name: "Kwame Boateng",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&w=96&h=96&fit=crop&crop=faces",
  },
];

const DEMO_THREADS: Record<string, { text: string; sender: string }[]> = {
  demo_kofi_asante: [
    { sender: "demo_kofi_asante", text: "Yo, you going to the Ga Rooftop After Hours thing Saturday?" },
    { sender: "demo_kofi_asante", text: "I heard the lineup is crazy this year 🔥" },
  ],
  demo_ama_owusu: [
    { sender: "demo_ama_owusu", text: "Hey! I saw you saved the Kwahu Easter House event" },
    { sender: "demo_ama_owusu", text: "A few of us are thinking of going together, wanna join?" },
    { sender: "demo_ama_owusu", text: "It's going to be such a vibe ✨" },
  ],
  demo_kwame_boateng: [
    { sender: "demo_kwame_boateng", text: "Bro the Sankofa Sessions tickets just dropped" },
    { sender: "demo_kwame_boateng", text: "Early bird is only 80 cedis, grab them before they're gone" },
    { sender: "demo_kwame_boateng", text: "I already got mine 🎫" },
  ],
};

export async function GET() {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const client = getStreamServerClient();

    // 1. Upsert the real user
    const realUser = {
      id: clerk.id,
      name: [clerk.firstName, clerk.lastName].filter(Boolean).join(" ").trim() || "GoOutside User",
      image: clerk.imageUrl || undefined,
    };
    await client.upsertUser(realUser);

    // 2. Upsert demo users
    await client.upsertUsers(DEMO_USERS);

    // 3. Create a DM channel per demo user and send seed messages
    const created: string[] = [];

    for (const demo of DEMO_USERS) {
      const channelId = [clerk.id, demo.id].sort().join("__").replace(/[^a-zA-Z0-9_-]/g, "_");

      const channel = client.channel("messaging", channelId, {
        members: [clerk.id, demo.id],
        created_by_id: demo.id,
      });

      await channel.create();

      const messages = DEMO_THREADS[demo.id] ?? [];
      for (const msg of messages) {
        await channel.sendMessage({ text: msg.text, user_id: msg.sender });
        // small delay to preserve ordering
        await new Promise((r) => setTimeout(r, 80));
      }

      created.push(channelId);
    }

    return NextResponse.json({
      ok: true,
      message: `Seeded ${created.length} demo conversations for ${realUser.name}.`,
      channels: created,
    });
  } catch (err) {
    console.error("[GET /api/chat/seed]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
