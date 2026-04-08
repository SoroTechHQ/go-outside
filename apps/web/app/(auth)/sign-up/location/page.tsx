import Link from "next/link";
import { demoData } from "@gooutside/demo-data";
import { Button, ShellCard } from "@gooutside/ui";

export default function SignUpLocationPage() {
  return (
    <ShellCard className="w-full max-w-lg">
      <h1 className="font-display text-4xl italic text-[var(--text-primary)]">Where are you based?</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">We'll prioritize events in your city.</p>

      <div className="mt-8 flex flex-wrap gap-3">
        {demoData.platform.cities.map((city) => (
          <div
            key={city}
            className="rounded-full border border-[var(--neon)]/40 bg-[var(--neon)]/10 px-4 py-2 text-sm font-semibold text-[var(--neon)]"
          >
            {city}
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        <Button className="w-full" href="/events">Continue</Button>
        <div className="text-center">
          <Link href="/events" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
            Skip for now
          </Link>
        </div>
      </div>
    </ShellCard>
  );
}
