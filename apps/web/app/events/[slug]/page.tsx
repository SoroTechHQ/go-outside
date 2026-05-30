import { notFound } from "next/navigation";
import type { Organizer } from "@gooutside/demo-data";
import { getEventBySlug } from "../../../lib/db/events";
import { getOrganizerByUserId } from "../../../lib/db/organizers";
import { EventDetailClient } from "./EventDetailClient";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const event = await getEventBySlug(slug).catch(() => null);
  if (!event) notFound();

  const organizer =
    (await getOrganizerByUserId(event.organizerId).catch(() => null)) ??
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
