import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";

// Store push subscription endpoint in users.push_subscriptions JSONB column.
// Falls back gracefully if the column doesn't exist yet.

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { subscription } = (await req.json()) as { subscription: PushSubscriptionJSON };
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    // Upsert: store subscription keyed by endpoint so multiple devices work
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("push_subscriptions")
      .eq("clerk_id", clerk.id)
      .single();

    const existing = (user?.push_subscriptions as Record<string, unknown> | null) ?? {};
    const updated = { ...existing, [subscription.endpoint]: subscription };

    await supabaseAdmin
      .from("users")
      .update({ push_subscriptions: updated })
      .eq("clerk_id", clerk.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/notifications/push-subscribe]", err);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { endpoint } = (await req.json()) as { endpoint: string };

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("push_subscriptions")
      .eq("clerk_id", clerk.id)
      .single();

    const existing = (user?.push_subscriptions as Record<string, unknown> | null) ?? {};
    delete existing[endpoint];

    await supabaseAdmin
      .from("users")
      .update({ push_subscriptions: existing })
      .eq("clerk_id", clerk.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/notifications/push-subscribe]", err);
    return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
  }
}
