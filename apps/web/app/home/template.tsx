"use client";

import { motion } from "framer-motion";
import { useAnimationConfig } from "../../hooks/useAnimationConfig";

export default function HomeTemplate({ children }: { children: React.ReactNode }) {
  const { variants } = useAnimationConfig();

  return (
    <motion.div
      variants={variants.page}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}
