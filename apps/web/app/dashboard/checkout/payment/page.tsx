"use client";

import { useState, useEffect } from "react";
import { useCart } from "../../../../components/cart/CartContext";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Phone,
  CheckCircle,
  Lock,
  WarningCircle,
} from "@phosphor-icons/react";
import { Progress } from "../../../../components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

type PaymentMethod = "mobile_money" | "card";
type MomoNetwork   = "mtn" | "vodafone" | "airteltigo";

const GHANA_PHONE = /^\+233[0-9]{9}$/;

function nanoidShort() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

async function purchaseTickets(
  items: ReturnType<typeof useCart>["items"],
  attendee: { name: string; email: string },
  reference: string,
  method: PaymentMethod,
  network?: MomoNetwork,
) {
  const body = items.map((item) => ({
    eventId:       item.eventId,
    tierId:        item.tier.id,
    tierName:      item.tier.name,
    price:         item.tier.price,
    quantity:      item.quantity,
    attendeeName:  attendee.name,
    attendeeEmail: attendee.email,
    paymentReference: reference,
    paymentMethod: method,
    paymentNetwork: network ?? null,
  }));

  const res = await fetch("/api/tickets/purchase", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) console.error("[purchaseTickets]", await res.json());
}

export default function PaymentPage() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("mobile_money");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [momoNumber, setMomoNumber] = useState("");
  const [momoNetwork, setMomoNetwork] = useState<MomoNetwork>("mtn");
  const [momoError, setMomoError] = useState<string | null>(null);
  const [attendee, setAttendee] = useState({ name: "", email: "" });

  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem("checkout-attendee") ?? "{}");
      if (stored.name || stored.email) setAttendee(stored);
    } catch { /* ignore */ }
  }, []);

  if (items.length === 0 && !success) {
    router.replace("/dashboard/checkout");
    return null;
  }

  function validateMomo(): boolean {
    const normalized = momoNumber.replace(/\s/g, "");
    if (!GHANA_PHONE.test(normalized)) {
      setMomoError("Enter a valid Ghana number: +233 XX XXX XXXX");
      return false;
    }
    setMomoError(null);
    return true;
  }

  function handlePay() {
    if (method === "mobile_money" && !validateMomo()) return;

    setLoading(true);
    const reference = `GO-${nanoidShort()}`;

    if (totalPrice === 0) {
      purchaseTickets(items, attendee, reference, method).then(() => {
        sessionStorage.removeItem("checkout-attendee");
        setLoading(false);
        setSuccess(true);
        clearCart();
      });
      return;
    }

    const launch = () => {
      // @ts-expect-error paystack global
      const handler = window.PaystackPop?.setup({
        key:       process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
        email:     attendee.email || "customer@gooutside.app",
        amount:    totalPrice * 100,
        currency:  "GHS",
        reference,
        channels:  method === "mobile_money" ? ["mobile_money"] : ["card"],
        metadata: {
          phone:   momoNumber.replace(/\s/g, ""),
          network: momoNetwork,
        },
        callback: () => {
          purchaseTickets(items, attendee, reference, method, momoNetwork).then(() => {
            sessionStorage.removeItem("checkout-attendee");
            setLoading(false);
            setSuccess(true);
            clearCart();
          });
        },
        onClose: () => setLoading(false),
      });
      handler?.openIframe();
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

  if (success) {
    return (
      <main className="page-grid min-h-screen pb-24">
        <div className="container-shell flex flex-col items-center justify-center gap-6 py-20 text-center px-4">
          <motion.div
            animate={{ scale: 1, opacity: 1 }}
            className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--brand-dim)]"
            initial={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <CheckCircle size={52} weight="fill" className="text-[var(--brand)]" />
          </motion.div>
          <div>
            <h1 className="text-[26px] font-bold text-[var(--text-primary)]">Payment Successful!</h1>
            <p className="mt-2 text-[15px] text-[var(--text-tertiary)]">
              Your tickets are confirmed. Check your email for the receipt.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              className="rounded-2xl bg-[var(--brand)] px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[var(--brand-hover)]"
              onClick={() => router.push("/cart")}
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

  return (
    <main className="page-grid min-h-screen pb-24">
      <div className="container-shell px-4 py-6 md:py-10">
        <div className="mx-auto max-w-lg">
          <button
            className="mb-6 flex items-center gap-2 text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeft size={16} weight="bold" />
            Back to Checkout
          </button>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-[22px] font-bold text-[var(--text-primary)]">Secure Payment</h1>
              <span className="text-[13px] text-[var(--text-tertiary)]">Step 2 of 2</span>
            </div>
            <Progress value={100} className="h-1.5" />
          </div>

          {/* Security badge */}
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand-dim)] px-4 py-3">
            <ShieldCheck size={22} weight="fill" className="text-[var(--brand)] shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-[var(--brand)]">256-bit SSL encrypted</p>
              <p className="text-[12px] text-[var(--text-tertiary)]">
                Your payment info is never stored on our servers
              </p>
            </div>
          </div>

          {/* Payment method selector — MoMo + Card only */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 mb-5">
            <h2 className="mb-4 text-[15px] font-bold text-[var(--text-primary)]">Payment Method</h2>

            <div className="grid grid-cols-2 gap-2 mb-5">
              {([
                { id: "mobile_money", label: "Mobile Money", icon: Phone },
                { id: "card",         label: "Card",         icon: CreditCard },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3.5 px-2 transition-all text-center ${
                    method === id
                      ? "border-[var(--brand)] bg-[var(--brand-dim)]"
                      : "border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                  }`}
                  onClick={() => setMethod(id)}
                  type="button"
                >
                  <Icon
                    size={20}
                    weight="fill"
                    className={method === id ? "text-[var(--brand)]" : "text-[var(--text-tertiary)]"}
                  />
                  <span className={`text-[11px] font-semibold ${method === id ? "text-[var(--brand)]" : "text-[var(--text-secondary)]"}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {method === "mobile_money" && (
                <motion.div
                  key="momo"
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  initial={{ opacity: 0, y: 8 }}
                  className="space-y-3"
                >
                  <div>
                    <label className="mb-2 block text-[12px] font-semibold text-[var(--text-secondary)]">
                      Network
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["mtn", "vodafone", "airteltigo"] as const).map((net) => (
                        <button
                          key={net}
                          className={`rounded-xl border-2 py-2.5 text-[12px] font-semibold transition-all uppercase ${
                            momoNetwork === net
                              ? "border-[var(--brand)] bg-[var(--brand-dim)] text-[var(--brand)]"
                              : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)]"
                          }`}
                          onClick={() => setMomoNetwork(net)}
                          type="button"
                        >
                          {net === "airteltigo" ? "AirtelTigo" : net.charAt(0).toUpperCase() + net.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[var(--text-secondary)]">
                      Mobile Number
                    </label>
                    <div className={`flex items-center gap-2.5 rounded-xl border bg-[var(--bg-surface)] px-3.5 py-2.5 ${
                      momoError ? "border-red-400" : "border-[var(--border-default)]"
                    }`}>
                      <Phone size={15} className="text-[var(--text-tertiary)] shrink-0" />
                      <input
                        className="flex-1 bg-transparent text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                        onChange={(e) => { setMomoNumber(e.target.value); setMomoError(null); }}
                        onBlur={validateMomo}
                        placeholder="+233 24 000 0000"
                        type="tel"
                        value={momoNumber}
                      />
                    </div>
                    {momoError ? (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-400">
                        <WarningCircle size={11} weight="fill" /> {momoError}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">
                        You'll receive a USSD prompt on your phone to approve the payment
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {method === "card" && (
                <motion.div
                  key="card"
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  initial={{ opacity: 0, y: 8 }}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-center space-y-2"
                >
                  <CreditCard size={28} className="mx-auto text-[var(--brand)]" weight="duotone" />
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                    Paystack Secure Card Form
                  </p>
                  <p className="text-[12px] text-[var(--text-tertiary)]">
                    Clicking "Pay" opens Paystack's PCI-compliant card modal. We never touch your card details.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order total */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 mb-5">
            <div className="flex items-center justify-between text-[15px]">
              <span className="text-[var(--text-secondary)]">Total to pay</span>
              <span className="font-bold text-[var(--text-primary)]">
                {totalPrice === 0 ? "Free" : `GHS ${totalPrice.toLocaleString()}`}
              </span>
            </div>
            {attendee.email && (
              <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">
                Receipt to: {attendee.email}
              </p>
            )}
          </div>

          <button
            className="w-full rounded-2xl bg-[var(--brand)] py-4 text-[16px] font-semibold text-white transition hover:bg-[var(--brand-hover)] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
            disabled={loading || (method === "mobile_money" && !momoNumber)}
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
                <Lock size={16} weight="bold" />
                Pay {totalPrice === 0 ? "Free" : `GHS ${totalPrice.toLocaleString()}`}
              </>
            )}
          </button>

          <p className="mt-4 text-center text-[12px] text-[var(--text-tertiary)]">
            By paying you agree to our Terms of Service. Powered by Paystack.
          </p>
        </div>
      </div>
    </main>
  );
}
