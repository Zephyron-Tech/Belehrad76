import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { env } from "@/lib/env";
import { CheckoutForm } from "./CheckoutForm";
import { CheckoutSteps } from "@/components/CheckoutSteps";

export const metadata: Metadata = { title: "Objednávka", robots: { index: false } };

export default async function CheckoutPage() {
  const settings = await getSettings();
  return (
    <div className="frame py-12 md:py-20">
      <CheckoutSteps current="Údaje a doprava" />
      <h1 className="display mt-6 text-head">Objednávka</h1>
      <CheckoutForm
        pickupAddress={settings.str("pickup.address")}
        pickupNote={settings.text("pickup.note")}
        eveningDate={settings.str("evening.date")}
        transferDays={settings.num("reservation.transfer_days")}
        gopayMinutes={settings.num("reservation.gopay_minutes")}
        boxShippingCzk={settings.num("shipping.box_czk")}
        packetaApiKey={env.packetaApiKey || undefined}
        packetaMock={env.packetaMock}
        turnstileSiteKey={env.turnstileSiteKey || undefined}
      />
    </div>
  );
}
