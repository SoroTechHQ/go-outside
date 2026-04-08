import { demoData, getCategoryBySlug, getOrganizerById, getSavedEvents } from "@gooutside/demo-data";
import { Button, EventCard, MobileBottomNav, SectionHeader, ShellCard } from "@gooutside/ui";
import { PublicHeader } from "../../../components/public-header";

export default function SavedEventsPage() {
  const savedEvents = getSavedEvents();

  return (
    <main className="pb-24">
      <PublicHeader />

      <div className="container-shell py-10">
        <SectionHeader
          eyebrow="Saved"
          index="01"
          title="Your saved events"
          description="Events you've bookmarked before they sell out."
        />

        <div className="mt-8">
          {savedEvents.length === 0 ? (
            <ShellCard className="py-12 text-center">
              <h3 className="font-display text-3xl italic text-[var(--text-primary)]">No saved events</h3>
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
                const category = getCategoryBySlug(event.categorySlug);
                const organizer = getOrganizerById(event.organizerId);
                return category && organizer ? (
                  <EventCard key={event.id} category={category} event={event} organizer={organizer} />
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>

      <MobileBottomNav links={demoData.navigation.attendeeTabs} />
    </main>
  );
}
