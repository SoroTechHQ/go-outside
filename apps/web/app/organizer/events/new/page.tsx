import { supabaseAdmin } from "../../../../lib/supabase";
import { QuickCreateClient } from "./QuickCreateClient";

export default async function OrganizerNewEventPage() {
  const { data: cats } = await supabaseAdmin
    .from("categories")
    .select("id, name, slug")
    .order("name");

  const categories = (cats ?? []) as { id: string; name: string; slug: string }[];

  return (
    <div className="min-h-full bg-[var(--bg-elevated)]">
      <QuickCreateClient categories={categories} />
    </div>
  );
}
