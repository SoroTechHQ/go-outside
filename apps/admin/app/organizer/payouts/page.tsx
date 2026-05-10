import { ShellCard } from "@gooutside/ui";
import { supabaseAdmin } from "../../../lib/supabase";
import { DashboardShell } from "../../../components/dashboard-shell";
import { MetricTile, MiniPill, PageGuide } from "../../../components/dashboard-primitives";

function fmtGHS(n: number) {
  return `₵${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const paymentStatusTone = (s: string): "brand" | "amber" | "cyan" | "coral" => {
  if (s === "paid") return "brand";
  if (s === "pending") return "amber";
  if (s === "refunded") return "cyan";
  return "coral";
};

const paymentStatusLabel: Record<string, string> = {
  paid: "Settled",
  pending: "Pending",
  refunded: "Refunded",
  failed: "Failed",
};

export default async function OrganizerPayoutsPage() {
  // Fetch organizer
  const { data: orgProfile } = await supabaseAdmin
    .from("organizer_profiles")
    .select("user_id, organization_name, total_revenue, paystack_subaccount")
    .eq("status", "active")
    .not("verified_at", "is", null)
    .order("total_revenue", { ascending: false })
    .limit(1)
    .single();

  const userId = orgProfile?.user_id ?? null;
  const totalRevenue = Number(orgProfile?.total_revenue ?? 0);

  // Fetch organizer's events to get payment data
  const { data: events } = userId
    ? await supabaseAdmin
        .from("events")
        .select("id, title")
        .eq("organizer_id", userId)
        .limit(50)
    : { data: [] };

  const eventIds = (events ?? []).map((e) => e.id);

  // Fetch payments for organizer's events
  const { data: payments } = eventIds.length > 0
    ? await supabaseAdmin
        .from("payments")
        .select("id, amount, status, created_at, paid_at, event_id, events(title)")
        .in("event_id", eventIds)
        .order("created_at", { ascending: false })
        .limit(30)
    : { data: [] };

  const allPayments = payments ?? [];

  const paidAmount = allPayments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const pendingAmount = allPayments
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const refundedAmount = allPayments
    .filter((p) => p.status === "refunded")
    .reduce((s, p) => s + Number(p.amount ?? 0), 0);

  // Last paid payment
  const lastPaid = allPayments.find((p) => p.status === "paid");

  return (
    <DashboardShell mode="organizer" subtitle="Settlement status and remittance timing" title="Payouts">
      <div className="space-y-6">
        <PageGuide
          title="Track your event revenue and payout status"
          tips={[
            "Settled shows revenue from confirmed payments across all your events.",
            "Pending payments are being processed and usually clear within 1–3 business days.",
            "Each row below shows a payment for one of your events with its current status.",
            "Contact the GoOutside team to initiate a bank transfer for your available balance.",
          ]}
        />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            accent="brand"
            label="Total revenue"
            meta="All-time from confirmed payments"
            trend="All time"
            value={fmtGHS(totalRevenue)}
          />
          <MetricTile
            accent="brand"
            label="Settled"
            meta="Successfully paid transactions"
            trend="Paid"
            value={fmtGHS(paidAmount)}
          />
          <MetricTile
            accent="amber"
            label="Pending"
            meta="Awaiting payment confirmation"
            trend={`${allPayments.filter((p) => p.status === "pending").length} transactions`}
            value={fmtGHS(pendingAmount)}
          />
          <MetricTile
            accent="cyan"
            label="Refunded"
            meta="Returned to attendees"
            trend={`${allPayments.filter((p) => p.status === "refunded").length} refunds`}
            value={fmtGHS(refundedAmount)}
          />
        </div>

        <ShellCard>
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-amber)]">
            Payment history
          </p>
          {allPayments.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--text-tertiary)]">No payments yet.</p>
          ) : (
            <div className="space-y-3">
              {allPayments.map((p) => {
                const eventTitle = Array.isArray(p.events)
                  ? (p.events[0] as { title?: string })?.title ?? "Event"
                  : (p.events as { title?: string } | null)?.title ?? "Event";
                return (
                  <div
                    key={p.id}
                    className="flex flex-col gap-3 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{eventTitle}</p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {p.paid_at ? formatDate(p.paid_at as string) : formatDate(p.created_at as string)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {fmtGHS(Number(p.amount ?? 0))}
                      </span>
                      <MiniPill tone={paymentStatusTone(p.status ?? "pending")}>
                        {paymentStatusLabel[p.status ?? "pending"] ?? p.status}
                      </MiniPill>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ShellCard>
      </div>
    </DashboardShell>
  );
}
