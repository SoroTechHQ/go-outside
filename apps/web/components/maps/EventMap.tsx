"use client";

import { useEffect, useState } from "react";
import {
  ArrowSquareOut,
  Car,
  Copy,
  Check,
  MapPin,
  WhatsappLogo,
} from "@phosphor-icons/react";

type GhanaPostAddress = {
  digitalAddress: string;
  street:         string | null;
  region:         string | null;
  district:       string | null;
  community:      string | null;
  postalArea:     string | null;
  postCode:       string | null;
};

type Props = {
  lat:          number;
  lng:          number;
  venueName:    string;
  locationLine: string;
  eventTitle:   string;
  eventSlug:    string;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand-dim)] text-[var(--brand)] transition hover:bg-[var(--brand)] hover:text-white"
      title="Copy address"
      type="button"
    >
      {copied ? <Check size={13} weight="bold" /> : <Copy size={13} weight="bold" />}
    </button>
  );
}

export function EventMap({ lat, lng, venueName, locationLine, eventTitle }: Props) {
  const [ghanaPost, setGhanaPost] = useState<GhanaPostAddress | null>(null);
  const [gpLoading, setGpLoading] = useState(true);

  useEffect(() => {
    setGpLoading(true);
    fetch(`/api/ghana-post?lat=${lat}&lng=${lng}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setGhanaPost(data))
      .catch(() => setGhanaPost(null))
      .finally(() => setGpLoading(false));
  }, [lat, lng]);

  const apiKey       = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY ?? "";
  const mapEmbedUrl  = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=16`;
  const mapsDeepLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const uberDeepLink = `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${encodeURIComponent(venueName)}`;
  const uberFallback = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${encodeURIComponent(venueName)}`;
  const boltDeepLink = `taxify://destination?lat=${lat}&lng=${lng}&name=${encodeURIComponent(venueName)}`;
  const boltFallback = `https://bolt.eu/en-gh/`;
  const whatsappText = encodeURIComponent(`Join me at ${eventTitle}! 📍 ${venueName}\n\nLocation: https://www.google.com/maps?q=${lat},${lng}`);
  const whatsappUrl  = `https://wa.me/?text=${whatsappText}`;

  return (
    <div className="space-y-4">
      {/* Google Maps embed */}
      <div className="overflow-hidden rounded-2xl border border-[var(--home-border)]">
        <iframe
          className="h-[300px] w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={mapEmbedUrl}
          title={`Map for ${venueName}`}
          allowFullScreen
        />
      </div>

      {/* Venue info + Ghana Post address */}
      <div className="rounded-2xl border border-[var(--home-border)] bg-[var(--bg-surface)] p-4 space-y-3">
        {/* Place name + coordinates */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-dim)] text-[var(--brand)]">
            <MapPin size={18} weight="fill" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[var(--text-primary)]">{venueName}</p>
            <p className="text-sm text-[var(--text-secondary)]">{locationLine}</p>
            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{lat.toFixed(6)}, {lng.toFixed(6)}</p>
          </div>
        </div>

        {/* Ghana Post digital address */}
        {gpLoading ? (
          <div className="flex items-center gap-2 rounded-xl border border-[var(--home-border)] bg-[var(--bg-card)] px-4 py-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
            <span className="text-sm text-[var(--text-tertiary)]">Loading Ghana Post address…</span>
          </div>
        ) : ghanaPost ? (
          <div className="rounded-xl border border-[var(--home-border)] bg-[var(--bg-card)] px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Ghana Post Digital Address</p>
                <p className="mt-0.5 text-[1.4rem] font-bold tracking-wide text-[var(--brand)]">{ghanaPost.digitalAddress}</p>
              </div>
              <CopyButton text={ghanaPost.digitalAddress} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
              {ghanaPost.street   && <span><span className="font-medium text-[var(--text-primary)]">Street: </span>{ghanaPost.street}</span>}
              {ghanaPost.district && <span><span className="font-medium text-[var(--text-primary)]">District: </span>{ghanaPost.district}</span>}
              {ghanaPost.region   && <span><span className="font-medium text-[var(--text-primary)]">Region: </span>{ghanaPost.region}</span>}
              {ghanaPost.community && <span><span className="font-medium text-[var(--text-primary)]">Community: </span>{ghanaPost.community}</span>}
            </div>
          </div>
        ) : null}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* Open in Google Maps */}
        <a
          href={mapsDeepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-[var(--home-border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
        >
          <ArrowSquareOut size={15} weight="bold" />
          Google Maps
        </a>

        {/* Open in Uber */}
        <a
          href={uberDeepLink}
          onClick={(e) => {
            // Try deep link; fall back to web after 500ms
            setTimeout(() => { window.open(uberFallback, "_blank"); }, 500);
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-[var(--home-border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
        >
          <Car size={15} weight="bold" />
          Uber
        </a>

        {/* Open in Bolt */}
        <a
          href={boltDeepLink}
          onClick={(e) => {
            setTimeout(() => { window.open(boltFallback, "_blank"); }, 500);
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-[var(--home-border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
        >
          <Car size={15} weight="bold" />
          Bolt
        </a>

        {/* Share on WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-[var(--home-border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[#25D366] hover:text-[#25D366]"
        >
          <WhatsappLogo size={15} weight="fill" />
          WhatsApp
        </a>
      </div>
    </div>
  );
}
