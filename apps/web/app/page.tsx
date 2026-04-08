import {
  categories,
  demoData,
  events,
  getCategoryBySlug,
  getOrganizerById,
} from "@gooutside/demo-data";
import { AppIcon, Button, EventCard, SectionHeader, ShellCard, StatusPill } from "@gooutside/ui";
import { PublicHeader } from "../components/public-header";

export default function LandingPage() {
  const featuredEvents = events.filter((event) => event.featured).slice(0, 3);

  return (
    <main className="pb-20">
      <PublicHeader />

      <section className="grain-overlay overflow-hidden">
        <div className="container-shell grid gap-10 py-14 lg:grid-cols-[1.1fr,0.9fr] lg:items-center lg:py-20">
          <div>
            <StatusPill tone="live">Ghana-wide discovery</StatusPill>
            <h1 className="mt-6 max-w-4xl font-display text-6xl italic leading-[0.95] text-[var(--text-primary)] md:text-7xl">
              The social map for events that actually feel worth stepping out for.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
              GoOutside blends discovery flow, saved-event behavior, and hospitality-first event
              detail pages into a frontend built for Ghanaian nightlife, culture, dining, and
              community scenes.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/events">Start Exploring</Button>
              <Button href="/dashboard" variant="ghost">
                Attendee Flow
              </Button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {Object.entries(demoData.platform.stats).map(([key, value]) => (
                <ShellCard key={key} className="p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                    {key.replace("Label", "")}
                  </p>
                  <p className="mt-3 font-display text-3xl italic text-[var(--text-primary)]">
                    {value}
                  </p>
                </ShellCard>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ShellCard className="bg-[linear-gradient(180deg,rgba(184,255,60,0.12),rgba(184,255,60,0.03))]">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--neon)]">
                Trending now
              </p>
              <h2 className="mt-4 font-display text-4xl italic text-[var(--text-primary)]">
                {featuredEvents[0]?.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                {featuredEvents[0]?.shortDescription}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <StatusPill tone="paid">{featuredEvents[0]?.priceLabel}</StatusPill>
                <StatusPill tone="draft">{featuredEvents[0]?.locationLine}</StatusPill>
              </div>
            </ShellCard>

            <div className="grid gap-4">
              {featuredEvents.slice(1).map((event) => {
                const organizer = getOrganizerById(event.organizerId);
                return (
                  <ShellCard key={event.id} className="p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--neon)]">
                      {event.eyebrow}
                    </p>
                    <h3 className="mt-3 font-display text-2xl italic text-[var(--text-primary)]">
                      {event.title}
                    </h3>
                    <p className="mt-3 text-sm text-[var(--text-secondary)]">
                      {organizer?.name} · {event.city}
                    </p>
                  </ShellCard>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-8">
        <SectionHeader
          description="The category rail stays visual and compact so the platform feels quick to scan, even with a wide range of cultural scenes."
          eyebrow="Explore scenes"
          index="01"
          title="A city feed built around intent"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <ShellCard key={category.slug} className="flex items-start gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-muted)] text-[var(--neon)]">
                <AppIcon name={category.iconKey} size={22} weight="bold" />
              </div>
              <div>
                <h3 className="font-display text-2xl italic text-[var(--text-primary)]">
                  {category.name}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                  {category.description}
                </p>
              </div>
            </ShellCard>
          ))}
        </div>
      </section>

      <section className="container-shell py-8">
        <SectionHeader
          description="Featured listings combine the density of a social feed with the premium card language of a hospitality product."
          eyebrow="Featured listings"
          index="02"
          title="Momentum shelves"
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {featuredEvents.map((event) => {
            const category = getCategoryBySlug(event.categorySlug);
            const organizer = getOrganizerById(event.organizerId);
            return category && organizer ? (
              <EventCard key={event.id} category={category} event={event} organizer={organizer} />
            ) : null;
          })}
        </div>
      </section>

      <section className="container-shell py-8">
        <SectionHeader
          eyebrow="How it works"
          index="03"
          title="Three steps to your next night out"
          description="GoOutside is designed to move fast — from curiosity to confirmed in under a minute."
        />
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            { step: "01", title: "Discover events", body: "Browse by scene, city, or mood. The feed updates with real-time availability across Ghana." },
            { step: "02", title: "Book your spot", body: "Reserve tickets instantly. No friction, no third-party redirects — just confirm and you're in." },
            { step: "03", title: "Show up and connect", body: "Your digital ticket lives in-app. Check in, meet the crowd, and find your next event on the way out." },
          ].map((item) => (
            <ShellCard key={item.step} className="p-6">
              <p className="font-display text-5xl italic text-[var(--neon)]">{item.step}</p>
              <h3 className="mt-4 font-display text-2xl italic text-[var(--text-primary)]">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{item.body}</p>
            </ShellCard>
          ))}
        </div>
      </section>

      <section className="container-shell py-8">
        <SectionHeader
          eyebrow="Trending now"
          index="04"
          title="Events the city is moving toward"
          description="High-velocity listings with momentum across saves, shares, and ticket scans."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {events.filter((e) => e.trending).slice(0, 3).map((event) => {
            const category = getCategoryBySlug(event.categorySlug);
            const organizer = getOrganizerById(event.organizerId);
            return category && organizer ? (
              <div key={event.id} className="relative">
                <div className="absolute left-4 top-4 z-10">
                  <StatusPill tone="paid">Hot</StatusPill>
                </div>
                <EventCard category={category} event={event} organizer={organizer} />
              </div>
            ) : null;
          })}
        </div>
      </section>

      <section className="container-shell py-8">
        <ShellCard className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--neon)]">For organizers</p>
            <h2 className="mt-4 font-display text-4xl italic text-[var(--text-primary)]">Host your next event on GoOutside</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
              Access a hospitality-first toolkit — ticketing, analytics, check-in, and a social audience ready to discover what you're building.
            </p>
            <div className="mt-6">
              <Button href="/organizer">Start Hosting</Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {demoData.organizerDashboard.stats.slice(0, 3).map((stat) => (
              <div key={stat.label} className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">{stat.label}</p>
                <p className="mt-3 font-display text-2xl italic text-[var(--text-primary)]">{stat.value}</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">{stat.trend}</p>
              </div>
            ))}
          </div>
        </ShellCard>
      </section>

      <section className="container-shell py-8">
        <SectionHeader
          eyebrow="Reviews"
          index="05"
          title="What attendees are saying"
          description="Real feedback from people who showed up."
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {demoData.organizerDashboard.recentReviews.map((review) => (
            <ShellCard key={review.author} className="p-6">
              <p className="text-sm leading-8 text-[var(--text-secondary)]">"{review.body}"</p>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">— {review.author}</p>
            </ShellCard>
          ))}
        </div>
      </section>

      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-base)] mt-8">
        <div className="container-shell py-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="font-display text-3xl italic text-[var(--text-primary)]">GoOutside</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">© 2025 GoOutside. Built for Ghana.</p>
          </div>
          <nav className="flex flex-wrap gap-5">
            {demoData.navigation.publicLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </main>
  );
}
