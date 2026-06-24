import Link from "next/link";
import {
  Envelope,
  InstagramLogo,
  LinkSimple,
  MegaphoneSimple,
  ShareNetwork,
  Ticket,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";

const CHANNELS = [
  {
    icon: ShareNetwork,
    title: "Share link",
    desc: "Copy and share your event link on any platform.",
    cta: "Copy link",
    color: "#2f8f45",
  },
  {
    icon: WhatsappLogo,
    title: "WhatsApp",
    desc: "Send a direct WhatsApp share link to your contacts.",
    cta: "Share via WhatsApp",
    color: "#25D366",
  },
  {
    icon: InstagramLogo,
    title: "Instagram",
    desc: "Create a shareable flyer and story card for Instagram.",
    cta: "Coming soon",
    color: "#E1306C",
    disabled: true,
  },
  {
    icon: Envelope,
    title: "Email blast",
    desc: "Send an announcement email to your past attendees.",
    cta: "Coming soon",
    color: "#3b82f6",
    disabled: true,
  },
];

export default function OrganizerMarketingPage() {
  return (
    <div className="p-5 md:p-7 space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Marketing</p>
        <h1 className="mt-0.5 text-[1.6rem] font-bold tracking-tight text-[var(--text-primary)]">Promote your events</h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Tools to spread the word and sell more tickets.</p>
      </div>

      {/* Channels */}
      <div className="grid gap-4 sm:grid-cols-2">
        {CHANNELS.map((ch) => {
          const Icon = ch.icon;
          return (
            <div
              key={ch.title}
              className={`rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_2px_12px_rgba(5,12,8,0.05)] ${ch.disabled ? "opacity-60" : ""}`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px]" style={{ background: `${ch.color}1a` }}>
                <Icon size={20} weight="fill" style={{ color: ch.color }} />
              </div>
              <h3 className="mt-3 text-[14px] font-semibold text-[var(--text-primary)]">{ch.title}</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">{ch.desc}</p>
              <button
                type="button"
                disabled={ch.disabled}
                className={`mt-4 w-full rounded-full py-2.5 text-[13px] font-semibold transition ${
                  ch.disabled
                    ? "cursor-not-allowed border border-[var(--border-subtle)] text-[var(--text-tertiary)]"
                    : "text-white hover:opacity-90"
                }`}
                style={!ch.disabled ? { background: ch.color } : undefined}
              >
                {ch.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Promo codes teaser */}
      <div className="rounded-[20px] border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--brand)]/15">
            <Ticket size={20} weight="fill" className="text-[var(--brand)]" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Promo codes</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
              Create discount codes to reward your community, run early-bird promos, or give special access to VIP attendees.
              Available on individual event ticket pages.
            </p>
            <Link
              href="/organizer/events"
              className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--brand)] hover:opacity-70 transition"
            >
              <LinkSimple size={12} /> Go to my events
            </Link>
          </div>
        </div>
      </div>

      {/* Placeholder tip */}
      <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
        <div className="flex items-center gap-2.5">
          <MegaphoneSimple size={16} className="text-[var(--brand)]" weight="fill" />
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">Marketing tip</p>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
          Events that share their link on WhatsApp in the first 48 hours see 3× more ticket sales. Start with your existing community.
        </p>
      </div>
    </div>
  );
}
