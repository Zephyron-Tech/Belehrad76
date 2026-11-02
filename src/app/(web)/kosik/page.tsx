import type { Metadata } from "next";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "Košík", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-serif text-4xl font-bold text-gold">Košík</h1>
      <CartView />
    </div>
  );
}
