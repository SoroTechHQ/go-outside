import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY_PROD_1 ?? process.env.GROQ_API_KEY });

type Tier = { name: string; price: number; description: string };

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, category, description } = await req.json() as {
    title?: string;
    category?: string;
    description?: string;
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const prompt = `You are helping a Ghana event organizer set up ticket tiers.

Event: "${title}"
Category: ${category ?? "General"}
Description: ${description?.trim() ? `"${description}"` : "not provided"}

Suggest 2–4 ticket tiers appropriate for this event. Use realistic Ghanaian pricing in GHS.
Rules:
- Prices must be whole numbers in GHS
- Common Ghana event tiers: Free, Regular, General Admission, VIP, VVIP, Early Bird, Table
- Description max 55 characters
- If the event sounds like it should be free (community, church, school), suggest Free Entry
- VIP should be 2–4× the GA price
- Early Bird ~20–30% cheaper than GA

Respond with ONLY valid JSON, no explanation:
{"tiers":[{"name":"...","price":0,"description":"..."}]}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    // Extract JSON even if the model wraps it in markdown
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]) as { tiers?: Tier[] };
    const tiers = (parsed.tiers ?? []).filter(
      (t): t is Tier =>
        typeof t.name === "string" &&
        typeof t.price === "number" &&
        typeof t.description === "string",
    );

    return NextResponse.json({ tiers });
  } catch (err) {
    console.error("[POST /api/ai/tickets]", err);
    return NextResponse.json({ error: "AI suggestion failed" }, { status: 500 });
  }
}
