"use client";

import { QRCodeSVG } from "qrcode.react";

export function TicketQr({ reference }: { reference: string }) {
  return (
    <div className="rounded-[28px] border border-[var(--border-card)] bg-white p-5 shadow-[0_14px_32px_rgba(0,0,0,0.18)]">
      <QRCodeSVG
        bgColor="#ffffff"
        fgColor="#081008"
        includeMargin
        level="M"
        size={220}
        value={`gooutside-demo-ticket:${reference}`}
      />
    </div>
  );
}
