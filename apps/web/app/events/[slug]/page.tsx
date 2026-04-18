import { notFound } from "next/navigation";
import {
  events,
  getOrganizerById as getDemoOrganizerById,
  type Organizer,
} from "@gooutside/demo-data";
import { getEventBySlug } from "../../../lib/db/events";
import { getOrganizerByUserId } from "../../../lib/db/organizers";
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

  const organizer =
    (await getOrganizerByUserId(event.organizerId).catch(() => null)) ??
    getDemoOrganizerById(event.organizerId) ??
    ({
      id: event.organizerId,
      name: "GoOutside Host",
      tag: "Community host",
      city: event.city,
      verified: false,
      followersLabel: "Community host",
      eventsLabel: "Active event page",
    } satisfies Organizer);

  return <EventDetailClient event={event} organizer={organizer} />;
}
