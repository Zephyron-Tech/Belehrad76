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
      <button type="button" disabled className="w-full cursor-not-allowed border border-line px-4 py-3 text-sm text-muted">
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
    <div className={compact ? "flex gap-2" : "flex flex-col gap-3 sm:flex-row"}>
      {!compact && (
        <div className="flex items-center border border-line" role="group" aria-label="Počet kusů">
          <button
            type="button"
            className="px-3 py-3 text-lg text-gold-light disabled:opacity-40"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Méně"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={Math.max(1, available)}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(Math.max(1, available), Number(e.target.value) || 1)))}
            className="w-14 bg-transparent text-center text-cream [appearance:textfield]"
            aria-label="Počet kusů"
          />
          <button
            type="button"
            className="px-3 py-3 text-lg text-gold-light disabled:opacity-40"
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
        className="flex-1 bg-gold px-5 py-3 text-sm font-bold uppercase tracking-wider text-ink transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
      >
        {available <= 0 ? "Maximum v košíku" : added ? "Přidáno ✓" : "Do košíku"}
      </button>
      {added && !compact && (
        <Link href="/kosik" className="self-center text-sm text-gold-light underline underline-offset-4">
          Zobrazit košík
        </Link>
      )}
    </div>
  );
}
