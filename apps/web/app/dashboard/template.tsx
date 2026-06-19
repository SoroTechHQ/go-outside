"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAnimationConfig } from "../../hooks/useAnimationConfig";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  const segment = useSelectedLayoutSegment();
  const { reduceMotion } = useAnimationConfig();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={segment ?? "dashboard"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
