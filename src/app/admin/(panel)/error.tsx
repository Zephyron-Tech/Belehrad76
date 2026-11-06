"use client";

import { useEffect } from "react";

export default function PanelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-serif text-2xl font-bold text-gold">Něco se pokazilo</h1>
      <p className="mt-3 text-muted">Stránku administrace se nepodařilo načíst (databáze, GoPay nebo Zásilkovna mohly být dočasně nedostupné).</p>
      {error.digest && <p className="mt-2 text-xs text-muted">Kód chyby: {error.digest}</p>}
      <button
        type="button"
        onClick={reset}
        className="mt-6 bg-gold px-5 py-2 text-sm font-bold text-ink transition-colors hover:bg-gold-light"
      >
        Zkusit znovu
      </button>
    </div>
  );
}
