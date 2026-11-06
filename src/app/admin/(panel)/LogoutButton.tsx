"use client";

import { useFormStatus } from "react-dom";

export function LogoutButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="border border-line px-3 py-1.5 text-cream transition-colors hover:border-gold disabled:opacity-60">
      {pending ? "Odhlašuji…" : "Odhlásit"}
    </button>
  );
}
