import { Suspense } from "react";
import { getPublishedEvents } from "../../lib/db/events";
import { getCategories } from "../../lib/db/categories";
import { getOrganizers } from "../../lib/db/organizers";
import ExploreClient from "../../components/explore/ExploreClient";
import type { EventItem, Category, Organizer } from "@gooutside/demo-data";

export default async function EventsPage() {
  const [events, categories, organizers] = await Promise.all([
    getPublishedEvents(),
    getCategories(),
    getOrganizers(),
  ]);

  // Build category + organizer lookup maps for O(1) joins
  const categoryMap = new Map<string, Category>(categories.map((c) => [c.slug, c]));
  const organizerMap = new Map<string, Organizer>(organizers.map((o) => [o.id, o]));

  const entries = events.flatMap((event: EventItem) => {
    const category = categoryMap.get(event.categorySlug);
    const organizer = organizerMap.get(event.organizerId);
    return category && organizer ? [{ event, category, organizer }] : [];
  });

  return (
    <main className="page-grid min-h-screen">
      <Suspense fallback={null}>
        <ExploreClient entries={entries} />
      </Suspense>
    </main>
  );
}
