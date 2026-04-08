import {
  categories,
  demoData,
  getCategoryBySlug,
  getOrganizerById,
  filterEvents,
} from "@gooutside/demo-data";
import { Button, EventCard, SectionHeader, ShellCard, StatusPill } from "@gooutside/ui";
import { PublicHeader } from "../../components/public-header";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const city = typeof params.city === "string" ? params.city : undefined;
  const category = typeof params.category === "string" ? params.category : undefined;
  const price = typeof params.price === "string" ? params.price : undefined;
  const query = typeof params.q === "string" ? params.q : undefined;

  const filteredEvents = filterEvents({
    city,
    category,
    price,
    query,
  });

  return (
    <main className="pb-20">
      <PublicHeader />

      <section className="container-shell py-10">
        <SectionHeader
          description="This discovery page is intentionally feed-shaped: filters stay lightweight, the card stack stays visual, and the route supports dummy query-state from static demo data."
          eyebrow="Discover"
          index="03"
          title="What is moving through the city right now"
        />

        <div className="mt-8 grid gap-6 xl:grid-cols-[280px,1fr]">
          <aside className="space-y-5">
            <ShellCard>
              <h2 className="font-display text-3xl italic text-[var(--text-primary)]">Filters</h2>
              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                    Cities
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusPill className={!city ? "ring-1 ring-[var(--neon)]" : ""} tone="draft">
                      All cities
                    </StatusPill>
                    {demoData.platform.cities.map((item) => (
                      <StatusPill
                        key={item}
                        className={city === item ? "ring-1 ring-[var(--neon)]" : ""}
                        tone="draft"
                      >
                        {item}
                      </StatusPill>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                    Categories
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusPill className={!category ? "ring-1 ring-[var(--neon)]" : ""} tone="draft">
                      All
                    </StatusPill>
                    {categories.map((item) => (
                      <StatusPill
                        key={item.slug}
                        className={category === item.slug ? "ring-1 ring-[var(--neon)]" : ""}
                        tone="draft"
                      >
                        {item.name}
                      </StatusPill>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                    Pricing
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["all", "free", "paid"].map((item) => (
                      <StatusPill
                        key={item}
                        className={(price ?? "all") === item ? "ring-1 ring-[var(--neon)]" : ""}
                        tone="draft"
                      >
                        {item}
                      </StatusPill>
                    ))}
                  </div>
                </div>
              </div>
            </ShellCard>

            <ShellCard>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--neon)]">
                Dummy mode
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                This feed is frontend-only. Cards, filters, and ranking shelves all read from the
                shared demo dataset so you can refine the interaction model before API wiring.
              </p>
            </ShellCard>
          </aside>

          <div>
            <form action="/events" method="get" className="mb-6">
              <input
                name="q"
                defaultValue={query ?? ""}
                placeholder="Search events..."
                className="bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-[10px] px-4 py-3 text-sm w-full text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
              />
            </form>

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl italic text-[var(--text-primary)]">
                  {filteredEvents.length} events found
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Social-first discovery with hospitality-style detail density.
                </p>
              </div>
              <Button href="/dashboard" variant="ghost">
                Open attendee dashboard
              </Button>
            </div>

            {filteredEvents.length === 0 ? (
              <ShellCard className="py-12 text-center">
                <h3 className="font-display text-3xl italic text-[var(--text-primary)]">No events found</h3>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">Try removing some filters or broadening your search.</p>
                <div className="mt-6 flex justify-center">
                  <Button href="/events">Reset filters</Button>
                </div>
              </ShellCard>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
                {filteredEvents.map((event) => {
                  const eventCategory = getCategoryBySlug(event.categorySlug);
                  const organizer = getOrganizerById(event.organizerId);
                  return eventCategory && organizer ? (
                    <EventCard
                      key={event.id}
                      category={eventCategory}
                      event={event}
                      organizer={organizer}
                    />
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
