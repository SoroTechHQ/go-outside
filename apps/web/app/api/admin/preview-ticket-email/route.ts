import { NextRequest, NextResponse } from "next/server";
import { buildTicketEmailPreview } from "@/lib/email";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const firstName = searchParams.get("firstName") ?? "Nana";
  const eventName = searchParams.get("eventName") ?? "Ghana Food & Drink Festival 2026";
  const venue     = searchParams.get("venue")     ?? "Labadi Beach Hotel";
  const withCover = searchParams.get("cover")     !== "false";

  const html = buildTicketEmailPreview({
    firstName,
    eventName,
    eventDate: "Fri, 5 Sep 2026",
    venue,
    venueAddress: "Labadi, Accra",
    ticketId: "GOOUT-F3A9-2026",
    qrUrl: `https://api.qrserver.com/v1/create-qr-code/?data=GOOUT-F3A9-2026&size=200x200&color=000000&bgcolor=ffffff`,
    coverUrl: withCover
      ? "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80"
      : null,
    startDatetime: "2026-09-05T11:00:00+00:00",
    endDatetime:   "2026-09-05T21:00:00+00:00",
    ticketLines: [
      { label: "Day Entry · General", quantity: 1, priceLabel: "GHS 150.00" },
    ],
    totalLabel: "GHS 150.00",
    paymentMethod: "Mobile Money via Paystack",
    eventUrl: "https://gooutside.club/events/ghana-food-drink-festival-2026",
    mapsUrl:  "https://maps.google.com/?q=Labadi+Beach+Hotel+Accra",
    organizer: {
      name:          "Big Events Ghana",
      websiteUrl:    "https://bigeventsghana.com",
      logoUrl:       null,
      customMessage: "Can't wait to see you there! Follow us on Instagram for last-minute updates and surprises.",
      socialLinks:   { Instagram: "@bigeventsghana", Twitter: "@bigeventsgh" },
    },
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
