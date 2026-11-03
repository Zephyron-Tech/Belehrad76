"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartProvider";

/** Událost po přidání do košíku (např. pro animaci nad boxem) */
export const CART_ADDED_EVENT = "cart:added";
export type CartAddedDetail = { slug: string; quantity: number };

export function AddToCart({
  slug,
  max,
  disabled,
  disabledLabel = "Vyprodáno",
  compact = false,
}: {
  slug: string;
  /** Maximální počet kusů (sklad / limit objednávky) */
  max: number;
  disabled?: boolean;
  disabledLabel?: string;
  compact?: boolean;
}) {
  const { add, lines } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const inCart = lines.find((l) => l.slug === slug)?.quantity ?? 0;
  const available = Math.max(0, max - inCart);

  if (disabled || max <= 0) {
    return (
      <button type="button" disabled className={`btn ${compact ? "min-h-11 px-4 text-[1rem]" : "w-full"}`}>
        {disabledLabel}
      </button>
    );
  }

  const onAdd = () => {
    const n = Math.min(qty, available);
    if (n <= 0) return;
    add(slug, n);
    window.dispatchEvent(new CustomEvent<CartAddedDetail>(CART_ADDED_EVENT, { detail: { slug, quantity: n } }));
    setAdded(true);
    setQty(1);
    window.setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className={compact ? "flex items-center gap-3" : "flex flex-col gap-3 sm:flex-row sm:items-stretch"}>
      {!compact && (
        <div className="stepper" role="group" aria-label="Počet kusů">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Méně">
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={Math.max(1, available)}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(Math.max(1, available), Number(e.target.value) || 1)))}
            className="tabular"
            aria-label="Počet kusů"
          />
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(Math.max(1, available), q + 1))}
            disabled={qty >= available}
            aria-label="Více"
          >
            +
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={onAdd}
        disabled={available <= 0}
        className={`btn add-btn ${compact ? "min-h-11 px-4 text-[1rem]" : "flex-1"}`}
        data-added={added}
      >
        {available <= 0 ? "Maximum v košíku" : added ? "Přidáno ✓" : "Do košíku"}
      </button>
      {added && !compact && (
        <Link href="/kosik" className="link self-center whitespace-nowrap font-semibold">
          Zobrazit košík
        </Link>
      )}
    </div>
  );
}
