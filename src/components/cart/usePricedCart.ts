"use client";

import { useEffect, useState } from "react";
import type { PricedCart } from "@/lib/cart";
import type { CartLine } from "./CartProvider";

export type PricedCartResponse = PricedCart & { salesOpen: boolean; pickupEnabled: boolean; leadTime: string };

/** Ocení košík na serveru při každé změně (aktuální ceny, sklad a doprava). */
export function usePricedCart(lines: CartLine[], ready: boolean) {
  const [data, setData] = useState<PricedCartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(lines);

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    setLoading(true);
    fetch("/api/kosik", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: key === "[]" ? '{"lines":[]}' : JSON.stringify({ lines: JSON.parse(key) }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Košík se nepodařilo načíst.");
        setData((await res.json()) as PricedCartResponse);
        setError(null);
      })
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError") setError((err as Error).message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [key, ready]);

  return { data, loading, error };
}
