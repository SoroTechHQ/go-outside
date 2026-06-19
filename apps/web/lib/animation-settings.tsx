"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "go:reduce-motion";

type AnimationSettingsValue = {
  reduceMotion: boolean;
  setReduceMotion: (val: boolean) => void;
};

const AnimationSettingsContext = createContext<AnimationSettingsValue>({
  reduceMotion: false,
  setReduceMotion: () => undefined,
});

export function AnimationSettingsProvider({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotionState] = useState(false);

  // On mount: read OS preference first, then check stored override
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setReduceMotionState(stored === "true");
    } else {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReduceMotionState(mq.matches);
    }
  }, []);

  function setReduceMotion(val: boolean) {
    setReduceMotionState(val);
    localStorage.setItem(STORAGE_KEY, String(val));
  }

  const value = useMemo(
    () => ({ reduceMotion, setReduceMotion }),
    [reduceMotion],
  );

  return (
    <AnimationSettingsContext.Provider value={value}>
      {children}
    </AnimationSettingsContext.Provider>
  );
}

export function useAnimationSettings() {
  return useContext(AnimationSettingsContext);
}
