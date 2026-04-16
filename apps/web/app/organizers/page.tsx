import { getOrganizers } from "../../lib/db/organizers";
import { Button, SectionHeader, ShellCard } from "@gooutside/ui";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";

export default async function OrganizersPage() {
  const organizers = await getOrganizers();

  return (
    <main className="page-grid min-h-screen pb-24">
      <section className="container-shell py-10">
        <SectionHeader
          eyebrow="Community"
          index="01"
          title="Meet the organizers"
          description="The teams behind the city's best events."
        />

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {organizers.map((org) => (
            <ShellCard key={org.id} className="flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-sm font-semibold text-[var(--text-primary)]">
                  {org.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-2xl italic text-[var(--text-primary)]">
                      {org.name}
                    </h2>
                    {org.verified && (
                      <ShieldCheck size={16} className="shrink-0 text-[var(--neon)]" weight="fill" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{org.tag}</p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">{org.city}</p>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-[var(--text-tertiary)]">
                <span>{org.followersLabel}</span>
                <span>{org.eventsLabel}</span>
              </div>
              <Button href={`/organizers/${org.id}`} variant="ghost" className="w-full">
                View Profile
              </Button>
            </ShellCard>
          ))}
        </div>
      </section>
    </main>
  );
}
