import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Organizer } from "@gooutside/demo-data";
import { getEventBySlug } from "../../../lib/db/events";
import { getOrganizerByUserId } from "../../../lib/db/organizers";
import { EventDetailClient } from "./EventDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug).catch(() => null);
  if (!event) return {};

  const description = event.shortDescription ?? event.description?.slice(0, 160) ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://gooutside.club";
  const pageUrl = `${siteUrl}/events/${slug}`;

  // Dynamic OG image — branded template with event cover
  const ogParams = new URLSearchParams({
    type:     "event",
    title:    event.title,
    subtitle: [event.eyebrow, event.venue].filter(Boolean).join(" · "),
    tag:      event.categorySlug ?? "",
    meta:     event.city ?? "Accra",
    ...(event.bannerUrl ? { image: event.bannerUrl } : {}),
  });
  const ogImage = `${siteUrl}/api/og?${ogParams.toString()}`;

  return {
    title: `${event.title} | GoOutside`,
    description,
    openGraph: {
      title: event.title,
      description,
      url: pageUrl,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: event.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      images: [ogImage],
    },
  };
}

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
