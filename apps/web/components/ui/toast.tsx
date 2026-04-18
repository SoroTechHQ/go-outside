"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import clsx from "clsx";
import { X, ArrowCounterClockwise } from "@phosphor-icons/react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ToastType = "message" | "success" | "warning" | "error";

type Toast = {
  id: number;
  text: string | ReactNode;
  type: ToastType;
  action?: string;
  onAction?: () => void;
  onUndo?: () => void;
  preserve?: boolean;
  // internal timer fields
  remaining?: number;
  start?: number;
  timer?: ReturnType<typeof setTimeout>;
  pause?: () => void;
  resume?: () => void;
  height?: number;
};

// ── Store (singleton outside React) ──────────────────────────────────────────

let _id = 0;
let _root: ReturnType<typeof createRoot> | null = null;

const store = {
  toasts: [] as Toast[],
  listeners: new Set<() => void>(),

  add(opts: Omit<Toast, "id" | "remaining" | "start" | "timer" | "pause" | "resume" | "height">) {
    const id = ++_id;
    const toast: Toast = { ...opts, id };

    if (!toast.preserve) {
      const DURATION = 4500;
      const close = () => { store.remove(id); };

      toast.remaining = DURATION;
      toast.start = Date.now();
      toast.timer = setTimeout(close, DURATION);

      toast.pause = () => {
        if (!toast.timer) return;
        clearTimeout(toast.timer);
        toast.timer = undefined;
        toast.remaining! -= Date.now() - toast.start!;
      };
      toast.resume = () => {
        if (toast.timer) return;
        toast.start = Date.now();
        toast.timer = setTimeout(close, toast.remaining!);
      };
    }

    store.toasts = [...store.toasts, toast];
    store.notify();
  },

  remove(id: number) {
    store.toasts = store.toasts.filter((t) => t.id !== id);
    store.notify();
  },

  notify() {
    store.listeners.forEach((fn) => fn());
  },

  subscribe(fn: () => void) {
    store.listeners.add(fn);
    return () => store.listeners.delete(fn);
  },
};

// ── Container component ───────────────────────────────────────────────────────

const BG: Record<ToastType, string> = {
  message: "bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-primary)]",
  success: "bg-[var(--brand)] text-white border border-[var(--brand-hover)]",
  warning: "bg-amber-500 text-white border border-amber-600",
  error:   "bg-red-600 text-white border border-red-700",
};

function ToastItem({ toast, index, total, hovered }: { toast: Toast; index: number; total: number; hovered: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && !toast.height) {
      toast.height = ref.current.getBoundingClientRect().height;
      store.notify();
    }
  });

  const offset = total - 1 - index;
  const isLast = index === total - 1;

  // Stacked transform: collapse when not hovered, spread when hovered
  let transform: string;
  if (isLast) {
    transform = "translate3d(0, 0, 0) scale(1)";
  } else {
    if (hovered) {
      // spread out upward
      let yOffset = 0;
      for (let i = total - 1; i > index; i--) {
        yOffset += (store.toasts[i]?.height ?? 64) + 8;
      }
      transform = `translate3d(0, -${yOffset}px, 0) scale(1)`;
    } else {
      // stack: each card slightly above and scaled down
      const scale = Math.max(0.86, 1 - offset * 0.05);
      const ty = -(offset * 10);
      transform = `translate3d(0, ${ty}px, 0) scale(${scale})`;
    }
  }

  return (
    <div
      ref={ref}
      className={clsx(
        "w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl px-4 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.14)] transition-all duration-300 ease-out",
        BG[toast.type],
        offset >= 3 && "pointer-events-none",
      )}
      style={{ transform, zIndex: 9999 + index }}
    >
      <div className="flex items-start gap-3">
        <span className="flex-1 text-[13.5px] leading-[1.5]">{toast.text}</span>
        <div className="flex shrink-0 items-center gap-1">
          {toast.onUndo && (
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full opacity-70 transition hover:opacity-100 hover:bg-white/20"
              onClick={() => { toast.onUndo?.(); store.remove(toast.id); }}
              type="button"
            >
              <ArrowCounterClockwise size={13} weight="bold" />
            </button>
          )}
          {!toast.action && (
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full opacity-70 transition hover:opacity-100 hover:bg-white/20"
              onClick={() => store.remove(toast.id)}
              type="button"
            >
              <X size={13} weight="bold" />
            </button>
          )}
        </div>
      </div>
      {toast.action && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            className="rounded-lg px-3 py-1.5 text-[12px] font-semibold opacity-70 transition hover:opacity-100 hover:bg-white/20"
            onClick={() => store.remove(toast.id)}
            type="button"
          >
            Dismiss
          </button>
          <button
            className="rounded-lg bg-white/20 px-3 py-1.5 text-[12px] font-semibold transition hover:bg-white/30"
            onClick={() => { toast.onAction?.(); store.remove(toast.id); }}
            type="button"
          >
            {toast.action}
          </button>
        </div>
      )}
    </div>
  );
}

function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hovered, setHovered] = useState(false);
  const MAX_VISIBLE = 3;

  useEffect(() => {
    setToasts([...store.toasts]);
    const unsub: () => void = store.subscribe(() => setToasts([...store.toasts]));
    return unsub;
  }, []);

  const visible = toasts.slice(-MAX_VISIBLE);

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-0"
      onMouseEnter={() => { setHovered(true); toasts.forEach((t) => t.pause?.()); }}
      onMouseLeave={() => { setHovered(false); toasts.forEach((t) => t.resume?.()); }}
    >
      <div className="pointer-events-auto relative flex flex-col-reverse">
        {visible.map((toast, i) => (
          <div key={toast.id} className="absolute bottom-0 right-0">
            <ToastItem
              hovered={hovered}
              index={i}
              toast={toast}
              total={visible.length}
            />
          </div>
        ))}
        {/* Invisible spacer so container has correct height */}
        <div style={{ height: hovered
          ? visible.reduce((acc, t) => acc + (t.height ?? 64) + 8, 0)
          : (visible[visible.length - 1]?.height ?? 64) + Math.min(visible.length - 1, 2) * 10
        }} />
      </div>
    </div>
  );
}

// ── Mount helper ──────────────────────────────────────────────────────────────

function mountToastRoot() {
  if (_root || typeof document === "undefined") return;
  const el = document.createElement("div");
  el.id = "go-toast-root";
  document.body.appendChild(el);
  _root = createRoot(el);
  _root.render(<ToastContainer />);
}

// ── Public API ────────────────────────────────────────────────────────────────

interface ToastOptions {
  text: string | ReactNode;
  preserve?: boolean;
  action?: string;
  onAction?: () => void;
  onUndo?: () => void;
}

export function useToast() {
  return {
    message: useCallback((opts: ToastOptions) => {
      mountToastRoot();
      store.add({ ...opts, type: "message" });
    }, []),
    success: useCallback((text: string) => {
      mountToastRoot();
      store.add({ text, type: "success" });
    }, []),
    warning: useCallback((text: string) => {
      mountToastRoot();
      store.add({ text, type: "warning" });
    }, []),
    error: useCallback((text: string) => {
      mountToastRoot();
      store.add({ text, type: "error" });
    }, []),
  };
}

// Imperative API (call anywhere, no hook)
export const toast = {
  message: (opts: ToastOptions) => { mountToastRoot(); store.add({ ...opts, type: "message" }); },
  success: (text: string) => { mountToastRoot(); store.add({ text, type: "success" }); },
  warning: (text: string) => { mountToastRoot(); store.add({ text, type: "warning" }); },
  error:   (text: string) => { mountToastRoot(); store.add({ text, type: "error" }); },
};
