"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AGE_COOKIE, writeCookie } from "@/lib/consent";
import { Seal } from "./Seal";

/** Stránky s prodejem alkoholu. Úvod a informační stránky jsou bez brány. */
const SHOP_PATHS = ["/eshop", "/produkt", "/kosik", "/pokladna"];

export function isShopPath(pathname: string) {
  return SHOP_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Věková brána 18+ při vstupu do e-shopu (ne na úvodní stránce). */
export function AgeGate({ verified }: { verified: boolean }) {
  const pathname = usePathname();
  const [confirmed, setConfirmed] = useState(verified);
  const [deniedOn, setDeniedOn] = useState<string | null>(null);
  if (confirmed || !isShopPath(pathname)) return null;
  const denied = deniedOn === pathname;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 p-4 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-title"
      aria-describedby="age-desc"
    >
      <div className="w-full max-w-md border border-gold/40 bg-panel p-8 text-center shadow-2xl">
        <Seal size={96} className="mx-auto mb-4" />
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Vstup do e-shopu</p>
        <h2 id="age-title" className="mt-2 font-serif text-2xl text-gold-light">
          Je vám více než 18 let?
        </h2>
        {denied ? (
          <>
            <p id="age-desc" className="mt-4 text-muted">
              E-shop je určen pouze osobám starším 18 let. Prodej alkoholu osobám mladším 18 let je zakázán.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block border border-line px-5 py-3 font-semibold text-cream hover:border-gold"
            >
              Zpět na úvodní stránku
            </Link>
          </>
        ) : (
          <>
            <p id="age-desc" className="mt-4 text-sm text-muted">
              Chystáte se vstoupit na stránky s prodejem alkoholu. Vstup je povolen pouze osobám starším 18 let.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                autoFocus
                onClick={() => {
                  writeCookie(AGE_COOKIE, "1", 365);
                  setConfirmed(true);
                }}
                className="flex-1 bg-gold px-5 py-3 font-bold uppercase tracking-wider text-ink hover:bg-gold-light"
              >
                Ano, je mi 18+
              </button>
              <button
                type="button"
                onClick={() => setDeniedOn(pathname)}
                className="flex-1 border border-line px-5 py-3 font-semibold text-cream hover:border-gold"
              >
                Ne
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
