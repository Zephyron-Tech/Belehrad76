"use client";

import { useState } from "react";

export function PayButton({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        className="w-full bg-gold px-6 py-3 font-bold uppercase tracking-wider text-ink hover:bg-gold-light disabled:opacity-60"
      >
        {busy ? "Otevírám platební bránu…" : "Zaplatit online"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
