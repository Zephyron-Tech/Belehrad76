"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function CartButton() {
  const { count, ready } = useCart();
  return (
    <Link
      href="/kosik"
      className="relative inline-flex items-center gap-2 border border-gold/60 px-3 py-2 text-sm font-semibold text-gold-light transition hover:bg-gold hover:text-ink"
      aria-label={`Košík, ${count} položek`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M6 6h15l-1.5 9h-12z" />
        <path d="M6 6 5 3H2" />
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
      </svg>
      <span className="hidden sm:inline">Košík</span>
      {ready && count > 0 && (
        <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-seal px-1.5 text-xs text-cream">
          {count}
        </span>
      )}
    </Link>
  );
}
