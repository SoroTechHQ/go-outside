import Link from "next/link";
import { getCategories } from "../../lib/db/categories";
import { searchEvents } from "../../lib/db/events";
import { getOrganizers } from "../../lib/db/organizers";
import { Button, EventCard, ShellCard, StatusPill } from "@gooutside/ui";
import type { Category, Organizer } from "@gooutside/demo-data";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params   = await searchParams;
  const q        = typeof params.q === "string" ? params.q : undefined;
  const category = typeof params.category === "string" ? params.category : undefined;

  const [events, categories, organizers] = await Promise.all([
    searchEvents({ query: q, category }),
    getCategories(),
    getOrganizers(),
  ]);

  const organizerMap = new Map<string, Organizer>(organizers.map((o) => [o.id, o]));
  const categoryMap  = new Map<string, Category>(categories.map((c) => [c.slug, c]));

  return (
    <main className="page-grid min-h-screen pb-36 md:pb-24">
      <section className="container-shell px-4 py-8 md:py-10">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--neon)]">
          Search
        </div>
        <h1 className="font-display text-3xl italic text-[var(--text-primary)] md:text-5xl">
          {q ? `Results for "${q}"` : "Explore all events"}
        </h1>

        <div className="mt-6 grid gap-6 md:mt-8 xl:grid-cols-[280px,1fr]">
          <aside className="space-y-5">
            <ShellCard>
              <h2 className="font-display text-3xl italic text-[var(--text-primary)]">
                Categories
              </h2>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={q ? `/search?q=${q}` : "/search"}>
                  <StatusPill
                    className={!category ? "ring-1 ring-[var(--neon)]" : ""}
                    tone="draft"
                  >
                    All
                  </StatusPill>
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={
                      q
                        ? `/search?q=${q}&category=${cat.slug}`
                        : `/search?category=${cat.slug}`
                    }
                  >
                    <StatusPill
                      className={category === cat.slug ? "ring-1 ring-[var(--neon)]" : ""}
                      tone="draft"
                    >
                      {cat.name}
                    </StatusPill>
                  </Link>
                ))}
              </div>
            </ShellCard>
          </aside>

          <div>
            <div className="mb-6">
              <h2 className="font-display text-3xl italic text-[var(--text-primary)]">
                {events.length} event{events.length !== 1 ? "s" : ""} found
              </h2>
            </div>

            {events.length === 0 ? (
              <ShellCard className="py-12 text-center">
                <h3 className="font-display text-3xl italic text-[var(--text-primary)]">
                  No events found
                </h3>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  Try removing some filters or broadening your search.
                </p>
                <div className="mt-6 flex justify-center">
                  <Button href="/events">Browse all events</Button>
                </div>
              </ShellCard>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
                {events.map((event) => {
                  const eventCategory = categoryMap.get(event.categorySlug) ?? {
                    slug: event.categorySlug,
                    name: event.eyebrow,
                    iconKey: "calendar",
                    description: "",
                  };
                  const organizer = organizerMap.get(event.organizerId);
                  return organizer ? (
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
