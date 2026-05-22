import { NextResponse } from "next/server";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { Resend } from "resend";
import { getOrCreateSupabaseUser } from "../../../../../lib/db/users";
import { supabaseAdmin } from "../../../../../lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: targetUserId } = await params;

  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await getOrCreateSupabaseUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.id === targetUserId) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("follows")
    .upsert({ follower_id: me.id, following_id: targetUserId }, { onConflict: "follower_id,following_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Write behavioral signal to graph_edges for recommendation engine
  void supabaseAdmin
    .from("graph_edges")
    .insert({
      from_id: me.id,
      from_type: "user",
      to_id: targetUserId,
      to_type: "user",
      edge_type: "follows",
      weight: 1.0,
      is_active: true,
    })
    .then(({ error }) => {
      if (error && error.code !== "23505") console.error("[graph_edges follow insert]", error);
    });

  // Create a notification for the target user
  void supabaseAdmin.from("notifications").insert({
    user_id: targetUserId,
    type: "new_follower",
    title: "New follower",
    body: `${me.first_name} ${me.last_name} started following you.`,
    is_read: false,
  });

  // Send follow notification email (fire-and-forget)
  void (async () => {
    try {
      const { data: targetUser } = await supabaseAdmin
        .from("users")
        .select("clerk_id, first_name")
        .eq("id", targetUserId)
        .single();
      if (!targetUser?.clerk_id) return;

      const client = await clerkClient();
      const clerkUser = await client.users.getUser(targetUser.clerk_id);
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (!email) return;

      const followerName = `${me.first_name} ${me.last_name ?? ""}`.trim();
      await resend.emails.send({
        from: "GoOutside <noreply@gooutside.app>",
        to:   email,
        subject: `${followerName} is now following you on GoOutside`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#0e2212">You have a new follower!</h2>
            <p><strong>${followerName}</strong> started following you on GoOutside.</p>
            <a href="https://gooutside.app/home" style="display:inline-block;background:#4a9f63;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;margin-top:16px">Open GoOutside</a>
          </div>
        `,
      });
    } catch {
      // non-critical — swallow errors
    }
  })();

  return NextResponse.json({ following: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: targetUserId } = await params;

  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await getOrCreateSupabaseUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ error }] = await Promise.all([
    supabaseAdmin.from("follows").delete()
      .eq("follower_id", me.id).eq("following_id", targetUserId),
    supabaseAdmin.from("graph_edges").delete()
      .eq("from_id", me.id).eq("to_id", targetUserId).eq("edge_type", "follows"),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ following: false });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: targetUserId } = await params;

  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ following: false });

  const me = await getOrCreateSupabaseUser();
  if (!me) return NextResponse.json({ following: false });

  const { data } = await supabaseAdmin
    .from("follows")
    .select("id")
    .eq("follower_id", me.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  return NextResponse.json({ following: !!data });
}
