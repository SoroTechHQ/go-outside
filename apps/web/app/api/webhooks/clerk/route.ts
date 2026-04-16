import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

/**
 * Clerk → Supabase user sync webhook.
 *
 * In the Clerk dashboard:
 *   Webhooks → Add Endpoint → https://yourapp.com/api/webhooks/clerk
 *   Events: user.created, user.updated, user.deleted
 *
 * Add CLERK_WEBHOOK_SECRET to .env.local.
 * For local dev: use `npx ngrok http 3000` and update the endpoint URL.
 */

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
  // Signature verification (requires `svix` package + CLERK_WEBHOOK_SECRET)
  // For now we check a shared secret header as a simpler guard
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (webhookSecret) {
    const headerSecret = req.headers.get("x-clerk-secret");
    if (headerSecret !== webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const event = (await req.json()) as ClerkUserEvent;
  const { type, data } = event;

  const primaryEmail = data.email_addresses.find(
    (e) => e.id === data.primary_email_address_id
  );

  if (type === "user.created") {
    await supabaseAdmin.from("users").insert({
      clerk_id:   data.id,
      email:      primaryEmail?.email_address ?? "",
      first_name: data.first_name ?? "User",
      last_name:  data.last_name ?? "",
      avatar_url: data.image_url ?? null,
      role:       "attendee",
    });
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
