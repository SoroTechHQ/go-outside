import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function GET(req: NextRequest) {
  const authCookie = req.cookies.get("go_admin_auth");

  if (!authCookie || authCookie.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("waitlist_signups")
    .select("id, email, name, phone, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Signups fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch signups." }, { status: 500 });
  }

  return NextResponse.json({ signups: data });
}
