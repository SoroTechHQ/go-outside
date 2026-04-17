"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Warning, Info, XCircle } from "@phosphor-icons/react";

type ToastType = "success" | "error" | "warning" | "info";

export type Toast = {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
  duration?: number;
};

type ToasterContextValue = {
  toasts: Toast[];
  toast: (opts: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
};

const ToasterContext = createContext<ToasterContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToasterContext);
  if (!ctx) throw new Error("useToast must be used within Toaster");
  return ctx;
}

const ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: Warning,
  info: Info,
};

const COLORS: Record<ToastType, { icon: string; bg: string; border: string }> = {
  success: { icon: "text-[var(--brand)]", bg: "bg-[var(--brand-dim)]", border: "border-[var(--brand)]/20" },
  error: { icon: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-200" },
  warning: { icon: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200" },
  info: { icon: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200" },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = ICONS[toast.type];
  const colors = COLORS[toast.type];

  useEffect(() => {
    const t = setTimeout(onDismiss, toast.duration ?? 4000);
    return () => clearTimeout(t);
  }, [toast.duration, onDismiss]);

  return (
    <motion.div
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-lg backdrop-blur-sm min-w-[280px] max-w-sm ${colors.bg} ${colors.border}`}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      transition={{ type: "spring", damping: 24, stiffness: 300 }}
    >
      <Icon size={18} weight="fill" className={`mt-0.5 shrink-0 ${colors.icon}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[var(--text-primary)]">{toast.message}</p>
        {toast.description && (
          <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">{toast.description}</p>
        )}
      </div>
      <button
        className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mt-0.5"
        onClick={onDismiss}
        type="button"
      >
        <X size={14} weight="bold" />
      </button>
    </motion.div>
  );
}

export function Toaster({ children }: { children?: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((opts: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...opts, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToasterContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        <AnimatePresence mode="sync">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToasterContext.Provider>
  );
}
