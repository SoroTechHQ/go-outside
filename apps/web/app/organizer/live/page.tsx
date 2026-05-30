import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "../../../lib/supabase";
import { LiveAttendeesClient } from "./LiveAttendeesClient";

export const dynamic = "force-dynamic";

export default async function OrganizerLivePage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  // Get organizer's Supabase user
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (!user) redirect("/sign-in");

  // Get their active/upcoming events (within live window: started up to 5h ago or starting soon)
  const windowEnd   = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(); // 3h from now
  const windowStart = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(); // 5h ago

  const { data: events } = await supabaseAdmin
    .from("events")
    .select("id, title")
    .eq("organizer_id", user.id)
    .eq("status", "published")
    .gte("end_datetime", windowStart)
    .lte("start_datetime", windowEnd)
    .order("start_datetime", { ascending: true });

  const liveEvents = (events ?? []) as { id: string; title: string }[];

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-[2rem] font-bold tracking-[-0.04em] text-[var(--text-primary)]">
          Live Attendees
        </h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Real-time GPS presence of attendees at your events. Updates every 15 seconds.
        </p>
      </div>

      {liveEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--home-border)] py-20">
          <p className="text-[1.1rem] font-semibold text-[var(--text-secondary)]">No active events right now</p>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Live data appears 3 hours before your event starts and ends 5 hours after it finishes.
          </p>
        </div>
      ) : (
        <LiveAttendeesClient events={liveEvents} />
      )}
    </div>
  );
}
