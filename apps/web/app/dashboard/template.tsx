"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAnimationConfig } from "../../hooks/useAnimationConfig";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  const segment = useSelectedLayoutSegment();
  const { variants } = useAnimationConfig();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={segment ?? "dashboard"}
        variants={variants.page}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
