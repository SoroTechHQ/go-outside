import Link from "next/link";
import { Button, FieldLabel, ShellCard, TextInput } from "@gooutside/ui";

export default function SignInPage() {
  return (
    <ShellCard className="w-full max-w-md">
      <h1 className="font-display text-4xl italic text-[var(--text-primary)]">GoOutside</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">Sign in to continue</p>

      <div className="mt-8 space-y-5">
        <div>
          <FieldLabel>Email</FieldLabel>
          <TextInput value="you@example.com" />
        </div>
        <div>
          <FieldLabel>Password</FieldLabel>
          <TextInput value="••••••••" />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Button className="w-full">Sign In</Button>
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
          <span className="text-xs text-[var(--text-tertiary)]">or</span>
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
        </div>
        <Button className="w-full" variant="ghost">Continue with Google</Button>
      </div>

      <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
        No account?{" "}
        <Link href="/sign-up" className="font-semibold text-[var(--neon)]">
          Sign up
        </Link>
      </p>
    </ShellCard>
  );
}
