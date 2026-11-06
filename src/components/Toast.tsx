"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type ToastInput = { message: string; actionLabel?: string; onAction?: () => void };
type Toast = ToastInput & { id: number };

const ToastContext = createContext<{ show: (t: ToastInput) => void } | null>(null);

/** Krátké oznámení dole na stránce (s tlačítkem „Vrátit“ u vratných akcí). Zmizí samo, čtečky ho oznámí. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const seq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback((t: ToastInput) => {
    clearTimeout(timer.current);
    setToast({ ...t, id: ++seq.current });
    timer.current = setTimeout(() => setToast(null), 6000);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* stabilní živá oblast: obsah se mění, element zůstává */}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[150] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {toast && (
          <div key={toast.id} className="toast pointer-events-auto flex items-center gap-4 bg-panel-2 py-2 pl-5 pr-2 text-cream">
            <span>{toast.message}</span>
            {toast.actionLabel && (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  dismiss();
                }}
                className="min-h-11 px-3 font-bold text-gold-light transition-colors hover:text-cream"
              >
                {toast.actionLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { show: () => {} };
  return ctx;
}
