"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function WebError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="frame flex min-h-[60svh] flex-col justify-center py-20">
      <h1 className="display text-head">Něco se pokazilo</h1>
      <p className="mt-6 max-w-[48ch] text-lead">
        Stránku se nepodařilo načíst. Zkuste to prosím znovu. Pokud problém trvá, napište nám a uveďte, co jste dělali.
      </p>
      {error.digest && <p className="mt-3 text-small text-muted">Kód chyby: {error.digest}</p>}
      <div className="mt-10 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn">
          Zkusit znovu
        </button>
        <Link href="/" className="btn btn-quiet">
          Zpět na úvod
        </Link>
      </div>
    </div>
  );
}
