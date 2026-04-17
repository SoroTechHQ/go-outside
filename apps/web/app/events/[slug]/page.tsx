import { notFound } from "next/navigation";
import { events } from "@gooutside/demo-data";
import { getEventBySlug } from "../../../lib/db/events";
import { EventDetailClient } from "./EventDetailClient";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Try real DB first, fall back to demo data
  const dbEvent = await getEventBySlug(slug).catch(() => null);
  const event = dbEvent ?? events.find((e) => e.slug === slug) ?? null;

  if (!event) notFound();

  return (
    <div className="min-h-screen bg-[var(--bg-card)]">
      <EventDetailClient event={event} />
    </div>
  );
}
