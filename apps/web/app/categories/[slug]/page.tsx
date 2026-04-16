import { notFound } from "next/navigation";
import { getCategoryBySlug } from "../../../lib/db/categories";
import { getEventsByCategory } from "../../../lib/db/events";
import { getOrganizers } from "../../../lib/db/organizers";
import { AppIcon, Button, EventCard, ShellCard } from "@gooutside/ui";
import type { Organizer } from "@gooutside/demo-data";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [category, categoryEvents, organizers] = await Promise.all([
    getCategoryBySlug(slug),
    getEventsByCategory(slug),
    getOrganizers(),
  ]);

  if (!category) notFound();

  const organizerMap = new Map<string, Organizer>(organizers.map((o) => [o.id, o]));

  return (
    <main className="page-grid min-h-screen pb-24">
      <div className="h-48 bg-gradient-to-br from-[#1a2418] to-[#0e1410] flex items-center">
        <div className="container-shell flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-muted)] text-[var(--neon)]">
            <AppIcon name={category.iconKey} size={26} weight="bold" />
          </div>
          <h1 className="font-display text-5xl italic text-[var(--text-primary)]">
            {category.name}
          </h1>
        </div>
      </div>

      <section className="container-shell py-10">
        <p className="mb-6 text-sm text-[var(--text-secondary)]">
          {categoryEvents.length} event{categoryEvents.length !== 1 ? "s" : ""} in this scene
        </p>

        {categoryEvents.length === 0 ? (
          <ShellCard className="py-12 text-center">
            <h3 className="font-display text-3xl italic text-[var(--text-primary)]">
              No events yet
            </h3>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Check back soon — this scene is growing.
            </p>
            <div className="mt-6 flex justify-center">
              <Button href="/events">Browse all events</Button>
            </div>
          </ShellCard>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {categoryEvents.map((event) => {
              const organizer = organizerMap.get(event.organizerId);
              return organizer ? (
                <EventCard
                  key={event.id}
                  category={category}
                  event={event}
                  organizer={organizer}
                />
              ) : null;
            })}
          </div>
        )}
      </section>
    </main>
  );
}
