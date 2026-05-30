import { cookies } from "next/headers";
import { supabaseAdmin } from "../../lib/supabase";
import { PasswordGate } from "../ad-waitlist/AdminClient";
import { AlphaAdminClient } from "./AlphaAdminClient";

export const dynamic = "force-dynamic";

export default async function AlphaAdminPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("go_admin_auth")?.value === "authenticated";

  if (!isAuthenticated) {
    return <PasswordGate />;
  }

  const [{ data: testers }, { data: feedback }, { data: founding }] = await Promise.all([
    supabaseAdmin
      .from("alpha_testers")
      .select("id, email, name, phone, status, invited_at, joined_at, notes, user_id")
      .order("invited_at", { ascending: false }),

    supabaseAdmin
      .from("alpha_feedback")
      .select("id, type, rating, message, page_url, created_at, user_id, screenshot_url")
      .order("created_at", { ascending: false })
      .limit(100),

    supabaseAdmin
      .from("users")
      .select("id, email, first_name, last_name, is_founding_member, pulse_points_balance")
      .eq("is_founding_member", true)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <AlphaAdminClient
      testers={testers ?? []}
      feedback={feedback ?? []}
      founding={founding ?? []}
    />
  );
}
