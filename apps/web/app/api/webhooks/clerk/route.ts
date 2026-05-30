import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { supabaseAdmin } from "../../../../lib/supabase";

/**
 * Clerk → Supabase user sync webhook.
 *
 * In the Clerk dashboard:
 *   Webhooks → Add Endpoint → https://yourapp.com/api/webhooks/clerk
 *   Events: user.created, user.updated, user.deleted
 *
 * Add CLERK_WEBHOOK_SECRET to .env.local (from Clerk dashboard webhook signing secret).
 * For local dev: use `npx ngrok http 3000` and update the endpoint URL.
 */

export const dynamic = "force-dynamic";

type ClerkEmailAddress = {
  id:             string;
  email_address:  string;
};

type ClerkUserEvent = {
  type: string;
  data: {
    id:                       string;
    email_addresses:          ClerkEmailAddress[];
    primary_email_address_id: string;
    first_name:               string | null;
    last_name:                string | null;
    image_url:                string | null;
  };
};

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook/clerk] CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const svixId        = req.headers.get("svix-id") ?? "";
  const svixTimestamp = req.headers.get("svix-timestamp") ?? "";
  const svixSignature = req.headers.get("svix-signature") ?? "";

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();

  let event: ClerkUserEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      "svix-id":        svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserEvent;
  } catch (err) {
    console.error("[webhook/clerk] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { type, data } = event;

  const primaryEmail = data.email_addresses.find(
    (e) => e.id === data.primary_email_address_id
  );

  if (type === "user.created") {
    const email = primaryEmail?.email_address ?? "";

    // Check if a row already exists for this email (e.g. email/password → OAuth same email)
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    let supabaseUserId: string;

    if (existing) {
      // Adopt the existing profile: re-link it to the new Clerk ID
      await supabaseAdmin
        .from("users")
        .update({
          clerk_id:   data.id,
          avatar_url: data.image_url ?? null,
          first_name: data.first_name ?? "User",
          last_name:  data.last_name ?? "",
        })
        .eq("id", (existing as { id: string }).id);
      supabaseUserId = (existing as { id: string }).id;
    } else {
      const { data: newUser } = await supabaseAdmin
        .from("users")
        .insert({
          clerk_id:   data.id,
          email,
          first_name: data.first_name ?? "User",
          last_name:  data.last_name ?? "",
          avatar_url: data.image_url ?? null,
          role:       "attendee",
        })
        .select("id")
        .single();
      supabaseUserId = (newUser as { id: string } | null)?.id ?? "";
    }

    // ── Auto-award Founding Explorer if this email was pre-invited ──────────
    // When you call POST /api/alpha/invite with an email, that row lands in
    // alpha_testers (status='invited'). The moment the person actually creates
    // their account here, we award the badge + 2× PP multiplier automatically.
    if (supabaseUserId && email) {
      const { data: tester } = await supabaseAdmin
        .from("alpha_testers")
        .select("id, status")
        .eq("email", email)
        .maybeSingle();

      if (tester && tester.status === "invited") {
        // Award badge + set is_founding_member + 90-day 2× multiplier
        await supabaseAdmin.rpc("award_founding_member_badge", {
          p_user_id: supabaseUserId,
        });

        // Mark tester as active and link their user_id
        await supabaseAdmin
          .from("alpha_testers")
          .update({ status: "active", joined_at: new Date().toISOString(), user_id: supabaseUserId })
          .eq("id", tester.id);

        console.log(`[webhook/clerk] Founding Explorer awarded to ${email}`);
      }
    }
  }

  if (type === "user.updated") {
    await supabaseAdmin
      .from("users")
      .update({
        email:      primaryEmail?.email_address ?? undefined,
        first_name: data.first_name ?? undefined,
        last_name:  data.last_name ?? undefined,
        avatar_url: data.image_url ?? null,
      })
      .eq("clerk_id", data.id);
  }

  if (type === "user.deleted") {
    await supabaseAdmin.from("users").delete().eq("clerk_id", data.id);
  }

  return NextResponse.json({ received: true });
}
