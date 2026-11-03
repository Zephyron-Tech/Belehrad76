import type { Metadata } from "next";
import { CartView } from "./CartView";
import { CheckoutSteps } from "@/components/CheckoutSteps";

export const metadata: Metadata = { title: "Košík", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="frame py-12 md:py-20">
      <CheckoutSteps current="Košík" />
      <h1 className="display mt-6 text-head">Košík</h1>
      <CartView />
    </div>
  );
}
