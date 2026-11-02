"use client";

import { useState } from "react";
import { AGE_COOKIE, writeCookie } from "@/lib/consent";
import { Seal } from "./Seal";

/** Věková brána 18+ při vstupu na web. */
export function AgeGate({ verified }: { verified: boolean }) {
  const [open, setOpen] = useState(!verified);
  const [denied, setDenied] = useState(false);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 p-4 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-title"
    >
      <div className="w-full max-w-md border border-gold/40 bg-panel p-8 text-center shadow-2xl">
        <Seal size={96} className="mx-auto mb-4" />
        <h2 id="age-title" className="font-serif text-2xl text-gold-light">
          Je vám více než 18 let?
        </h2>
        {denied ? (
          <p className="mt-4 text-muted">
            Obsah tohoto webu je určen pouze osobám starším 18 let. Prodej alkoholu osobám mladším 18 let je zakázán.
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm text-muted">
              Web nabízí alkoholické nápoje. Vstup je povolen pouze osobám starším 18 let.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                autoFocus
                onClick={() => {
                  writeCookie(AGE_COOKIE, "1", 365);
                  setOpen(false);
                }}
                className="flex-1 bg-gold px-5 py-3 font-bold uppercase tracking-wider text-ink hover:bg-gold-light"
              >
                Ano, je mi 18+
              </button>
              <button
                type="button"
                onClick={() => setDenied(true)}
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
