import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { category?: string; partial?: string };
  try { body = await req.json(); } catch { body = {}; }

  const groqKey = process.env.GROQ_API_KEY_PROD_1 ?? process.env.GROQ_API_KEY;
  if (!groqKey) return NextResponse.json({ suggestions: [] });

  const prompt = `You are an event naming assistant for GoOutside, a Ghanaian social event platform. Generate 6 creative, punchy event name suggestions for a${body.category ? ` "${body.category}"` : "n"} event in Ghana${body.partial ? ` inspired by the partial title: "${body.partial}"` : ""}. Return ONLY a JSON array of 6 strings. No explanation, no markdown, just the JSON array. Examples of good names: "Afrobeats Night Vol. 8", "Accra Art Summit 2026", "Highlife & Vibes — Kumasi Edition", "PANAFEST Street Food Carnival".`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.9,
      }),
    });
    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "[]";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const suggestions = jsonMatch ? (JSON.parse(jsonMatch[0]) as string[]).slice(0, 6) : [];
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
