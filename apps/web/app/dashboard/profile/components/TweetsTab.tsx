"use client";

import { useState } from "react";
import { XLogo, ArrowRight, CheckCircle, Lock, ArrowsClockwise } from "@phosphor-icons/react";
import { useToast } from "@/components/ui/toaster";

// Simulated tweets pulled after connecting X
const DEMO_TWEETS = [
  {
    id: "1",
    text: "The Afrobeats Night lineup just dropped and I cannot wait 🎵🔥 @GoOutside is where I found out first",
    date: "Apr 5, 2025",
    likes: 42,
    retweets: 8,
    selected: true,
  },
  {
    id: "2",
    text: "Chale Wote is coming up and James Town is about to be ALIVE. Already got my ticket via @GoOutside 🎨",
    date: "Jul 20, 2025",
    likes: 128,
    retweets: 24,
    selected: true,
  },
  {
    id: "3",
    text: "Ghana Tech Summit 2025 was incredible. The networking alone was worth it. See you all next year 💻",
    date: "Jun 6, 2025",
    likes: 67,
    retweets: 11,
    selected: false,
  },
  {
    id: "4",
    text: "PSA: The Labadi food vendors at the beach event are absolutely elite. Jollof that hits different at sunset 🌅🍲",
    date: "Mar 22, 2025",
    likes: 201,
    retweets: 45,
    selected: false,
  },
];

type Props = {
  tweetIds: string[];
};

export function TweetsTab({ tweetIds }: Props) {
  const [connected, setConnected] = useState(tweetIds.length > 0);
  const [connecting, setConnecting] = useState(false);
  const [tweets, setTweets] = useState(DEMO_TWEETS);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  async function handleConnect() {
    setConnecting(true);
    // Simulate Clerk OAuth flow for Twitter/X
    await new Promise((r) => setTimeout(r, 1800));
    setConnecting(false);
    setConnected(true);
    toast({
      type: "success",
      message: "X account connected!",
      description: "Choose which tweets to show on your profile.",
    });
  }

  function toggleTweet(id: string) {
    setTweets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t)),
    );
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
    toast({
      type: "success",
      message: "Tweets updated",
      description: `${tweets.filter((t) => t.selected).length} tweets visible on your profile.`,
    });
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <XLogo size={24} className="text-[var(--text-tertiary)]" />
        </div>
        <p className="mt-5 font-display text-[15px] font-bold italic text-[var(--text-primary)]">
          Link your X account
        </p>
        <p className="mt-2 max-w-[240px] text-[12px] leading-relaxed text-[var(--text-tertiary)]">
          Connect X to showcase your GoOutside moments alongside your event history. You choose which tweets appear.
        </p>

        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
          <Lock size={11} weight="fill" />
          <span>We only read tweets — we never post on your behalf</span>
        </div>

        <button
          className="mt-6 flex items-center gap-2 rounded-full bg-black px-6 py-3 text-[13px] font-bold text-white shadow-sm transition hover:bg-gray-900 active:scale-[0.97] disabled:opacity-60"
          disabled={connecting}
          onClick={handleConnect}
          type="button"
        >
          {connecting ? (
            <>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Connecting…
            </>
          ) : (
            <>
              <XLogo size={14} />
              Connect X Account
              <ArrowRight size={13} />
            </>
          )}
        </button>
      </div>
    );
  }

  const selectedCount = tweets.filter((t) => t.selected).length;

  return (
    <div className="space-y-3 pb-8">
      {/* Connected header */}
      <div className="flex items-center justify-between rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand-dim)] px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle size={16} weight="fill" className="text-[var(--brand)]" />
          <p className="text-[13px] font-semibold text-[var(--brand)]">X account connected</p>
        </div>
        <button
          className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          type="button"
        >
          <ArrowsClockwise size={11} weight="bold" />
          Refresh
        </button>
      </div>

      <p className="text-[12px] text-[var(--text-tertiary)] px-1">
        Select tweets to show on your profile. {selectedCount} of {tweets.length} selected.
      </p>

      {/* Tweet selector */}
      {tweets.map((tweet) => (
        <button
          key={tweet.id}
          className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
            tweet.selected
              ? "border-[var(--brand)] bg-[var(--brand-dim)]/40"
              : "border-[var(--border-subtle)] hover:border-[var(--border-default)]"
          }`}
          onClick={() => toggleTweet(tweet.id)}
          type="button"
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                tweet.selected ? "border-[var(--brand)] bg-[var(--brand)]" : "border-[var(--border-default)]"
              }`}
            >
              {tweet.selected && <CheckCircle size={12} weight="fill" className="text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] leading-relaxed text-[var(--text-primary)]">{tweet.text}</p>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
                <span>{tweet.date}</span>
                <span>❤️ {tweet.likes}</span>
                <span>🔁 {tweet.retweets}</span>
              </div>
            </div>
          </div>
        </button>
      ))}

      <button
        className="mt-2 w-full rounded-2xl bg-[var(--brand)] py-3.5 text-[14px] font-semibold text-white transition hover:bg-[var(--brand-hover)] active:scale-[0.98]"
        onClick={handleSave}
        type="button"
      >
        {saved ? "Saved ✓" : "Save Selection"}
      </button>
    </div>
  );
}
