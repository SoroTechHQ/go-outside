"use client";

import { useState, useEffect } from "react";
import { useCart } from "../../../components/cart/CartContext";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CalendarBlank,
  CheckCircle,
  CreditCard,
  Lock,
  MapPin,
  Phone,
  ShieldCheck,
  Tag,
  Ticket,
  User,
  EnvelopeSimple,
  WarningCircle,
} from "@phosphor-icons/react";

// ── Validation ────────────────────────────────────────────────────────────────

type ContactErrors = { name?: string; email?: string };

function validateContact(name: string, email: string): ContactErrors {
  const errors: ContactErrors = {};
  if (!name.trim() || name.trim().length < 2) errors.name = "Enter your full name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address";
  return errors;
}

type PaymentMethod = "mobile_money" | "card";
type MomoNetwork   = "mtn" | "vodafone" | "airteltigo";
type PaystackTransaction = { reference?: string; transaction?: string; status?: string };
type CheckoutDefaults = {
  checkout_details_enabled?: boolean;
  checkout_attendee_name?: string | null;
  checkout_attendee_email?: string | null;
  checkout_mobile_number?: string | null;
  checkout_mobile_network?: MomoNetwork | null;
};

// Ghana numbers — all three formats accepted:
//   0XXXXXXXXX   (10 digits, local format)
//   233XXXXXXXXX (12 digits, no leading +)
//   +233XXXXXXXXX (12 digits, E.164)
// Spaces, dashes, and parentheses are stripped before testing.
function normalizeGhanaPhone(raw: string): string | null {
  const s = raw.replace(/[\s\-().]/g, "");
  if (/^0[0-9]{9}$/.test(s))       return "+233" + s.slice(1); // 0247... → +233247...
  if (/^\+233[0-9]{9}$/.test(s))   return s;                   // +233247...
  if (/^233[0-9]{9}$/.test(s))     return "+" + s;             // 233247... → +233247...
  return null;
}

// Map the 2-digit subscriber prefix (after +233) to a network.
// Sources: NCA Ghana operator prefix allocations.
const MTN_PREFIXES       = ["24", "25", "53", "54", "55", "59"];
const VODAFONE_PREFIXES  = ["20", "50"];
const AIRTELTIGO_PREFIXES= ["26", "27", "56", "57"];

function inferNetwork(e164: string): MomoNetwork | null {
  const prefix = e164.slice(4, 6); // +233 is 4 chars; next 2 are the operator code
  if (MTN_PREFIXES.includes(prefix))        return "mtn";
  if (VODAFONE_PREFIXES.includes(prefix))   return "vodafone";
  if (AIRTELTIGO_PREFIXES.includes(prefix)) return "airteltigo";
  return null;
}

function nanoidShort() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { items, totalPrice, totalCount, clearCart } = useCart();
  const router = useRouter();
  const { user: clerkUser } = useUser();

  // Contact
  const [form, setForm] = useState({ name: "", email: "" });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [touched, setTouched] = useState({ name: false, email: false });

  // Promo
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  // Payment
  const [method, setMethod] = useState<PaymentMethod>("mobile_money");
  const [momoNetwork, setMomoNetwork] = useState<MomoNetwork>("mtn");
  const [momoNumber, setMomoNumber] = useState("");
  const [momoError, setMomoError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const discount = promoApplied ? Math.floor(totalPrice * 0.1) : 0;
  const finalTotal = totalPrice - discount;

  useEffect(() => {
    if (!clerkUser) return;
    setForm((current) => ({
      name:  current.name || clerkUser.fullName || `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim(),
      email: current.email || clerkUser.primaryEmailAddress?.emailAddress || "",
    }));
    const clerkPhone = clerkUser.phoneNumbers?.[0]?.phoneNumber;
    if (clerkPhone) setMomoNumber((current) => current || clerkPhone);
  }, [clerkUser]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/users/me", { cache: "no-store" })
      .then((res) => res.ok ? res.json() : null)
      .then((data: CheckoutDefaults | null) => {
        if (cancelled || !data?.checkout_details_enabled) return;
        setForm((current) => ({
          name: data.checkout_attendee_name || current.name,
          email: data.checkout_attendee_email || current.email,
        }));
        if (data.checkout_mobile_number) setMomoNumber(data.checkout_mobile_number);
        if (data.checkout_mobile_network) setMomoNetwork(data.checkout_mobile_network);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const isContactValid = Object.keys(validateContact(form.name, form.email)).length === 0;

  function handleBlur(field: "name" | "email") {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validateContact(form.name, form.email));
  }

  function validateMomo(): boolean {
    const normalized = normalizeGhanaPhone(momoNumber);
    if (!normalized) {
      setMomoError("Enter a valid Ghana number: 0247153173, 233247153173, or +233247153173");
      return false;
    }
    setMomoError(null);
    setMomoNumber(normalized); // canonicalize to E.164 on blur
    return true;
  }

  async function completePurchase(reference: string | null, selectedMethod: PaymentMethod, selectedNetwork?: MomoNetwork) {
    const body = items.map((item) => ({
      eventId:           item.eventId,
      tierId:            item.tier.id,
      quantity:          item.quantity,
      attendeeName:      form.name.trim(),
      attendeeEmail:     form.email.trim(),
      ...(reference ? { paymentReference: reference } : {}),
      ...(reference ? { paymentMethod: selectedMethod, paymentNetwork: selectedNetwork ?? null } : {}),
    }));

    const res = await fetch("/api/tickets/purchase", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error ?? "Could not confirm tickets");
    }
  }

  function handlePay() {
    setTouched({ name: true, email: true });
    const contactErrs = validateContact(form.name, form.email);
    setErrors(contactErrs);
    if (Object.keys(contactErrs).length > 0) return;
    if (finalTotal > 0 && method === "mobile_money" && !validateMomo()) return;

    setLoading(true);
    setPaymentError(null);
    const paymentAmount = Math.round(finalTotal * 100);

    if (finalTotal === 0) {
      completePurchase(null, method).then(() => {
        setLoading(false);
        setSuccess(true);
        clearCart();
      }).catch((err: unknown) => {
        setPaymentError(err instanceof Error ? err.message : "Could not confirm tickets");
        setLoading(false);
      });
      return;
    }

    const reference = `GO-${nanoidShort()}`;

    const launch = () => {
      const normalizedPhone = method === "mobile_money" ? normalizeGhanaPhone(momoNumber) ?? momoNumber.replace(/\s/g, "") : null;
      // @ts-expect-error paystack global
      const handler = window.PaystackPop?.setup({
        key:      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
        email:    form.email || "customer@gooutside.club",
        amount:   paymentAmount,
        currency: "GHS",
        reference,
        channels: method === "mobile_money" ? ["mobile_money"] : ["card"],
        ...(normalizedPhone ? { phone: normalizedPhone } : {}),
        metadata: {
          localReference: reference,
          phone: normalizedPhone,
          network: method === "mobile_money" ? momoNetwork : null,
        },
        callback: (transaction: PaystackTransaction) => {
          const completedReference = transaction?.reference ?? reference;
          completePurchase(completedReference, method, method === "mobile_money" ? momoNetwork : undefined).then(() => {
            setLoading(false);
            setSuccess(true);
            clearCart();
          }).catch((err: unknown) => {
            setPaymentError(err instanceof Error ? err.message : "Could not confirm tickets");
            setLoading(false);
          });
        },
        onClose: () => setLoading(false),
      });
      if (!handler) {
        setPaymentError("Could not load Paystack checkout");
        setLoading(false);
        return;
      }
      handler.openIframe();
    };

    if (document.getElementById("paystack-js")) {
      launch();
    } else {
      const script = document.createElement("script");
      script.id   = "paystack-js";
      script.src  = "https://js.paystack.co/v1/inline.js";
      script.onload = launch;
      document.head.appendChild(script);
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────

  if (success) {
    return (
      <main className="page-grid min-h-screen pb-24">
        <div className="container-shell flex flex-col items-center justify-center gap-6 py-20 text-center px-4">
          <motion.div
            animate={{ scale: 1, opacity: 1 }}
            className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--brand-dim)]"
            initial={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 18, stiffness: 280 }}
          >
            <CheckCircle size={52} weight="fill" className="text-[var(--brand)]" />
          </motion.div>
          <div>
            <h1 className="text-[26px] font-bold text-[var(--text-primary)]">You&apos;re going!</h1>
            <p className="mt-2 text-[15px] text-[var(--text-tertiary)]">
              Tickets confirmed. Check your email for the receipt.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              className="rounded-2xl bg-[var(--brand)] px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[var(--brand-hover)]"
              onClick={() => router.push("/dashboard/wallets")}
              type="button"
            >
              View My Tickets
            </button>
            <button
              className="rounded-2xl border border-[var(--border-default)] px-6 py-3 text-[14px] font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-surface)]"
              onClick={() => router.push("/home")}
              type="button"
            >
              Explore Events
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Empty cart ─────────────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <main className="page-grid min-h-screen pb-24">
        <div className="container-shell flex flex-col items-center justify-center gap-4 py-20 text-center">
          <Ticket size={48} className="text-[var(--text-tertiary)]" weight="light" />
          <h1 className="text-[22px] font-bold text-[var(--text-primary)]">Your cart is empty</h1>
          <p className="text-[var(--text-tertiary)]">Browse events and add tickets to checkout.</p>
          <button
            className="mt-2 rounded-2xl bg-[var(--brand)] px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[var(--brand-hover)]"
            onClick={() => router.push("/")}
            type="button"
          >
            Browse Events
          </button>
        </div>
      </main>
    );
  }

  // ── Checkout form ──────────────────────────────────────────────────────────

  return (
    <main className="page-grid min-h-screen pb-24">
      <div className="container-shell px-4 py-6 md:py-10">
        <div className="mx-auto max-w-2xl">
          <button
            className="mb-6 flex items-center gap-2 text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeft size={16} weight="bold" />
            Back
          </button>

          <h1 className="mb-6 text-[22px] font-bold text-[var(--text-primary)]">Checkout</h1>

          <div className="grid gap-6 md:grid-cols-[1fr_320px]">
            {/* Left column */}
            <div className="space-y-5">

              {/* Contact details */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
                <h2 className="mb-4 text-[15px] font-bold text-[var(--text-primary)]">Contact Details</h2>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[var(--text-secondary)]">Full Name *</label>
                    <div className={`flex items-center gap-2.5 rounded-xl border bg-[var(--bg-surface)] px-3.5 py-2.5 ${touched.name && errors.name ? "border-red-400" : "border-[var(--border-default)]"}`}>
                      <User size={15} className="text-[var(--text-tertiary)] shrink-0" />
                      <input
                        className="flex-1 bg-transparent text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                        onBlur={() => handleBlur("name")}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Kofi Mensah"
                        type="text"
                        value={form.name}
                      />
                    </div>
                    {touched.name && errors.name && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-400">
                        <WarningCircle size={11} weight="fill" /> {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[var(--text-secondary)]">Email Address *</label>
                    <div className={`flex items-center gap-2.5 rounded-xl border bg-[var(--bg-surface)] px-3.5 py-2.5 ${touched.email && errors.email ? "border-red-400" : "border-[var(--border-default)]"}`}>
                      <EnvelopeSimple size={15} className="text-[var(--text-tertiary)] shrink-0" />
                      <input
                        className="flex-1 bg-transparent text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                        onBlur={() => handleBlur("email")}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="kofi@example.com"
                        type="email"
                        value={form.email}
                      />
                    </div>
                    {touched.email && errors.email && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-400">
                        <WarningCircle size={11} weight="fill" /> {errors.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Promo code */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
                <h2 className="mb-3 text-[15px] font-bold text-[var(--text-primary)]">Promo Code</h2>
                <div className="flex gap-2">
                  <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5">
                    <Tag size={15} className="text-[var(--text-tertiary)] shrink-0" />
                    <input
                      className="flex-1 bg-transparent text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] uppercase"
                      disabled={promoApplied}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="GOOUTSIDE10"
                      type="text"
                      value={promoCode}
                    />
                  </div>
                  <button
                    className={`rounded-xl px-4 py-2.5 text-[13px] font-semibold transition ${promoApplied ? "bg-[var(--brand-dim)] text-[var(--brand)]" : "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"}`}
                    disabled={promoApplied}
                    onClick={() => { if (promoCode.toLowerCase() === "gooutside10") setPromoApplied(true); }}
                    type="button"
                  >
                    {promoApplied ? "Applied" : "Apply"}
                  </button>
                </div>
                {promoApplied && (
                  <p className="mt-2 text-[12px] text-[var(--brand)]">10% discount applied! Saved GHS {discount.toLocaleString()}.</p>
                )}
              </div>

              {finalTotal === 0 ? (
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} weight="fill" className="text-[var(--brand)] shrink-0" />
                    <div>
                      <h2 className="text-[15px] font-bold text-[var(--text-primary)]">Free Reservation</h2>
                      <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">No payment method is needed for this order.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <ShieldCheck size={18} weight="fill" className="text-[var(--brand)] shrink-0" />
                    <h2 className="text-[15px] font-bold text-[var(--text-primary)]">Payment Method</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {([
                      { id: "mobile_money", label: "Mobile Money", icon: Phone },
                      { id: "card",         label: "Card",         icon: CreditCard },
                    ] as const).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3.5 px-2 transition-all text-center ${method === id ? "border-[var(--brand)] bg-[var(--brand-dim)]" : "border-[var(--border-subtle)] hover:border-[var(--border-default)]"}`}
                        onClick={() => setMethod(id)}
                        type="button"
                      >
                        <Icon size={20} weight="fill" className={method === id ? "text-[var(--brand)]" : "text-[var(--text-tertiary)]"} />
                        <span className={`text-[11px] font-semibold ${method === id ? "text-[var(--brand)]" : "text-[var(--text-secondary)]"}`}>{label}</span>
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {method === "mobile_money" && (
                      <motion.div key="momo" animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} initial={{ opacity: 0, y: 8 }} className="space-y-3">
                        <div>
                          <label className="mb-2 block text-[12px] font-semibold text-[var(--text-secondary)]">Network</label>
                          <div className="grid grid-cols-3 gap-2">
                            {(["mtn", "vodafone", "airteltigo"] as const).map((net) => (
                              <button
                                key={net}
                                className={`rounded-xl border-2 py-2.5 text-[12px] font-semibold transition-all uppercase ${momoNetwork === net ? "border-[var(--brand)] bg-[var(--brand-dim)] text-[var(--brand)]" : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)]"}`}
                                onClick={() => setMomoNetwork(net)}
                                type="button"
                              >
                                {net === "airteltigo" ? "AirtelTigo" : net.charAt(0).toUpperCase() + net.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[12px] font-semibold text-[var(--text-secondary)]">Mobile Number</label>
                          <div className={`flex items-center gap-2.5 rounded-xl border bg-[var(--bg-surface)] px-3.5 py-2.5 ${momoError ? "border-red-400" : "border-[var(--border-default)]"}`}>
                            <Phone size={15} className="text-[var(--text-tertiary)] shrink-0" />
                            <input
                              className="flex-1 bg-transparent text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                              onChange={(e) => {
                                const val = e.target.value;
                                setMomoNumber(val);
                                setMomoError(null);
                                const norm = normalizeGhanaPhone(val);
                                if (norm) {
                                  const detected = inferNetwork(norm);
                                  if (detected) setMomoNetwork(detected);
                                }
                              }}
                              onBlur={validateMomo}
                              placeholder="0247 153 173"
                              type="tel"
                              value={momoNumber}
                            />
                          </div>
                          {momoError ? (
                            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-400"><WarningCircle size={11} weight="fill" /> {momoError}</p>
                          ) : (
                            <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">You&apos;ll receive a USSD prompt to approve the payment</p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {method === "card" && (
                      <motion.div key="card" animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} initial={{ opacity: 0, y: 8 }} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-center space-y-2">
                        <CreditCard size={28} className="mx-auto text-[var(--brand)]" weight="duotone" />
                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">Paystack Secure Card Form</p>
                        <p className="text-[12px] text-[var(--text-tertiary)]">Clicking "Pay" opens Paystack&apos;s PCI-compliant card modal. We never touch your card details.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Right column — order summary + pay button */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 md:sticky md:top-4">
                <h2 className="mb-4 text-[15px] font-bold text-[var(--text-primary)]">Order Summary</h2>

                <div className="space-y-3 divide-y divide-[var(--border-subtle)]">
                  {items.map((item) => (
                    <div key={`${item.eventId}-${item.tier.id}`} className="pt-3 first:pt-0">
                      {item.eventImage && (
                        <img alt={item.eventTitle} className="mb-2.5 h-24 w-full rounded-xl object-cover" src={item.eventImage} />
                      )}
                      <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{item.eventTitle}</p>
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
                          <CalendarBlank size={11} weight="fill" />
                          {item.eventDate}
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
                          <MapPin size={11} weight="fill" />
                          {item.eventVenue}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[12px] text-[var(--text-tertiary)]">{item.tier.name} × {item.quantity}</span>
                        <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                          {item.tier.priceType === "free" ? "Free" : `GHS ${(item.tier.price * item.quantity).toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-1.5 border-t border-[var(--border-subtle)] pt-4">
                  <div className="flex items-center justify-between text-[13px] text-[var(--text-secondary)]">
                    <span>Subtotal ({totalCount} tickets)</span>
                    <span>GHS {totalPrice.toLocaleString()}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex items-center justify-between text-[13px] text-[var(--brand)]">
                      <span>Discount (10%)</span>
                      <span>-GHS {discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[13px] text-[var(--text-secondary)]">
                    <span>Processing fee</span>
                    <span>Free</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-2 text-[17px] font-bold text-[var(--text-primary)]">
                    <span>Total</span>
                    <span>{finalTotal === 0 ? "Free" : `GHS ${finalTotal.toLocaleString()}`}</span>
                  </div>
                </div>

                <button
                  className="mt-4 w-full rounded-2xl bg-[var(--brand)] py-3.5 text-[15px] font-semibold text-white transition hover:bg-[var(--brand-hover)] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
                  disabled={loading || !isContactValid || (finalTotal > 0 && method === "mobile_money" && !momoNumber)}
                  onClick={handlePay}
                  type="button"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Processing…
                    </span>
                  ) : (
                    <>
                      <Lock size={15} weight="bold" />
                      {finalTotal === 0 ? "Reserve Free Ticket" : `Pay GHS ${finalTotal.toLocaleString()}`}
                    </>
                  )}
                </button>

                {paymentError && (
                  <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-[12px] font-medium text-red-500">
                    {paymentError}
                  </p>
                )}

                {finalTotal > 0 && (
                  <p className="mt-3 text-center text-[11px] text-[var(--text-tertiary)]">
                    Secured by Paystack · 256-bit SSL encryption
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
