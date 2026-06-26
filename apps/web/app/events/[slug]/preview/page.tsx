import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import type { Organizer } from "@gooutside/demo-data";
import { getEventBySlugForPreview } from "../../../../lib/db/events";
import { getOrganizerByUserId } from "../../../../lib/db/organizers";
import { EventDetailClient } from "../EventDetailClient";

export const metadata = { robots: "noindex, nofollow" };

export default async function EventPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const { slug } = await params;

  const event = await getEventBySlugForPreview(slug, clerkId).catch(() => null);
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

  return <EventDetailClient event={event} organizer={organizer} previewMode />;
}
