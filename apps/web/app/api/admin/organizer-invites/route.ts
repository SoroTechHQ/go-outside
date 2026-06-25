import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

function isAuthed(req: NextRequest) {
  const cookie = req.cookies.get("go_admin_auth");
  return cookie?.value === "authenticated";
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("organizer_invites")
    .select("id, token, email, first_name, business_name, sender_name, invited_at, email_sent, email_sent_at, clicked_at, notes")
    .order("invited_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invites: data });
}
