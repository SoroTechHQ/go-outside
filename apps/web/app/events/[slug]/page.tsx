import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDots, Copy, MapPin, ShareFat, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import {
  categories,
  events,
  getCategoryBySlug,
  getEventBySlug,
  getOrganizerById,
  getReviewsByEvent,
} from "@gooutside/demo-data";
import { Button, EventCard, SectionHeader, ShellCard, StatusPill } from "@gooutside/ui";

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const category = getCategoryBySlug(event.categorySlug) ?? categories[0];
  const organizer = getOrganizerById(event.organizerId);
  const reviews = getReviewsByEvent(event.slug);
  const similarEvents = events.filter((item) => item.slug !== event.slug && item.categorySlug === event.categorySlug).slice(0, 3);

  if (!organizer) {
    notFound();
  }

  return (
    <main className="page-grid min-h-screen pb-24">
      <section className={`relative h-[420px] bg-gradient-to-br ${event.bannerTone}`}>
        <div className="container-shell flex h-full flex-col justify-between py-8">
          <div className="flex items-center justify-between">
            <Button href="/events" variant="ghost">
              <ArrowLeft size={18} /> Back
            </Button>
            <StatusPill tone={event.priceValue === 0 ? "free" : "paid"}>{event.priceLabel}</StatusPill>
          </div>
          <div className="pb-6">
            <StatusPill tone={event.status === "live" ? "live" : "pending"}>{category.name}</StatusPill>
            <h1 className="mt-6 max-w-3xl font-display text-6xl italic text-white">{event.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/72">{event.shortDescription}</p>
          </div>
        </div>
      </section>

      <div className="container-shell grid gap-8 py-10 lg:grid-cols-[1fr,340px]">
        <div className="space-y-8">
          <ShellCard className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <CalendarDots size={18} />
              <span>{event.dateLabel} · {event.timeLabel}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <MapPin size={18} />
              <span>{event.venue}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <ShieldCheck size={18} />
              <span>{organizer.verified ? "Verified organizer" : "Community organizer"}</span>
            </div>
          </ShellCard>

          <section className="grid gap-6 md:grid-cols-[1fr,auto] md:items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--neon)]">Hosted by</p>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] text-sm font-semibold text-[var(--text-primary)]">
                  {organizer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-display text-3xl italic text-[var(--text-primary)]">{organizer.name}</h2>
                  <p className="text-sm text-[var(--text-secondary)]">{organizer.tag}</p>
                </div>
              </div>
            </div>
            <Button variant="ghost">Follow Organizer</Button>
          </section>

          <section>
            <SectionHeader
              description="Every block on this page runs from static demo data so you can refine the hierarchy and feel before wiring the API."
              eyebrow="Overview"
              index="05"
              title="Experience snapshot"
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {[
                { label: "Venue", value: event.venue },
                { label: "Capacity", value: event.capacityLabel },
                { label: "Rating", value: `${event.rating} / 5` },
              ].map((item) => (
                <ShellCard key={item.label} className="p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">{item.label}</p>
                  <p className="mt-3 text-base text-[var(--text-primary)]">{item.value}</p>
                </ShellCard>
              ))}
            </div>
          </section>

          <ShellCard>
            <h3 className="font-display text-3xl italic text-[var(--text-primary)]">Location</h3>
            <div className="mt-5 h-48 rounded-[18px] bg-gradient-to-br from-[#1a2418] to-[#0e1410] border border-[var(--border-subtle)] flex items-center justify-center gap-3 text-[var(--text-tertiary)]">
              <MapPin size={20} />
              <span className="text-sm">{event.locationLine}</span>
            </div>
          </ShellCard>

          <ShellCard>
            <h3 className="font-display text-3xl italic text-[var(--text-primary)]">Description</h3>
            <p className="mt-5 text-sm leading-8 text-[var(--text-secondary)]">{event.description}</p>
          </ShellCard>

          <ShellCard>
            <h3 className="font-display text-3xl italic text-[var(--text-primary)]">Gallery</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {event.gallery.map((imageLabel, index) => (
                <div
                  key={imageLabel}
                  className={`flex h-40 items-end rounded-[18px] border border-[var(--border-subtle)] bg-gradient-to-br ${index % 2 === 0 ? event.bannerTone : "from-[#162316] via-[#0f160f] to-[#070b07]"} p-4`}
                >
                  <span className="text-sm font-medium text-white/80">{imageLabel}</span>
                </div>
              ))}
            </div>
          </ShellCard>

          <ShellCard>
            <h3 className="font-display text-3xl italic text-[var(--text-primary)]">Reviews</h3>
            <div className="mt-6 space-y-4">
              {reviews.map((review) => (
                <div key={review.author} className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{review.author}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{review.title}</p>
                    </div>
                    <StatusPill tone="live">{review.rating}</StatusPill>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{review.body}</p>
                </div>
              ))}
            </div>
          </ShellCard>

          <section>
            <SectionHeader
              description="Additional listings pulled from the same category to simulate a strong recommendation shelf."
              eyebrow="Similar events"
              index="06"
              title="Keep moving through the city"
            />
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {similarEvents.map((item) => {
                const itemCategory = getCategoryBySlug(item.categorySlug) ?? category;
                const itemOrganizer = getOrganizerById(item.organizerId);
                return itemOrganizer ? (
                  <EventCard key={item.id} category={itemCategory} event={item} organizer={itemOrganizer} />
                ) : null;
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <ShellCard>
            <h3 className="font-display text-3xl italic text-[var(--text-primary)]">Get Tickets</h3>
            <div className="mt-5 space-y-4">
              {event.ticketTypes.map((ticketType) => (
                <div key={ticketType.name} className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{ticketType.name}</p>
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">{ticketType.remainingLabel}</p>
                    </div>
                    <StatusPill tone={event.priceValue === 0 ? "free" : "paid"}>{ticketType.priceLabel}</StatusPill>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-3">
              <Button className="w-full">Get Tickets</Button>
              <a
                href="https://wa.me/?text=Check+out+this+event"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-[var(--border-subtle)] bg-transparent px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--neon)] hover:text-[var(--text-primary)]"
              >
                <ShareFat size={18} />
                Share on WhatsApp
              </a>
              <button className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-[var(--border-subtle)] bg-transparent px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--neon)] hover:text-[var(--text-primary)]">
                <Copy size={18} />
                Copy Link
              </button>
            </div>
          </ShellCard>

          <ShellCard>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--neon)]">Organizer profile</p>
            <h4 className="mt-3 font-display text-2xl italic text-[var(--text-primary)]">{organizer.name}</h4>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
              {organizer.followersLabel} · {organizer.eventsLabel} · {organizer.city}
            </p>
          </ShellCard>
        </aside>
      </div>
    </main>
  );
}
