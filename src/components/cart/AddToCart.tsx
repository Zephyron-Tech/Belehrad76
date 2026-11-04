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
    // Počet a tlačítko vždy v jednom řádku (i na telefonu): pole počtu má svou šířku, tlačítko vyplní zbytek
    <div className={compact ? "flex items-center gap-3" : "flex flex-wrap items-stretch gap-y-3"}>
      {!compact && (
        <div className="stepper" role="group" aria-label="Počet kusů">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Méně">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M5 12h14" />
            </svg>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={onAdd}
        disabled={available <= 0}
        className={`btn add-btn ${compact ? "min-h-11 min-w-11 px-0 text-[1rem] sm:px-4" : "min-h-14 min-w-32 flex-1"}`}
        data-added={added}
      >
        {available <= 0 ? (
          <Label compact={compact} text="Maximum v košíku" icon={<CartPlusIcon />} />
        ) : added ? (
          <>
            <Label compact={compact} text="Přidáno" icon={<CheckIcon />} />
            {!compact && <CheckIcon />}
          </>
        ) : (
          <Label compact={compact} text="Do košíku" icon={<CartPlusIcon />} />
        )}
      </button>
      {added && !compact && (
        <Link href="/kosik" className="link basis-full self-center whitespace-nowrap font-semibold sm:ml-5 sm:basis-auto">
          Zobrazit košík
        </Link>
      )}
    </div>
  );
}

/** Na telefonu u kompaktního tlačítka jen ikona (text zůstává pro čtečky), jinak text. */
function Label({ compact, text, icon }: { compact: boolean; text: string; icon: React.ReactNode }) {
  if (!compact) return <>{text}</>;
  return (
    <>
      <span className="sr-only sm:not-sr-only">{text}</span>
      <span className="sm:hidden" aria-hidden="true">
        {icon}
      </span>
    </>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

function CartPlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 4h2.5l2 10h9.5l2-7H7" />
      <circle cx="9" cy="19" r="1.4" />
      <circle cx="16" cy="19" r="1.4" />
      <path d="M12.5 8.5v3.5M10.75 10.25h3.5" />
    </svg>
  );
}
