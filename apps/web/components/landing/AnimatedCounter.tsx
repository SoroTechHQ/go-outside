"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface AnimatedCounterProps {
  target:    number;
  suffix?:   string;
  duration?: number;
}

export function AnimatedCounter({ target, suffix = "", duration = 1500 }: AnimatedCounterProps) {
  const ref         = useRef<HTMLSpanElement>(null);
  const isInView    = useInView(ref, { once: true, margin: "-60px" });
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const start = performance.now();
    const raf   = { id: 0 };

    function tick(now: number) {
      const p      = Math.min((now - start) / duration, 1);
      const eased  = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setCount(Math.round(eased * target));
      if (p < 1) raf.id = requestAnimationFrame(tick);
    }

    raf.id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.id);
  }, [isInView, target, duration]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
}
