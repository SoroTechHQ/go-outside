import Link from "next/link";
import { getOrCreateSupabaseUser } from "../../lib/db/users";
import { getUserTickets } from "../../lib/db/tickets";
import { getSavedEvents } from "../../lib/db/saved";
import { getFeaturedEvents } from "../../lib/db/events";
import { getCategories } from "../../lib/db/categories";
import { getOrganizers } from "../../lib/db/organizers";
import { Button, EventCard } from "@gooutside/ui";
import { CATEGORY_EMOJIS } from "@gooutside/demo-data";
import MessagesFAB from "../../components/messages/MessagesFAB";
import type { Category, Organizer } from "@gooutside/demo-data";

export default async function DashboardPage() {
  const user = await getOrCreateSupabaseUser();

  if (!user) {
    return (
      <main className="page-grid min-h-screen pb-36 md:pb-24">
        <div className="container-shell py-20 text-center">
          <p className="text-[var(--text-secondary)]">Please sign in to view your dashboard.</p>
        </div>
      </main>
    );
  }

  const [tickets, savedEvents, featuredEvents, categories, organizers] = await Promise.all([
    getUserTickets(user.id),
    getSavedEvents(user.id),
    getFeaturedEvents(4),
    getCategories(),
    getOrganizers(),
  ]);

  const upcomingTickets = tickets.filter((t) => t.status === "active");
  const nextTicket      = upcomingTickets[0];

  const categoryMap  = new Map<string, Category>(categories.map((c) => [c.slug, c]));
  const organizerMap = new Map<string, Organizer>(organizers.map((o) => [o.id, o]));

  // Derive interests from saved + featured event categories
  const interestSlugs = Array.from(
    new Set([...savedEvents, ...featuredEvents].map((e) => e.categorySlug))
  );
  const interests = interestSlugs
    .map((slug) => categoryMap.get(slug))
    .filter((c): c is Category => Boolean(c));

  return (
    <main className="page-grid min-h-screen pb-36 md:pb-24">
      <div className="container-shell px-4 py-8 md:py-10">
        <div className="mx-auto max-w-[720px] text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[var(--brand)]">
            {user.role}
          </p>
          <h1 className="mt-4 font-display text-[2.35rem] italic text-[var(--text-primary)] md:text-[2.8rem]">
            Hey, {user.first_name}
          </h1>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            {upcomingTickets.length > 0
              ? `You have ${upcomingTickets.length} upcoming event${upcomingTickets.length !== 1 ? "s" : ""}.`
              : "Find your next night out below."}
          </p>
        </div>

        {/* ── Upcoming ticket card ─────────────────────────── */}
        <div className="mx-auto mt-10 max-w-[720px]">
          <section className="relative overflow-hidden rounded-[32px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-7 py-8 shadow-[0_18px_48px_rgba(12,18,12,0.1)] md:px-8">
            <div className="pointer-events-none absolute left-10 right-10 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--brand),transparent)] opacity-30" />

            {nextTicket ? (
              <>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--brand)]">
                  Upcoming ticket
                </p>
                <h2 className="mt-4 text-center font-display text-[2rem] italic text-[var(--text-primary)] md:text-[2.25rem]">
                  {nextTicket.calendarLabel}
                </h2>
                <p className="mx-auto mt-3 max-w-[540px] text-center text-sm leading-7 text-[var(--text-secondary)]">
                  {nextTicket.typeLabel} · {nextTicket.holderName}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {[nextTicket.status, nextTicket.typeLabel, nextTicket.reference].map((pill) => (
                    <span
                      key={pill}
                      className="rounded-full border border-[var(--border-subtle)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Button href={`/dashboard/wallets/${nextTicket.id}`}>Open Ticket</Button>
                  <Button href="/" variant="ghost">Keep Exploring</Button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="font-display text-3xl italic text-[var(--text-primary)]">
                  No upcoming events
                </p>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  Your next night out will show up here once you book.
                </p>
                <div className="mt-6">
                  <Button href="/">Explore events</Button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── Interests ────────────────────────────────────── */}
        {interests.length > 0 && (
          <section className="mx-auto mt-14 max-w-[920px]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl italic text-[var(--text-primary)]">
                  Your interests
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  The feed uses these first when it decides what rises.
                </p>
              </div>
              <Link
                className="text-sm font-semibold text-[var(--brand)]"
                href="/dashboard/profile#interests"
              >
                Edit interests →
              </Link>
            </div>
            <div className="no-scrollbar mt-5 flex gap-3 overflow-x-auto pb-1">
              {interests.map((interest) => (
                <span
                  key={interest.slug}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
                >
                  <span>{CATEGORY_EMOJIS[interest.slug] ?? "✨"}</span>
                  {interest.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Saved events ─────────────────────────────────── */}
        <section className="mx-auto mt-14 max-w-[1080px]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl italic text-[var(--text-primary)]">
                Saved events
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Events you may want to revisit before they sell out.
              </p>
            </div>
            <Link className="text-sm font-semibold text-[var(--brand)]" href="/dashboard/saved">
              See all →
            </Link>
          </div>
          {savedEvents.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">
              Tap save on any event to keep it here.
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {savedEvents.slice(0, 4).map((event) => {
                const category = categoryMap.get(event.categorySlug) ?? {
                  slug: event.categorySlug, name: event.eyebrow,
                  iconKey: "calendar", description: "",
                };
                const organizer = organizerMap.get(event.organizerId);
                return organizer ? (
                  <EventCard key={event.id} category={category} event={event} organizer={organizer} />
                ) : null;
              })}
            </div>
          )}
        </section>

        {/* ── Featured / recommendations ───────────────────── */}
        <section className="mx-auto mt-14 max-w-[1080px]">
          <div className="mb-6">
            <h2 className="font-display text-3xl italic text-[var(--text-primary)]">
              Based on your vibe
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Featured events from around Accra.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {featuredEvents.map((event) => {
              const category = categoryMap.get(event.categorySlug) ?? {
                slug: event.categorySlug, name: event.eyebrow,
                iconKey: "calendar", description: "",
              };
              const organizer = organizerMap.get(event.organizerId);
              return organizer ? (
                <EventCard key={event.id} category={category} event={event} organizer={organizer} />
              ) : null;
            })}
          </div>
        </section>
      </div>
      <MessagesFAB />
    </main>
  );
}
