import { demoData } from "@gooutside/demo-data";
import { Button, FauxSelect, FieldLabel, SectionHeader, ShellCard, TextInput } from "@gooutside/ui";

export default function ProfilePage() {
  const attendee = demoData.attendee;

  return (
    <main className="page-grid min-h-screen pb-24">
      <div className="container-shell py-10">
        <SectionHeader
          eyebrow="Profile"
          index="01"
          title={attendee.name}
          description="Manage your account details and preferences."
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <ShellCard>
            <h2 className="font-display text-3xl italic text-[var(--text-primary)]">Account details</h2>
            <div className="mt-6 space-y-5">
              <div>
                <FieldLabel>Name</FieldLabel>
                <TextInput value={attendee.name} />
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <TextInput value="kofi@example.com" />
              </div>
              <div>
                <FieldLabel>City</FieldLabel>
                <FauxSelect value="Accra" />
              </div>
            </div>
            <div className="mt-6">
              <Button>Save changes</Button>
            </div>
          </ShellCard>

          <ShellCard>
            <h2 className="font-display text-3xl italic text-[var(--text-primary)]">Notification preferences</h2>
            <div className="mt-6 space-y-4">
              {[
                "Event reminders",
                "New saves alerts",
                "Broadcast messages",
              ].map((label) => (
                <div key={label} className="flex items-center justify-between gap-4 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4">
                  <span className="text-sm text-[var(--text-primary)]">{label}</span>
                  <div className="rounded-full border border-[var(--neon)]/40 bg-[var(--neon)]/10 px-3 py-1 text-xs font-bold text-[var(--neon)]">
                    On
                  </div>
                </div>
              ))}
            </div>
          </ShellCard>
        </div>
      </div>
    </main>
  );
}
