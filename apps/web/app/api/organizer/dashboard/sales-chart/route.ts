import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getOrganizerDashboardData } from "../../../../../app/organizer/_lib/dashboard";
import { supabaseAdmin } from "../../../../../lib/supabase";

export async function GET() {
  const clerk = await currentUser();
  if (!clerk) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.role !== "organizer" && user.role !== "admin") {
    return NextResponse.json({ error: "Organizer access required" }, { status: 403 });
  }

  const dashboard = await getOrganizerDashboardData(user.id);
  if (!dashboard) {
    return NextResponse.json({ error: "Organizer profile not found" }, { status: 404 });
  }

  return NextResponse.json({ points: dashboard.salesSeries });
}
