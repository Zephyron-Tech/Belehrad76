"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";

export function CartButton() {
  const { count, ready } = useCart();
  const [bump, setBump] = useState(false);
  const prev = useRef(count);

  // Při zvýšení počtu krátce „ťukne“ číslo – potvrzení, že se něco přidalo
  useEffect(() => {
    if (ready && count > prev.current) {
      setBump(true);
      const t = window.setTimeout(() => setBump(false), 450);
      prev.current = count;
      return () => window.clearTimeout(t);
    }
    prev.current = count;
  }, [count, ready]);

  return (
    <Link href="/kosik" className="btn min-h-11 gap-1.5 px-2.5 text-[1rem] sm:gap-2 sm:px-4" aria-label={`Košík, ${count} položek`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <path d="M6 6h15l-1.5 9h-12z" />
        <path d="M6 6 5 3H2" />
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
      </svg>
      <span className="hidden sm:inline">Košík</span>
      {ready && count > 0 && (
        <span
          className="cart-count tabular inline-flex min-w-[1.375rem] items-center justify-center rounded-full bg-seal px-1 text-[0.8125rem] leading-[1.375rem] text-cream"
          data-bump={bump}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
