"use client";

import { useEffect, useState } from "react";

export function PayButton({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zpět z platební brány prohlížeč vrátí stránku z paměti i se zablokovaným tlačítkem
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setBusy(false);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/objednavka/${encodeURIComponent(token)}/platba`, { method: "POST" });
      const json = (await res.json()) as { redirectUrl?: string; error?: string };
      if (!res.ok || !json.redirectUrl) throw new Error(json.error ?? "Platbu se nepodařilo spustit.");
      window.location.href = json.redirectUrl;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={pay}
        disabled={busy}
        className="btn w-full disabled:cursor-wait"
      >
        {busy ? "Otevírám platební bránu…" : "Zaplatit online"}
      </button>
      {error && (
        <p role="alert" className="mt-3 font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
