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
    <div>
      {/* ── Hero header ──────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 md:p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, var(--brand), transparent 70%)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: "radial-gradient(var(--text-primary) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand)] opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--brand)]" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Live</p>
        </div>
        <h1 className="relative mt-1 text-[1.5rem] font-bold tracking-tight text-[var(--text-primary)]">Live Attendees</h1>
        <p className="relative mt-1 text-[13px] text-[var(--text-secondary)]">Real-time GPS presence at your events. Updates every 15 seconds.</p>
      </div>

      <div className="p-5 md:p-7">
        {liveEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[22px] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] py-20 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-muted)]" style={{ color: "var(--text-tertiary)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
            </span>
            <p className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">No active events right now</p>
            <p className="mt-2 max-w-xs text-[13px] text-[var(--text-secondary)]">
              Live data appears 3 hours before your event starts and ends 5 hours after it finishes.
            </p>
          </div>
        ) : (
          <LiveAttendeesClient events={liveEvents} />
        )}
      </div>
    </div>
  );
}
