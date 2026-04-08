import { Suspense } from "react";
import { events, getCategoryBySlug, getOrganizerById } from "@gooutside/demo-data";
import ExploreClient from "../../components/explore/ExploreClient";

function buildExploreEntries() {
  return events.flatMap((event) => {
    const category = getCategoryBySlug(event.categorySlug);
    const organizer = getOrganizerById(event.organizerId);
    return category && organizer ? [{ event, category, organizer }] : [];
  });
}

export default function EventsPage() {
  const entries = buildExploreEntries();

  return (
    <main className="page-grid min-h-screen">
      <Suspense fallback={null}>
        <ExploreClient entries={entries} />
      </Suspense>
    </main>
  );
}
