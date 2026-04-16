import { getOrCreateSupabaseUser } from "../../../lib/db/users";
import { getSavedEvents } from "../../../lib/db/saved";
import { getCategories } from "../../../lib/db/categories";
import { getOrganizers } from "../../../lib/db/organizers";
import { Button, EventCard, SectionHeader, ShellCard } from "@gooutside/ui";
import type { Category, Organizer } from "@gooutside/demo-data";

export default async function SavedEventsPage() {
  const user = await getOrCreateSupabaseUser();

  if (!user) {
    return (
      <main className="page-grid min-h-screen pb-36 md:pb-24">
        <div className="container-shell py-20 text-center">
          <p className="text-[var(--text-secondary)]">Please sign in to view saved events.</p>
        </div>
      </main>
    );
  }

  const [savedEvents, categories, organizers] = await Promise.all([
    getSavedEvents(user.id),
    getCategories(),
    getOrganizers(),
  ]);

  const categoryMap  = new Map<string, Category>(categories.map((c) => [c.slug, c]));
  const organizerMap = new Map<string, Organizer>(organizers.map((o) => [o.id, o]));

  return (
    <main className="page-grid min-h-screen pb-36 md:pb-24">
      <div className="container-shell px-4 py-8 md:py-10">
        <SectionHeader
          eyebrow="Activity"
          index="01"
          title="Saved events"
          description="The events you have been tracking before you turn them into a plan."
        />

        <div className="mt-8">
          {savedEvents.length === 0 ? (
            <ShellCard className="py-12 text-center">
              <h3 className="font-display text-3xl italic text-[var(--text-primary)]">
                No saved events
              </h3>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                Browse events and tap save to keep them here.
              </p>
              <div className="mt-6 flex justify-center">
                <Button href="/events">Explore events</Button>
              </div>
            </ShellCard>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {savedEvents.map((event) => {
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
        </div>
      </div>
    </main>
  );
}
