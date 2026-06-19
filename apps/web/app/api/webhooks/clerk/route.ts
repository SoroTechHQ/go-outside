import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { supabaseAdmin } from "../../../../lib/supabase";
import { sendNewSignInEmail } from "../../../../lib/email";
import { insertNotification } from "../../../../lib/db/insert-notification";

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

type ClerkUserEventData = {
  type: "user.created" | "user.updated" | "user.deleted";
  data: {
    id:                       string;
    email_addresses:          ClerkEmailAddress[];
    primary_email_address_id: string;
    first_name:               string | null;
    last_name:                string | null;
    image_url:                string | null;
  };
};

type ClerkSessionEventData = {
  type: "session.created";
  data: {
    id:             string;
    user_id:        string;
    status:         string;
    last_active_at: number;
    created_at:     number;
    client_id:      string;
  };
};

type ClerkUserEvent = ClerkUserEventData | ClerkSessionEventData;

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

  const { type } = event;

  if (type === "session.created") {
    const sessionData = (event as ClerkSessionEventData).data;
    const clerkUserId = sessionData.user_id;

    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("id, email, notification_prefs")
      .eq("clerk_id", clerkUserId)
      .maybeSingle();

    if (userRow) {
      const prefs = (userRow as { notification_prefs?: Record<string, unknown> }).notification_prefs ?? {};
      const emailEnabled = (prefs as { email?: boolean }).email !== false;

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentNotif } = await supabaseAdmin
        .from("notifications")
        .select("id")
        .eq("user_id", (userRow as { id: string }).id)
        .eq("type", "new_sign_in")
        .gte("created_at", fiveMinutesAgo)
        .limit(1)
        .maybeSingle();

      if (!recentNotif) {
        const now = new Date();
        const timeStr = now.toLocaleString("en-GB", {
          timeZone: "Africa/Accra",
          day:   "2-digit",
          month: "short",
          year:  "numeric",
          hour:  "2-digit",
          minute: "2-digit",
        }) + " GMT";

        const notifBody = `Device: GoOutside app · Location: Ghana · ${timeStr}`;

        insertNotification({
          userId:     (userRow as { id: string }).id,
          type:       "new_sign_in",
          title:      "New sign-in to your account",
          body:       notifBody,
          actionHref: "/settings",
          data:       { device: "GoOutside app", location: "Ghana", time: timeStr },
        });

        if (emailEnabled && (userRow as { email?: string }).email) {
          await sendNewSignInEmail({
            to:           (userRow as { email: string }).email,
            device:       "GoOutside app",
            browser:      "GoOutside app",
            location:     "Ghana",
            ip:           "—",
            time:         timeStr,
            signInMethod: "GoOutside account",
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  }

  const userEvent = event as ClerkUserEventData;
  const data = userEvent.data;

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
