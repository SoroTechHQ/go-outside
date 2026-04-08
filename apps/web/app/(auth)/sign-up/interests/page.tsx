import Link from "next/link";
import { categories } from "@gooutside/demo-data";
import { AppIcon, Button, ShellCard } from "@gooutside/ui";

export default function SignUpInterestsPage() {
  return (
    <ShellCard className="w-full max-w-lg">
      <h1 className="font-display text-4xl italic text-[var(--text-primary)]">What moves you?</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">Pick the scenes you care about. We'll tailor your feed.</p>

      <div className="mt-8 flex flex-wrap gap-3">
        {categories.map((cat) => (
          <div
            key={cat.slug}
            className="flex items-center gap-2 rounded-full border border-[var(--neon)]/40 bg-[var(--neon)]/10 px-4 py-2 text-sm font-semibold text-[var(--neon)]"
          >
            <AppIcon name={cat.iconKey} size={16} weight="bold" />
            {cat.name}
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        <Button className="w-full" href="/sign-up/location">Continue</Button>
        <div className="text-center">
          <Link href="/events" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
            Skip for now
          </Link>
        </div>
      </div>
    </ShellCard>
  );
}
