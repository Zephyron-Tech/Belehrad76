"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = { slug: string; quantity: number };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  ready: boolean;
  add: (slug: string, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  remove: (slug: string) => void;
  replace: (lines: CartLine[]) => void;
  clear: () => void;
};

const STORAGE_KEY = "belehrad76-cart-v1";
const CartContext = createContext<CartContextValue | null>(null);

function load(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l): l is CartLine => typeof l?.slug === "string" && Number.isInteger(l?.quantity) && l.quantity > 0)
      .slice(0, 50);
  } catch {
    return [];
  }
}

function save(lines: CartLine[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    /* prohlížeč bez úložiště – košík vydrží jen do obnovení stránky */
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(load());
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setLines(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((fn: (prev: CartLine[]) => CartLine[]) => {
    setLines((prev) => {
      const next = fn(prev).filter((l) => l.quantity > 0);
      save(next);
      return next;
    });
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      ready,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      add: (slug, quantity = 1) =>
        update((prev) =>
          prev.some((l) => l.slug === slug)
            ? prev.map((l) => (l.slug === slug ? { ...l, quantity: l.quantity + quantity } : l))
            : [...prev, { slug, quantity }],
        ),
      setQuantity: (slug, quantity) => update((prev) => prev.map((l) => (l.slug === slug ? { ...l, quantity } : l))),
      remove: (slug) => update((prev) => prev.filter((l) => l.slug !== slug)),
      replace: (next) => update(() => next),
      clear: () => update(() => []),
    }),
    [lines, ready, update],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart musí být uvnitř CartProvider");
  return ctx;
}
