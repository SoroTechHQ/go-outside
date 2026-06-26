# PRD — Organizer Payouts & Financial Hub
**Status:** Draft · **Owner:** Nana Amoako · **Date:** 2026-06-26

---

## 1. Overview

Organizers list events on GoOutside, sell tickets via Paystack, and expect their revenue to land in their bank account or mobile money wallet without friction. The Payouts page is the financial control centre for every organizer — it must inspire trust, show transparency, and make withdrawing money feel effortless.

**Goal:** A best-in-class payout experience, competitive with Eventbrite, Luma, and Dice, localized for Ghana (GHS, MoMo, GTB/Stanbic/Absa, Paystack infrastructure).

---

## 2. Competitive Landscape

### Eventbrite
- Payouts sent via ACH (USA) or local bank transfer 5 business days after event
- Organizers can set up a payout bank account and see a running balance
- "Organizer Fees" section shows GoEventbrite's cut clearly
- Strong refund policy builder (self-service)
- Tax forms (W-9, 1099) for US organizers

### Luma
- Stripe Connect — organizer gets their own Stripe sub-account
- Instant or scheduled payouts (daily, weekly, on-demand)
- Refund policies tied per event
- Clean payout dashboard with "Available", "In transit", "Paid out" breakdown
- Tax management (Stripe handles compliance)

### Dice
- Revenue share model — Dice takes a booking fee from buyers
- Organizer receives 100% of face value
- Payouts via BACS (UK) or SEPA — 3-5 days post-event
- Ticketing team handles disputes manually

### GoOutside (current state)
- Paystack processes payments ✓
- Tickets NOT auto-created after payment (webhook incomplete) ✗
- No payout schedule or withdrawal flow ✗
- No bank account / MoMo onboarding ✗
- No revenue visibility beyond the Orders page total ✗

---

## 3. User Stories

| # | As an organizer, I want to… | So that… |
|---|---|---|
| U1 | See my current balance (available vs. pending) at a glance | I know exactly how much I can withdraw |
| U2 | Link my GHS bank account or MoMo number once | Payouts go to the right place automatically |
| U3 | Choose when payouts happen (auto after event / on-demand) | I'm not waiting unnecessarily for money |
| U4 | See a detailed ledger of every payout and deduction | I can reconcile with my own records |
| U5 | Understand GoOutside's fee upfront per event | No surprises when the money arrives |
| U6 | Initiate a manual withdrawal anytime balance ≥ minimum | I'm not locked into a schedule |
| U7 | Receive an email/SMS confirmation for every payout | I have a paper trail |
| U8 | See refund deductions clearly in my ledger | I understand why my balance changed |
| U9 | Set a per-event refund policy (none / 7-day / 48h before) | My policy is enforced automatically |
| U10 | Download a CSV or PDF of my earnings per period | I can file taxes and provide records |

---

## 4. Payout Architecture (Ghana-specific)

### 4a. Payment flow
```
Buyer pays via Paystack checkout
       ↓
Paystack processes → webhook fires → GoOutside receives payment confirmation
       ↓
Ticket created in DB + Pulse Points awarded
       ↓
Revenue credited to Organizer Balance (held in GoOutside escrow ledger)
       ↓
After event end + 48h hold: funds marked "Available"
       ↓
Payout initiated to organizer's linked account
```

### 4b. Payout methods (Ghana)
| Method | Provider | Typical arrival |
|---|---|---|
| **MTN Mobile Money** | Paystack Transfer API | Same day |
| **Telecel Cash** | Paystack Transfer API | Same day |
| **AirtelTigo Money** | Paystack Transfer API | Same day |
| **GHS Bank Account** | Paystack Transfer API | 1-3 business days |

### 4c. Fee structure (proposed)
- **GoOutside platform fee:** 5% of ticket revenue (deducted before payout)
- **Paystack processing fee:** 1.5% + GHS 1 per transaction (passed through)
- **Free events:** no fee ever
- **Founding Organizers:** 0% platform fee on first 12 events

### 4d. Escrow & hold policy
- Revenue held for **48 hours after event end** before becoming available
- If event is cancelled: full refund to buyers, organizer receives 0
- If ticket is refunded individually: deducted from organizer's pending balance
- Minimum payout: **GHS 50**

---

## 5. Page Structure — `/organizer/settings/payouts`

### 5a. Balance Hero (top of page)
```
┌─────────────────────────────────────────────────────┐
│  Available                  Pending                 │
│  GHS 1,240.00               GHS 3,800.00            │
│                             (releases after event)  │
│  [Withdraw now]                                     │
└─────────────────────────────────────────────────────┘
```
- **Available**: cleared funds, ready to withdraw
- **Pending**: revenue from upcoming / recent events still in hold
- **Lifetime earned**: small stat below (motivational)
- "Withdraw now" → drawer/modal with amount + destination selector

### 5b. Payout account setup
```
┌─────────────────────────────────────────────────────┐
│  💳 Payout account                        [+ Add]  │
│  ────────────────────────────────────────────────── │
│  MTN MoMo · 055 *** 4321            [Default] [×]  │
│  Stanbic Bank · **** 7890                      [×]  │
└─────────────────────────────────────────────────────┘
```
- Add bank account: account number + bank name (from a Ghana bank list)
- Add MoMo: phone number + network (MTN / Telecel / AirtelTigo)
- One account marked as default
- Verified via micro-deposit or Paystack's recipient verification

### 5c. Payout schedule
```
  ○ Automatic — 48h after each event ends
  ○ Weekly — every Monday
  ● On demand only — I'll withdraw manually
```

### 5d. Ledger / Transaction history
| Date | Description | Amount | Status |
|---|---|---|---|
| Jun 26 | Markos Summer Bash · 87 tickets | +GHS 4,350 | Pending |
| Jun 20 | GoOutside fee (5%) | -GHS 217.50 | Deducted |
| Jun 20 | Paystack fees | -GHS 65.25 | Deducted |
| Jun 20 | Payout to MTN MoMo 055***4321 | -GHS 4,067.25 | Paid |
| Jun 10 | Afrobeats Night · 42 tickets | +GHS 2,100 | Paid |

- Filterable by: All / Payouts / Deductions / Refunds
- Date range picker
- Download CSV / PDF buttons

### 5e. Per-event refund policy
Simple selector on each event's settings page (not the payouts page itself):
- **No refunds** — all sales final
- **Full refund up to 7 days before event**
- **Full refund up to 48h before event**
- **Custom** — free-text (e.g. "50% refund up to 48h")

### 5f. Fee transparency card
```
┌─────────────────────────────────────────────────────┐
│  Fee breakdown                                      │
│  ─────────────────────────────────────────          │
│  Your ticket price:              GHS 100            │
│  GoOutside fee (5%):             - GHS 5.00         │
│  Paystack fee (1.5% + GHS 1):    - GHS 2.50         │
│  You receive:                    GHS 92.50          │
└─────────────────────────────────────────────────────┘
```
Interactive: type a ticket price, see the breakdown live.

---

## 6. Withdrawal Flow (Drawer/Modal)

**Step 1 — Amount**
- Input field pre-filled with "Available balance"
- Minimum: GHS 50
- Shows "After fees: GHS X" if Paystack charges for transfers

**Step 2 — Destination**
- Radio: select from linked accounts
- Link "Add new account +"

**Step 3 — Confirm**
- Summary: "GHS 1,240 → MTN MoMo 055***4321 · Arrives today"
- "Confirm withdrawal" button
- 2FA or PIN confirmation (future)

**Step 4 — Success**
- "Withdrawal initiated!" banner
- Email confirmation sent to organizer
- Ledger entry appears immediately as "Processing"

---

## 7. Link Payment Integration (Suggested)

The user mentioned "Link" payments (likely Stripe Link or Paystack's equivalents). In Ghana context:

### Option A: Paystack Payment Links (recommended, zero additional cost)
- Paystack already integrated — no new API keys
- Organizers get a direct payment link per event (`paystack.com/pay/event-xxx`)
- Buyers can pay without visiting GoOutside checkout
- Works on WhatsApp shares naturally
- **Implement:** add "Payment link" button to event detail page → calls Paystack's `/paymentrequest` API

### Option B: Flutterwave Payment Links
- Alternative if Paystack links are insufficient
- Requires separate API key (new Flutterwave account)
- Similar functionality

**Recommendation:** Implement Paystack Payment Links first (no extra cost, already integrated ecosystem) and call it "Quick Pay Link" on the UI.

---

## 8. Checkout Page Improvements

Current state: checkout page exists but is incomplete (Paystack fires but webhook doesn't fulfill ticket).

### Required fixes (blocking payout launch):
1. **Fix Paystack webhook** → on `charge.success`: create ticket row, award Pulse Points, send confirmation email
2. **Add order confirmation page** (`/dashboard/checkout/success?reference=xxx`)
3. **Email ticket delivery** via Resend (QR code + event details)

### Checkout page enhancements (once webhook fixed):
- Show event cover image + name prominently at top
- "Secure checkout" trust badge
- Paystack logo + "Powered by Paystack" footer
- Order summary with fee breakdown
- Applied promo code field
- "Guest checkout" option (email only, no signup required)
- Mobile-optimized: large tap targets, full-width CTA

---

## 9. Implementation Phases

### Phase 1 — Fix the Broken Foundation (unblock payouts)
| Task | Files | Priority |
|---|---|---|
| Fix Paystack webhook fulfillment | `/api/webhooks/paystack/route.ts` | P0 |
| Create `payout_accounts` table in Supabase | migration SQL | P0 |
| Create `payout_ledger` table | migration SQL | P0 |
| Email ticket confirmation via Resend | `/lib/email/index.ts` | P0 |

### Phase 2 — Payout Account Setup
| Task | Files | Priority |
|---|---|---|
| Payouts settings UI | `/organizer/settings/payouts/page.tsx` | P1 |
| Add/remove payout account API | `/api/organizer/payouts/accounts/route.ts` | P1 |
| Paystack recipient creation | Paystack Transfer API | P1 |
| Balance display (from ledger aggregate) | `/api/organizer/payouts/balance/route.ts` | P1 |

### Phase 3 — Withdrawal Flow
| Task | Files | Priority |
|---|---|---|
| Withdrawal request API | `/api/organizer/payouts/withdraw/route.ts` | P2 |
| Paystack bulk transfer | Paystack Transfer API | P2 |
| Withdrawal confirmation email | email template | P2 |
| Payout ledger display | `/organizer/settings/payouts/page.tsx` | P2 |

### Phase 4 — Polish
| Task | Priority |
|---|---|
| Fee calculator widget | P3 |
| CSV / PDF download | P3 |
| Payout schedule selector | P3 |
| Quick Pay Link (Paystack Payment Links) | P3 |
| Per-event refund policy | P3 |

---

## 10. DB Schema (new tables)

```sql
-- Organizer payout accounts
create table payout_accounts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  type         text not null check (type in ('bank', 'momo')),
  bank_name    text,
  account_number text,
  account_name text,
  momo_network text check (momo_network in ('mtn', 'telecel', 'airtel_tigo')),
  momo_number  text,
  paystack_recipient_code text,
  is_default   boolean not null default false,
  verified_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- Payout ledger (every money event)
create table payout_ledger (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  event_id     uuid references events(id),
  type         text not null check (type in (
                 'ticket_sale', 'platform_fee', 'processing_fee',
                 'refund', 'payout', 'adjustment'
               )),
  amount       numeric(12,2) not null,  -- positive = credit, negative = debit
  currency     text not null default 'GHS',
  description  text,
  reference    text,                     -- Paystack reference
  status       text not null default 'completed' 
                 check (status in ('pending', 'processing', 'completed', 'failed')),
  created_at   timestamptz not null default now()
);

-- Payout requests
create table payout_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id),
  payout_account_id uuid not null references payout_accounts(id),
  amount          numeric(12,2) not null,
  currency        text not null default 'GHS',
  paystack_transfer_code text,
  status          text not null default 'pending'
                    check (status in ('pending', 'processing', 'success', 'failed', 'reversed')),
  failure_reason  text,
  initiated_at    timestamptz not null default now(),
  completed_at    timestamptz
);
```

---

## 11. Success Metrics

| Metric | Target |
|---|---|
| Time from event end → payout received | < 3 business days |
| Payout setup completion rate | > 80% of active organizers |
| Organizer payout satisfaction (survey) | > 4.5 / 5 |
| Support tickets about missing payouts | < 5% of events |
| Paystack webhook success rate | > 99.5% |

---

## 12. Open Questions

1. **Who holds the escrow?** GoOutside's Paystack account or each organizer's own sub-account? Sub-accounts give cleaner separation but require organizers to create Paystack accounts.
2. **What's our fee?** 5% is a placeholder. Competitors range from 0% (Luma, Dice — charge buyers directly) to 3.5% (Eventbrite). A tiered model (0% for founding, 3% standard, 5% premium features) may work.
3. **Refund responsibility:** Does GoOutside enforce refund policy or just facilitate? Legal question.
4. **VAT / GRA compliance:** GHS payments to businesses may require VAT invoicing. Needs legal review.
5. **KYC:** Do we need to verify organizer identity before enabling payouts? Paystack's recipient verification partially covers this.
