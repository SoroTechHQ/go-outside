import Link from "next/link";
import { getCategoriesWithCounts } from "../../lib/db/categories";
import { AppIcon, SectionHeader, ShellCard } from "@gooutside/ui";

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts();

  return (
    <main className="page-grid min-h-screen pb-24">
      <section className="container-shell py-10">
        <SectionHeader
          eyebrow="Browse"
          index="01"
          title="Explore by scene"
          description="Discover Ghanaian events organized by culture and interest."
        />

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/categories/${cat.slug}`} className="block">
              <ShellCard className="h-full transition hover:border-[var(--neon)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-muted)] text-[var(--neon)]">
                  <AppIcon name={cat.iconKey} size={22} weight="bold" />
                </div>
                <h2 className="mt-4 font-display text-3xl italic text-[var(--text-primary)]">
                  {cat.name}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                  {cat.description}
                </p>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                  {cat.count} event{cat.count !== 1 ? "s" : ""}
                </p>
              </ShellCard>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
