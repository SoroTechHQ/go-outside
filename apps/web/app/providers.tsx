"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { CartProvider } from "../components/cart/CartContext";
import { CartDrawer } from "../components/tickets/CartDrawer";
import { Toaster } from "../components/ui/toaster";
import { AnimationSettingsProvider, useAnimationSettings } from "../lib/animation-settings";

function MotionConfigBridge({ children }: { children: ReactNode }) {
  const { reduceMotion } = useAnimationSettings();
  return (
    <MotionConfig
      reducedMotion={reduceMotion ? "always" : "user"}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
    >
      {children}
    </MotionConfig>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime:            60 * 1000,
            gcTime:               5 * 60 * 1000,
            retry:                1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <AnimationSettingsProvider>
      <MotionConfigBridge>
        <QueryClientProvider client={queryClient}>
          <CartProvider>
            <Toaster>
              {children}
              <CartDrawer />
            </Toaster>
          </CartProvider>
          {process.env.NODE_ENV === "development" && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </MotionConfigBridge>
    </AnimationSettingsProvider>
  );
}
