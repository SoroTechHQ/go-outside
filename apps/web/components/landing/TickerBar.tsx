"use client";

import { TICKER_EVENTS, CATEGORY_COLORS } from "../../lib/landing-data";

export function TickerBar() {
  const items = [...TICKER_EVENTS, ...TICKER_EVENTS]; // duplicate for seamless loop

  return (
    <div className="relative w-full overflow-hidden border-y border-[rgba(95,191,42,0.06)] bg-[#080D08]" style={{ height: 48 }}>
      {/* "HAPPENING SOON" label */}
      <div className="absolute left-0 top-0 z-10 flex h-full items-center gap-2 border-r border-[rgba(95,191,42,0.08)] bg-[#0D140D] px-4">
        <span
          className="h-[5px] w-[5px] rounded-full bg-[#5FBF2A]"
          style={{ animation: "tickerPulse 1.5s ease-in-out infinite" }}
        />
        <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.14em] text-[#5FBF2A]">
          Happening Soon
        </span>
      </div>

      {/* Scrolling content */}
      <div className="flex h-full items-center pl-[164px]">
        <div className="ticker-track flex items-center gap-0">
          {items.map((item, i) => (
            <div key={i} className="flex items-center">
              <div className="flex items-center gap-2 whitespace-nowrap px-5 py-0">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white"
                  style={{ background: CATEGORY_COLORS[item.category] ?? "#5FBF2A" }}
                >
                  {item.category}
                </span>
                <span className="text-[13px] font-medium text-[#F5FFF0]">{item.name}</span>
                <span className="text-[#4A6A4A]">·</span>
                <span className="text-[12px] text-[#6B8C6B]">{item.location}</span>
                <span className="text-[#4A6A4A]">·</span>
                <span className="text-[12px] text-[#E8932A]">{item.signal}</span>
              </div>
              <div className="h-4 w-px bg-[rgba(95,191,42,0.10)]" />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes tickerPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .ticker-track {
          animation: ticker 30s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
