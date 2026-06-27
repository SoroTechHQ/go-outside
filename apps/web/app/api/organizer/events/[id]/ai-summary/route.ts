import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await params; // satisfy Next.js dynamic param resolution

  let body: { description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const description = (body.description ?? "").trim();
  if (!description) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY_PROD_1 ?? process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      max_tokens: 60,
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content:
            "You write punchy, one-sentence event summaries (max 160 characters) for GoOutside, an event discovery app in Ghana. Be vivid and specific. No quotes, no hashtags.",
        },
        {
          role: "user",
          content: `Summarise this event in one sentence (max 160 chars):\n\n${description.slice(0, 1200)}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const summary = json.choices?.[0]?.message?.content?.trim() ?? "";
  return NextResponse.json({ summary: summary.slice(0, 200) });
}
