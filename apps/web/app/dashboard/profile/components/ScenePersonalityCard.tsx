"use client";

import { Moon, Export } from "@phosphor-icons/react";

type PersonalityVariant = "nightOwl" | "cultureVulture" | "earlyAdopter" | "dayTripper";

type Personality = {
  variant: PersonalityVariant;
  title: string;
  description: string;
  traits: string[];
  accentColor: string;
};

function getPersonality(): Personality {
  // Mock — production: derive from user event attendance patterns
  return {
    variant: "nightOwl",
    title: "The Night Owl Connector",
    description:
      "You thrive after sunset. Your scene card is stamped with rooftops, jazz lounges, and after-hours sessions — and you always know the right people.",
    traits: ["Late nights", "Social", "Music-driven"],
    accentColor: "#4a9f63",
  };
}

function PersonalityIcon({ variant, color }: { variant: PersonalityVariant; color: string }) {
  const icons: Record<PersonalityVariant, React.ReactNode> = {
    nightOwl:      <Moon size={26} weight="fill" style={{ color }} />,
    cultureVulture: <Moon size={26} weight="fill" style={{ color }} />,
    earlyAdopter:  <Moon size={26} weight="fill" style={{ color }} />,
    dayTripper:    <Moon size={26} weight="fill" style={{ color }} />,
  };
  return <>{icons[variant]}</>;
}

export function ScenePersonalityCard() {
  const personality = getPersonality();

  function handleShare() {
    const text = `My GoOutside scene personality: ${personality.title}\n\n${personality.description}\n\nfind yours at gooutside.gh`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/5 bg-gradient-to-br from-[#0e2212] via-[#152a1a] to-[#0b1a10] p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(74,159,99,0.12),transparent_60%)]" />

      <div className="relative flex gap-4">
        {/* Icon box */}
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${personality.accentColor}18`, border: `1px solid ${personality.accentColor}30` }}
        >
          <PersonalityIcon variant={personality.variant} color={personality.accentColor} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
            Scene Personality
          </p>
          <p className="mt-0.5 font-display text-[15px] font-bold italic leading-tight text-white">
            {personality.title}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-white/50">
            {personality.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {personality.traits.map((trait) => (
              <span
                key={trait}
                className="rounded-full border border-[#4a9f63]/30 bg-[#4a9f63]/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#4a9f63]"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleShare}
        className="relative mt-4 flex w-full items-center justify-center gap-2 rounded-[12px] border border-white/8 bg-white/5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50 transition hover:bg-white/10 hover:text-white/80 active:scale-[0.98]"
      >
        <Export size={13} />
        Share this
      </button>
    </div>
  );
}
