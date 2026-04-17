import { CalendarBlank, MegaphoneSimple, NotePencil, Ticket } from "@phosphor-icons/react/dist/ssr";
import { getOrganizerCalendarItems, getOrganizerDashboardData } from "../_lib/dashboard";
import { getOrCreateSupabaseUser } from "../../../lib/db/users";

const DAYS = Array.from({ length: 30 }, (_, index) => index + 1);
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function kindIcon(kind: "event" | "post" | "campaign") {
  if (kind === "event") return <Ticket size={14} weight="fill" />;
  if (kind === "campaign") return <MegaphoneSimple size={14} weight="fill" />;
  return <NotePencil size={14} weight="fill" />;
}

export default async function OrganizerCalendarPage() {
  const user = await getOrCreateSupabaseUser();
  if (!user) return null;

  const dashboard = user.role === "organizer" || user.role === "admin"
    ? await getOrganizerDashboardData(user.id)
    : null;

  if (!dashboard) {
    return (
      <div className="p-5 md:p-7">
        <section className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
          <h1 className="font-display text-[2rem] italic text-[var(--text-primary)]">Content Calendar</h1>
          <p className="mt-3 text-[14px] text-[var(--text-secondary)]">
            Organizer scheduling unlocks after organizer approval.
          </p>
        </section>
      </div>
    );
  }

  const items = getOrganizerCalendarItems(dashboard);

  return (
    <div className="p-5 md:p-7">
      <section className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Workspace
            </p>
            <h1 className="mt-3 font-display text-[2.2rem] italic text-[var(--text-primary)]">Content Calendar</h1>
            <p className="mt-3 max-w-[680px] text-[14px] leading-7 text-[var(--text-secondary)]">
              Scheduled posts, event launches, and campaign windows in one planner. This is the first cut of the monthly organizer calendar from the PRD.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)]/10 px-4 py-2 text-[13px] font-semibold text-[var(--brand)]">
            <CalendarBlank size={16} weight="fill" />
            April plan
          </span>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
          <div className="grid grid-cols-7 gap-2">
            {WEEKDAYS.map((label) => (
              <div key={label} className="px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                {label}
              </div>
            ))}
            {DAYS.map((day) => {
              const dayItems = items.filter((item) => item.day === day);
              return (
                <div key={day} className="min-h-[108px] rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2">
                  <p className="text-[12px] font-semibold text-[var(--text-primary)]">{day}</p>
                  <div className="mt-2 space-y-1.5">
                    {dayItems.map((item) => (
                      <div key={item.id} className="rounded-[16px] bg-[var(--bg-card)] px-2 py-1.5 text-[11px] text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
                          {kindIcon(item.kind)}
                          {item.title}
                        </span>
                        <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">
                          {item.timeLabel} · {item.status}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <aside className="space-y-4">
          <article className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Upcoming queue</p>
            <div className="mt-4 space-y-3">
              {items.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-[20px] bg-[var(--bg-elevated)] p-3">
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">{item.title}</p>
                  <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                    Day {item.day} · {item.timeLabel}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{item.status}</p>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
