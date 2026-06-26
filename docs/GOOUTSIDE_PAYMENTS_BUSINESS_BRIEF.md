# GoOutside — Payments, Fees & Financial Infrastructure
### Business Brief for Organizers & Stakeholders
**Version 1.0 · June 2026 · Confidential**

---

> **How to read this document**
> This is a plain-language breakdown of how money moves on GoOutside — from the moment a fan buys a ticket to the moment an organizer gets paid. It covers Ghana's tax laws, mobile money fees, our fee structure, how we compare to global competitors, and the security systems that protect everyone's money. No technical background needed.

---

## Part 1 — The Big Picture: How Money Flows

When someone buys a ticket on GoOutside, five things happen — in this order:

```
1. Fan enters card / MoMo details at checkout
       ↓
2. Paystack processes the payment securely
       ↓
3. GoOutside receives confirmation + creates the ticket instantly
       ↓
4. Revenue is held in a secure escrow account (48 hours after event)
       ↓
5. GoOutside deducts its fee and pays out to the organizer
```

Every step is logged, traceable, and auditable. Nothing moves without a record.

---

## Part 2 — Ghana's Tax & Levy Landscape

Understanding the tax environment is essential before setting any ticket price. Ghana has several layers of tax that apply to commercial transactions, including ticket sales.

### 2a. Value Added Tax (VAT)

Ghana's VAT system has three components that apply together:

| Tax Component | Rate | Who Collects |
|---|---|---|
| Standard VAT | 15.0% | Ghana Revenue Authority (GRA) |
| National Health Insurance Levy (NHIL) | 2.5% | GRA |
| Ghana Education Trust Fund (GETFund) | 2.5% | GRA |
| **Total effective rate** | **20.0%** | |

**Key updates from 2026 (Value Added Tax Act, 2025 — Act 1151):**
- The COVID-19 Health Recovery Levy has been **abolished** (previously 1% extra)
- NHIL and GETFund are now creditable as input tax — businesses can recover these on qualifying purchases, which reduces the actual cost to VAT-registered organizers
- The VAT Flat Rate Scheme has been **abolished** — everyone operates under the standard VAT regime
- Digital service providers must now issue E-VAT invoices via Ghana's centralised GRA invoicing system
- VAT registration threshold: **GHS 750,000 annual turnover** for goods; lower for services

**What this means for ticket pricing:**
If GoOutside or an organizer is VAT-registered and sells a GHS 100 ticket, up to GHS 20 of that is effectively tax. How this is presented to buyers (tax-inclusive vs. tax-exclusive) is a decision we address in Part 4.

### 2b. Electronic Transfer Levy (E-Levy) — ABOLISHED

On **2 April 2025**, President Mahama abolished the 1% E-Levy that previously applied to all mobile money transactions. This is very good news for GoOutside organizers and their fans:

- **No government levy on MoMo payments** (as of April 2025 onward)
- Buyers pay less at checkout
- Organizers receive more of their ticket revenue

### 2c. Withholding Tax

GoOutside, as a platform making payments to organizers, may be required to withhold tax at source under Ghana tax law in certain circumstances (e.g., for payments to non-registered businesses). For Founding Organizers and formally registered businesses, this is typically manageable via tax residency certificates. We will provide full guidance on this during payout setup.

---

## Part 3 — Payment Processing Fees (Paystack)

GoOutside processes all payments through **Paystack**, Africa's leading payment infrastructure company. Paystack is licensed by the Bank of Ghana and used by thousands of Ghanaian businesses.

### 3a. What Paystack charges per transaction

| Payment Method | Rate | On top of that |
|---|---|---|
| Local card (Visa, Mastercard, Verve) | 1.95% | Ghana VAT + NHIL + GETFund levies on the fee |
| MTN Mobile Money | 1.95% | Ghana VAT + NHIL + GETFund levies on the fee |
| Telecel Cash | 1.95% | Ghana VAT + NHIL + GETFund levies on the fee |
| AirtelTigo Money | 1.95% | Ghana VAT + NHIL + GETFund levies on the fee |
| Bank Transfer (GHS) | 1.95% | Ghana VAT + NHIL + GETFund levies on the fee |

Ghana's VAT/NHIL/GETFund is also levied on the Paystack fee itself (not the ticket price) — this is a technicality that Paystack handles automatically and deducts from the settlement amount.

**Effective Paystack cost per GHS 100 ticket ≈ GHS 1.95–2.34 depending on VAT treatment of the fee.**

### 3b. Payouts — what it costs to send money to organizers

When GoOutside sends collected revenue to an organizer's account, we use Paystack's transfer/payout infrastructure:

| Payout Method | Cost to GoOutside |
|---|---|
| Bank transfer (GHS) | Paystack transfer rate (typically covered in platform fee) |
| MTN MoMo | Paystack transfer rate |
| Telecel Cash | Paystack transfer rate |
| AirtelTigo Money | Paystack transfer rate |

These costs are absorbed in GoOutside's platform fee — organizers do not pay a separate "payout fee" on top of our commission.

### 3c. Mobile Money Network Fees (what buyers/senders pay to their network)

Even after the E-Levy was abolished, mobile money networks charge their own fees to users. These are **not** collected by GoOutside — they are charged by MTN, Telecel, and AirtelTigo directly to the user's wallet.

**MTN MoMo Ghana (2026 rates — verified):**

| Transaction Type | Amount Range | Fee |
|---|---|---|
| Send money (wallet to wallet) | GHS 0.01 – GHS 1,000 | 0.75% of amount |
| Send money (wallet to wallet) | GHS 1,000.01 and above | GHS 7.50 flat |
| Cash out (withdraw to cash) | GHS 1.00 – GHS 49.99 | GHS 0.50 flat |
| Cash out (withdraw to cash) | GHS 50.00 – GHS 1,999.99 | 1.0% of amount |
| Cash out (withdraw to cash) | GHS 2,000 and above | GHS 20.00 flat |
| MoMo → Bank account | Any amount | **Free** (proposed fee was suspended) |
| Receiving money | Any amount | **Free** |
| Paying bills / GoOutside checkout | Any amount | **Free to pay** |

**Important:** When a fan pays for a ticket at checkout via MTN MoMo, they are initiating a bill payment — **not** a wallet-to-wallet transfer. Bill payments are free on MTN MoMo. The fan pays the ticket price only, with no additional MoMo network charge.

---

## Part 4 — Ticket Pricing: VAT-Inclusive vs. VAT-Exclusive

This is one of the most important financial decisions for an event platform operating in Ghana. Here is what each model means:

### Model A — VAT-Inclusive (Price shown = total price, tax inside)

The price the organizer sets is the total the fan pays. VAT is extracted from within that price.

**Example: GHS 100 ticket**

| What the fan pays | GHS 100.00 |
|---|---|
| VAT (extracted from GHS 100) | − GHS 16.67 |
| Paystack fee (1.95% of GHS 100) | − GHS 1.95 |
| GoOutside platform fee (5% of GHS 100) | − GHS 5.00 |
| **Organizer receives** | **GHS 76.38** |

**Pros:** Simple for the buyer — the price is the price. Standard in consumer retail.
**Cons:** Organizer receives less than the face value they expected.

---

### Model B — VAT-Exclusive (Tax added on top at checkout)

The organizer sets the base price. Tax is added at checkout so the buyer sees the full breakdown.

**Example: GHS 100 base ticket**

| Organizer base price | GHS 100.00 |
|---|---|
| VAT added at checkout (20%) | + GHS 20.00 |
| **Fan pays total** | **GHS 120.00** |
| Paystack fee (1.95% of GHS 120) | − GHS 2.34 |
| GoOutside platform fee (5% of GHS 100) | − GHS 5.00 |
| VAT remitted to GRA | − GHS 20.00 |
| **Organizer receives** | **GHS 92.66** |

**Pros:** Organizer keeps closer to their target price. Transparent for buyers.
**Cons:** The final price at checkout is higher than the advertised price — can cause cart abandonment.

---

### Model C — Fee-Inclusive (Recommended for GoOutside launch)

GoOutside charges a service fee that is shown to the buyer as a line item. Organizer sets the face value and receives it in full (minus our fee which is paid by the buyer).

**Example: GHS 100 face value ticket**

| Face value (what organizer sets) | GHS 100.00 |
|---|---|
| GoOutside service fee (shown to buyer) | + GHS 7.00 |
| Paystack processing fee (shown to buyer) | + GHS 2.00 |
| **Fan pays total** | **GHS 109.00** |
| Paystack fee deducted | − GHS 2.00 |
| GoOutside fee deducted | − GHS 7.00 |
| **Organizer receives** | **GHS 100.00** |

**Pros:** Organizer always receives their stated face value. Buyers see exactly what they're paying and why. Industry standard (Dice, Ticketmaster use this model).
**Cons:** Headline price is not the final price.

> **GoOutside's recommended approach for launch:** VAT-inclusive on the face value, with a transparent GoOutside service fee added to the buyer total. This balances simplicity for organizers with honesty for buyers.

---

## Part 5 — GoOutside Fee Structure

### 5a. Platform fee schedule

| Organizer tier | Platform fee | Applied to |
|---|---|---|
| **Founding Organizer** (first 12 events) | **0%** | Ticket face value |
| **Standard organizer** | **5%** | Ticket face value |
| **Free events** | **0%** | Always free to list and attend |
| **Partner / enterprise** | Custom (contact us) | Negotiated |

### 5b. How the 5% is calculated

The platform fee is taken from the **ticket face value** — not the gross amount including service fees. This protects organizers from compound fee stacking.

**Example: GHS 200 ticket at 5% platform fee**

| Item | Amount |
|---|---|
| Ticket face value | GHS 200.00 |
| GoOutside platform fee (5%) | GHS 10.00 |
| Paystack processing (1.95%) | GHS 3.90 |
| Gross deducted from ticket | GHS 13.90 |
| **Organizer net per ticket** | **GHS 186.10** |
| **Effective organizer cut** | **93.05%** |

### 5c. What the 5% covers

GoOutside's fee is not arbitrary. It funds:

- **Platform infrastructure** — servers, database, mobile apps, the GoOutside feed
- **Paystack settlement costs** — we absorb transfer fees so organizers don't pay twice
- **Buyer protection** — dispute resolution, fraud monitoring, refund processing
- **Marketing & discovery** — your events appear in the GoOutside feed and get promoted to relevant users
- **Support** — organizer support team, ticket issue resolution
- **Product development** — new features built based on organizer feedback

### 5d. Founding Organizer benefit (0% fee)

The first wave of organizers on GoOutside pay zero platform fee on their first 12 events. After that, the standard 5% applies. This is a permanent record on your account — it does not expire after 12 events, it simply transitions to the standard tier for events 13 onwards.

**What this is worth in money:**

| Event size | Avg ticket | Total revenue | Founding benefit (0% vs 5%) |
|---|---|---|---|
| 100 attendees | GHS 80 | GHS 8,000 | GHS 400 saved per event |
| 250 attendees | GHS 100 | GHS 25,000 | GHS 1,250 saved per event |
| 500 attendees | GHS 150 | GHS 75,000 | GHS 3,750 saved per event |

Over 12 events at 250 attendees × GHS 100 average: **GHS 15,000 in fee savings**.

---

## Part 6 — Escrow: How Your Money Is Protected

### What is escrow?

Escrow is a neutral holding account where money sits safely between two parties until specific conditions are met. Banks, lawyers, and payment platforms use escrow globally for exactly this reason — it protects both the buyer and the seller.

### How GoOutside uses escrow

1. **Fan pays:** Money moves from the fan's card/MoMo into a GoOutside escrow pool managed by Paystack
2. **Ticket issued:** Fan receives their digital ticket immediately — the money movement is separate from the ticket
3. **Event runs:** Revenue stays in escrow during the event period
4. **48-hour hold:** After the event ends, we hold for 48 hours. This window handles:
   - Last-minute refund disputes
   - Ticket fraud claims from buyers
   - Force majeure (event cancelled, etc.)
5. **Funds released:** After the 48-hour hold, money is marked as "Available" in your organizer dashboard
6. **Payout:** You initiate withdrawal (or it happens automatically on your chosen schedule) to your linked bank or MoMo

### Why 48 hours?

This is standard practice globally:
- Eventbrite: up to 5 business days post-event
- Luma: depends on Stripe (typically 2-7 days)
- Dice: 5-10 business days post-event
- **GoOutside: 48 hours** — faster than most competitors

### What happens if an event is cancelled?

- **Organizer-initiated cancellation:** All ticket holders are automatically refunded in full. Organizer receives nothing.
- **Force majeure (flood, curfew, etc.):** Handled case-by-case. Organizer notified first.
- **Individual refund requests:** Deducted from organizer's pending balance per the refund policy set at event creation.

### Refund policies organizers can set

| Policy | What it means |
|---|---|
| **No refunds** | All sales are final once purchased |
| **Full refund up to 7 days before event** | Fan can cancel within 7 days of the event date |
| **Full refund up to 48h before event** | Closer window — good for last-minute events |
| **Custom** | Organizer writes a custom policy shown at checkout |

---

## Part 7 — KYC: Know Your Customer

### What is KYC?

KYC ("Know Your Customer") is a legal requirement for all financial platforms in Ghana. It means verifying who you are before you can receive or send money. This protects against fraud, money laundering, and terrorism financing.

### Ghana's legal framework

GoOutside operates under:
- **Anti-Money Laundering Act, 2020 (Act 1044)** — the primary AML law
- **Payment Systems and Services Act, 2019 (Act 987)** — governs payment providers
- **Bank of Ghana oversight** — supervises all licensed payment service providers
- **Financial Intelligence Centre (FIC)** — monitors suspicious transactions

### What GoOutside collects from organizers (KYC)

When you set up payouts, we collect:

| Information | Why we need it |
|---|---|
| Full legal name | Identity verification (AML Act 1044) |
| Ghana Card number | Primary identity document (BoG requirement) |
| Phone number | Linked to MoMo account and contact |
| Business registration (if applicable) | Required for VAT and tax compliance |
| Bank account or MoMo number | Where we send your money |
| Tax Identification Number (TIN) | Required for payments above GHS 2,000 per month |

### What GoOutside collects from buyers (KYC-lite)

Buyers go through a lighter verification during checkout:
- Email address (receipt delivery)
- Phone number (if paying by MoMo)
- Name on card (if paying by card — verified by Paystack/card network)

Full ID verification for buyers is only triggered if a transaction is flagged by our fraud system.

### Data protection

All KYC data is encrypted at rest and in transit. We do not sell or share your identity data with third parties. We comply with Ghana's **Data Protection Act, 2012 (Act 843)** and are registered with the Data Protection Commission.

---

## Part 8 — Competitor Comparison

### 8a. Fee comparison — what platforms charge

| Platform | Organizer pays | Buyer pays | Notes |
|---|---|---|---|
| **GoOutside (Standard)** | 5% + 1.95% Paystack | Nothing extra | Founding organizers pay 0% |
| **GoOutside (Founding)** | 0% + 1.95% Paystack | Nothing extra | First 12 events |
| **Eventbrite** | 3.7% + $1.79/ticket + 2.9% | Service fee (passed to buyer optionally) | Fees in USD; can be passed to buyer |
| **Luma (free plan)** | 5% + 2.9% + $0.30 | Nothing extra | Stripe-powered |
| **Luma (Plus, $69/mo)** | 0% + 2.9% + $0.30 | Nothing extra | Monthly subscription required |
| **Dice FM** | 0% (face value paid in full) | ~10% booking fee | Dice charges buyers, organizers are unaffected |
| **Ticketmaster** | Negotiated (large venues only) | 27–28% on top of ticket price | Service + facility + order fees — extremely high |

### 8b. Payout speed comparison

| Platform | Payout timeline |
|---|---|
| **GoOutside** | 48 hours after event ends |
| Eventbrite | 5 business days after event |
| Luma | 2–7 business days (Stripe schedule) |
| Dice | 5–10 business days after event |
| Ticketmaster | Up to 30 business days |

### 8c. Ghana-readiness comparison

| Platform | MoMo support | GHS currency | Local support | Ghana law compliant |
|---|---|---|---|---|
| **GoOutside** | ✓ MTN, Telecel, AirtelTigo | ✓ GHS native | ✓ Based in Accra | ✓ Built for Ghana |
| Eventbrite | ✗ | ✗ (USD) | ✗ | Partial |
| Luma | ✗ | ✗ (USD/EUR) | ✗ | ✗ |
| Dice | ✗ | ✗ (GBP/USD) | ✗ | ✗ |
| Ticketmaster | ✗ | ✗ | ✗ | ✗ |

**GoOutside is the only platform built for Ghana's event market.** Every competitor requires Ghanaian organizers to deal with USD conversion losses, no MoMo acceptance, foreign support teams, and platforms that have never heard of Accra. Our entire system is built in GHS, for Ghanaian audiences, with local payment methods, from day one.

---

## Part 9 — Full Ticket Price Walkthrough

This section shows exactly what happens to a ticket price from the moment it's set to the moment the organizer receives money. We show three real-world examples.

### Example 1 — Free event (GHS 0)

| Item | Amount |
|---|---|
| Ticket price | GHS 0 |
| GoOutside fee | GHS 0 |
| Paystack fee | GHS 0 |
| Fan pays | GHS 0 |
| Organizer receives | GHS 0 (all revenue is attendance, not cash) |

Free events cost nothing. No fees. No catch.

---

### Example 2 — Budget event (GHS 50 ticket, Founding Organizer)

| Item | Amount |
|---|---|
| Ticket face value | GHS 50.00 |
| GoOutside platform fee (0% — Founding) | GHS 0.00 |
| Paystack processing (1.95%) | − GHS 0.98 |
| **Organizer receives per ticket** | **GHS 49.03** |
| **Organizer keeps** | **98.1%** |

---

### Example 3 — Standard event (GHS 150 ticket, Standard tier)

| Item | Amount |
|---|---|
| Ticket face value | GHS 150.00 |
| GoOutside platform fee (5%) | − GHS 7.50 |
| Paystack processing (1.95%) | − GHS 2.93 |
| **Organizer receives per ticket** | **GHS 139.58** |
| **Organizer keeps** | **93.1%** |

---

### Example 4 — Premium event (GHS 500 ticket, Standard tier, 300 attendees)

| Item | Amount |
|---|---|
| Ticket face value per ticket | GHS 500.00 |
| Total gross revenue (300 tickets) | GHS 150,000.00 |
| GoOutside platform fee (5%) | − GHS 7,500.00 |
| Paystack processing (1.95%) | − GHS 2,925.00 |
| **Total organizer payout** | **GHS 139,575.00** |
| **Organizer keeps** | **93.1%** |

---

## Part 10 — Financial Precision: How We Store Money

This section exists because getting money math wrong is not an option. A single floating-point rounding error, compounded across thousands of transactions, creates real losses — either for organizers or for the business.

### The problem with "doubles" (floating-point numbers)

Many software systems store money as `FLOAT` or `DOUBLE` values (the data types you mentioned). These are inherently imprecise:

```
0.1 + 0.2 = 0.30000000000000004   ← actual result in floating-point math
```

This is not acceptable for financial systems. A rounding error of GHS 0.01 on 1,000,000 transactions is GHS 10,000 lost or gained without a trace.

### How GoOutside stores money

All monetary values in GoOutside's database are stored as **`NUMERIC(12, 2)`** — a fixed-precision decimal type:

| What this means | Detail |
|---|---|
| `12` digits total | Up to GHS 9,999,999,999.99 per value |
| `2` decimal places | Exact cents (pesewas) — no rounding drift |
| Exact arithmetic | 0.10 + 0.20 = exactly 0.30, every time |
| Audit-safe | Every amount stored is the exact amount agreed |

**No money value in our system is ever stored as FLOAT or DOUBLE.** This is non-negotiable and enforced at the database schema level.

### Fee calculations use integer arithmetic

To avoid even the smallest chance of floating-point error in calculations, our fee engine converts all amounts to **pesewas** (integer cents) before arithmetic, then converts back:

```
GHS 150.00 → 15000 pesewas
5% fee     → 750 pesewas (exact integer)
Payout     → 14250 pesewas → GHS 142.50 (exact)
```

This is the same approach used by Stripe, Paystack, and all major fintech infrastructure companies globally.

---

## Part 11 — Business Model Summary

### How GoOutside makes money

| Revenue stream | How it works | Status |
|---|---|---|
| Platform fee (5%) | Deducted from every paid ticket | Live at launch |
| Event promotion / boosting | Organizers pay to amplify reach beyond organic | Planned |
| Sponsored feed placement | Brands pay for featured placement in the app feed | Planned |
| Data insights (anonymised) | Aggregate attendance & trend reports for brands | Future |
| White-label / enterprise | Custom GoOutside deployments for large venues | Future |

### What GoOutside does NOT do

- We do not sell your attendee data to third parties
- We do not take a cut of merchandise, bar sales, or secondary transactions
- We do not charge organizers a monthly subscription to use the platform
- We do not charge listing fees for events

### Unit economics at scale

| Metric | Assumption | At 10,000 tickets/month |
|---|---|---|
| Average ticket price | GHS 120 | GHS 1,200,000 GMV |
| GoOutside revenue (5%) | 5% | GHS 60,000/month |
| Paystack cost (1.95%) | 1.95% | − GHS 23,400/month |
| Net platform revenue | 3.05% | GHS 36,600/month |
| Payout to organizers | 93.1% | GHS 1,117,200/month |

At 100,000 tickets/month (which is achievable within 24 months in Accra), GoOutside generates approximately **GHS 366,000 net platform revenue monthly** while paying out over **GHS 11 million to Ghanaian event organizers**.

---

## Part 12 — What We're Building Next

The current state of GoOutside payments is functional but incomplete. Here is an honest view of what works today and what is coming:

| Feature | Status | When |
|---|---|---|
| Paystack checkout (card + MoMo) | ✓ Live | Now |
| Ticket creation after payment | Building | Q3 2026 |
| Email ticket delivery | Building | Q3 2026 |
| Organizer payout dashboard | Designing | Q3 2026 |
| Bank account / MoMo payout setup | Designing | Q3 2026 |
| On-demand withdrawal | Q4 2026 | Q4 2026 |
| Automatic payout schedule | Q4 2026 | Q4 2026 |
| Paystack Payment Links ("Quick Pay") | Q4 2026 | Q4 2026 |
| VAT invoice generation (E-VAT compliant) | Q1 2027 | Q1 2027 |
| Earnings CSV / PDF download | Q4 2026 | Q4 2026 |

---

## Appendix A — Glossary

| Term | Plain-English meaning |
|---|---|
| **Escrow** | A neutral holding account where money sits safely until conditions are met — no one can spend it until the deal is done |
| **KYC** | "Know Your Customer" — the legal process of verifying who you are before you can send or receive money |
| **AML** | "Anti-Money Laundering" — laws preventing criminals from using payment systems to hide illegal money |
| **VAT** | Value Added Tax — a government tax collected at each stage of a commercial transaction |
| **NHIL** | National Health Insurance Levy — a 2.5% Ghana levy on VATable services that funds health insurance |
| **GETFund** | Ghana Education Trust Fund Levy — a 2.5% levy on VATable services that funds education infrastructure |
| **E-Levy** | Electronic Transfer Levy — a 1% government tax on mobile money transactions, **abolished April 2025** |
| **Paystack** | The payment processing company GoOutside uses. Licensed by the Bank of Ghana. Handles all card and MoMo transactions |
| **MoMo** | Mobile Money — Ghana's mobile-phone-based payment system (MTN MoMo, Telecel Cash, AirtelTigo Money) |
| **Platform fee** | GoOutside's commission (5%) for providing the ticketing platform, feed, audience, and infrastructure |
| **Processing fee** | Paystack's fee (1.95%) for moving the money securely |
| **Settlement** | When Paystack releases collected payment funds to GoOutside after confirming the transaction succeeded |
| **Payout** | When GoOutside sends the organizer's net revenue to their bank account or MoMo wallet |
| **NUMERIC(12,2)** | The exact data type used to store money in our database — guarantees zero rounding errors |
| **Founding Organizer** | The first wave of organizers on GoOutside, who receive 0% platform fee on their first 12 events |
| **GMV** | Gross Merchandise Value — the total value of all tickets sold through the platform (before any fees) |
| **GRA** | Ghana Revenue Authority — the government body that collects taxes |
| **FIC** | Financial Intelligence Centre — monitors suspicious financial activity in Ghana |

---

## Appendix B — Regulatory Contacts & References

| Body | Role | Reference |
|---|---|---|
| Ghana Revenue Authority (GRA) | VAT registration and compliance | gra.gov.gh |
| Bank of Ghana (BoG) | Licensing payment service providers | bog.gov.gh |
| Financial Intelligence Centre (FIC) | AML compliance and reporting | fic.gov.gh |
| Data Protection Commission | Personal data handling | dataprotection.org.gh |
| Paystack Ghana | Payment processing partner | paystack.com/gh |

---

*This document is accurate as of June 2026. Tax rates, levy structures, and platform fees are subject to change. GoOutside will notify all organizers of any changes to fees with a minimum of 30 days' notice. For questions, contact the GoOutside team directly — reply to your invitation email or reach us at hello@gooutside.club.*
