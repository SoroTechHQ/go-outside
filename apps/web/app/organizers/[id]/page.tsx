import { notFound } from "next/navigation";
import { getOrganizerByUserId } from "../../../lib/db/organizers";
import { getEventsByOrganizer } from "../../../lib/db/events";
import { getCategories } from "../../../lib/db/categories";
import { EventCard, ShellCard } from "@gooutside/ui";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import type { Category } from "@gooutside/demo-data";

export default async function OrganizerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [organizer, organizerEvents, categories] = await Promise.all([
    getOrganizerByUserId(id),
    getEventsByOrganizer(id),
    getCategories(),
  ]);

  if (!organizer) notFound();

  const categoryMap = new Map<string, Category>(categories.map((c) => [c.slug, c]));

  return (
    <main className="page-grid min-h-screen pb-24">
      <section className="container-shell py-10">
        <ShellCard className="mb-8">
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-lg font-semibold text-[var(--text-primary)]">
              {organizer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-5xl italic text-[var(--text-primary)]">
                  {organizer.name}
                </h1>
                {organizer.verified && (
                  <ShieldCheck size={22} className="text-[var(--neon)]" weight="fill" />
                )}
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{organizer.tag}</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">{organizer.city}</p>
              <div className="mt-3 flex gap-4 text-xs text-[var(--text-tertiary)]">
                <span>{organizer.followersLabel}</span>
                <span>{organizer.eventsLabel}</span>
              </div>
            </div>
          </div>
        </ShellCard>

        <div className="mb-6">
          <h2 className="font-display text-3xl italic text-[var(--text-primary)]">
            Events by {organizer.name}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {organizerEvents.length} listing{organizerEvents.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {organizerEvents.map((event) => {
            const category = categoryMap.get(event.categorySlug) ?? {
              slug: event.categorySlug, name: event.eyebrow,
              iconKey: "calendar", description: "",
            };
            return (
              <EventCard
                key={event.id}
                category={category}
                event={event}
                organizer={organizer}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
