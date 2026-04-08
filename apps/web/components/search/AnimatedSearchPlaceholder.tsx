"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const SEARCH_SUGGESTIONS = [
  "Detty Race 2025",
  "Afrofuture",
  "Rug Tufting Workshop",
  "Ga Rooftop After Hours",
  "Build Ghana Summit",
  "Chale Wote Festival",
  "Osu Night Market",
  "Jazz Under the Stars",
  "Tech Accra Meetup",
  "Sip & Paint",
];

export function AnimatedSearchPlaceholder({ isVisible }: { isVisible: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const current = SEARCH_SUGGESTIONS[currentIndex] ?? SEARCH_SUGGESTIONS[0];

    if (isPaused) {
      const timeout = window.setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, 2000);
      return () => window.clearTimeout(timeout);
    }

    if (isDeleting) {
      if (displayText.length === 0) {
        setIsDeleting(false);
        setCurrentIndex((value) => (value + 1) % SEARCH_SUGGESTIONS.length);
        return;
      }

      const timeout = window.setTimeout(() => {
        setDisplayText((value) => value.slice(0, -1));
      }, 40);
      return () => window.clearTimeout(timeout);
    }

    if (displayText.length < current.length) {
      const timeout = window.setTimeout(() => {
        setDisplayText(current.slice(0, displayText.length + 1));
      }, 80);
      return () => window.clearTimeout(timeout);
    }

    setIsPaused(true);
  }, [currentIndex, displayText, isDeleting, isPaused, isVisible]);

  return (
    <span className="select-none text-white/30">
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        className="ml-0.5 inline-block h-4 w-0.5 rounded-full bg-[var(--brand)]/60"
        transition={{ duration: 1, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
      />
    </span>
  );
}

export default AnimatedSearchPlaceholder;
