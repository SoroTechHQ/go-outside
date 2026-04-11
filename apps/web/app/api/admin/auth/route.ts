import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: "Password required." }, { status: 400 });
    }

    // Fetch plain-text password from Supabase admin_config table
    const { data, error } = await supabaseAdmin
      .from("admin_config")
      .select("value")
      .eq("key", "waitlist_password")
      .single();

    if (error || !data) {
      console.error("Config fetch error:", error);
      return NextResponse.json({ error: "Server error." }, { status: 500 });
    }

    if (password !== data.value) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    // Set auth cookie
    const res = NextResponse.json({ success: true });
    res.cookies.set("go_admin_auth", "authenticated", {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("Admin auth error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete("go_admin_auth");
  return res;
}
