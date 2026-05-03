import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { enforceSameOrigin, jsonError } from "../../../../lib/api-security";

async function slugify(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return jsonError(401, "Unauthorized");

  const csrf = enforceSameOrigin(req);
  if (csrf) return csrf;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!user) return jsonError(404, "User not found");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON");
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return jsonError(400, "title is required");

  const slug = await slugify(title);

  const isFree    = body.ticket_type !== "paid";
  const ticketPrice = isFree ? 0 : (typeof body.ticket_price === "number" ? body.ticket_price : 0);
  const privacy     = typeof body.privacy === "string" ? body.privacy : "public";
  const startDt     = typeof body.start_datetime === "string" ? body.start_datetime : null;
  const location    = typeof body.location === "string" ? body.location.trim() : null;
  const description = typeof body.description === "string" ? body.description.trim() : null;
  const bannerUrl   = typeof body.banner_url === "string" ? body.banner_url.trim() : null;

  const { data: event, error } = await supabaseAdmin
    .from("events")
    .insert({
      organizer_id:      user.id,
      title,
      slug,
      slug_v2:           slug,
      description,
      banner_url:        bannerUrl,
      start_datetime:    startDt,
      custom_location:   location,
      is_free:           isFree,
      price:             isFree ? null : ticketPrice,
      status:            privacy === "public" ? "published" : "draft",
      visibility:        privacy,
      tags:              [],
    })
    .select("id, slug")
    .single();

  if (error) {
    console.error("[events/host] insert error", error);
    return jsonError(500, "Failed to create event");
  }

  return NextResponse.json({ id: event.id, slug: event.slug });
}
