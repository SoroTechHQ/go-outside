import { cookies } from "next/headers";
import { supabaseAdmin } from "../../lib/supabase";
import { PasswordGate, SignupsTable } from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminWaitlistPage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("go_admin_auth");
  const isAuthenticated = authCookie?.value === "authenticated";

  if (!isAuthenticated) {
    return <PasswordGate />;
  }

  // Fetch signups server-side
  const { data: signups, error } = await supabaseAdmin
    .from("waitlist_signups")
    .select("id, email, name, phone, role, created_at, email_sent")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch signups:", error);
  }

  return <SignupsTable initialSignups={signups ?? []} />;
}
