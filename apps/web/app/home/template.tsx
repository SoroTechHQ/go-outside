"use client";

import { motion } from "framer-motion";
import { useAnimationConfig } from "../../hooks/useAnimationConfig";

export default function HomeTemplate({ children }: { children: React.ReactNode }) {
  const { reduceMotion } = useAnimationConfig();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
