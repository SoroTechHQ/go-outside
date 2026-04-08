import { ShellCard } from "@gooutside/ui";
import { DashboardShell } from "../dashboard-shell";
import { MiniPill, PageHero, SectionBlock } from "../dashboard-primitives";

const mediaCards = [
  ["Campaign teaser", "Vertical social cut for Friday discovery push", "brand"],
  ["Organizer spotlight", "Square portrait card for verified organizers", "cyan"],
  ["Venue lookbook", "Wide image stack for event detail pages", "violet"],
  ["Motion promo", "16:9 trailer tile for homepage hero", "coral"],
];

export function PlatformMediaPage() {
  return (
    <DashboardShell mode="admin" subtitle="Visual cards, placeholders, and layout experiments" title="Media">
      <div className="space-y-6">
        <PageHero
          eyebrow="Media page"
          title="A visual page for cards, thumbnails, and promotional surfaces."
          description="This ports the spirit of the boilerplate’s image and video pages into something more relevant for event operations, editorial tooling, and promo asset review."
        />

        <SectionBlock subtitle="Visual tiles across mixed aspect ratios" title="Asset grid">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {mediaCards.map(([title, description, tone], index) => (
              <div key={title} className="space-y-3">
                <div
                  className={`relative overflow-hidden rounded-[24px] border border-[var(--border-subtle)] ${
                    index === 0
                      ? "aspect-[4/5]"
                      : index === 1
                        ? "aspect-square"
                        : index === 2
                          ? "aspect-[16/10]"
                          : "aspect-video"
                  }`}
                  style={{
                    background:
                      tone === "brand"
                        ? "linear-gradient(135deg, rgba(61,220,151,0.38), rgba(61,220,151,0.06))"
                        : tone === "cyan"
                          ? "linear-gradient(135deg, rgba(56,189,248,0.38), rgba(56,189,248,0.06))"
                          : tone === "violet"
                            ? "linear-gradient(135deg, rgba(167,139,250,0.38), rgba(167,139,250,0.06))"
                            : "linear-gradient(135deg, rgba(251,113,133,0.38), rgba(251,113,133,0.06))",
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_34%)]" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{title}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionBlock>

        <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <SectionBlock subtitle="Video and carousel-style cards" title="Promo formats">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-muted)]">
                <div className="aspect-video bg-[linear-gradient(135deg,rgba(56,189,248,0.35),rgba(167,139,250,0.18),transparent)]" />
                <div className="p-4">
                  <MiniPill tone="cyan">16:9 trailer</MiniPill>
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">
                    Homepage promo with room for headline, subtitle, and CTA.
                  </p>
                </div>
              </div>
              <div className="overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-muted)]">
                <div className="aspect-[3/4] bg-[linear-gradient(135deg,rgba(251,113,133,0.35),rgba(251,191,36,0.18),transparent)]" />
                <div className="p-4">
                  <MiniPill tone="coral">Story card</MiniPill>
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">
                    Vertical promo variant for social reposting and ambassador packs.
                  </p>
                </div>
              </div>
            </div>
          </SectionBlock>

          <ShellCard>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-violet)]">Usage notes</p>
            <div className="mt-4 space-y-3">
              {[
                "Keep media surfaces expressive. This app should not look like a generic finance template.",
                "Use the accent palette to differentiate editorial, growth, trust, and payments surfaces.",
                "Treat these cards as placeholders for future CMS or asset-library work.",
              ].map((item) => (
                <div key={item} className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4 text-sm text-[var(--text-secondary)]">
                  {item}
                </div>
              ))}
            </div>
          </ShellCard>
        </div>
      </div>
    </DashboardShell>
  );
}
