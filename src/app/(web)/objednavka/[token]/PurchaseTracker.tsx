"use client";

import { useEffect } from "react";
import { currentConsent } from "@/lib/consent";

type Gtag = (...args: unknown[]) => void;
type Fbq = (...args: unknown[]) => void;

/**
 * Měření dokončené objednávky (GA4 purchase, Meta Purchase) – jen se souhlasem a jen jednou.
 * Meta událost má stejné eventID jako server-side Conversions API (deduplikace).
 */
export function PurchaseTracker(props: {
  orderNumber: string;
  value: number;
  eventId: string;
  items: { name: string; quantity: number; price: number }[];
}) {
  useEffect(() => {
    const key = `purchase-tracked-${props.orderNumber}`;
    try {
      if (window.localStorage.getItem(key)) return;
    } catch {
      /* ignore */
    }
    const consent = currentConsent();
    if (!consent) return;

    let tries = 0;
    const timer = window.setInterval(() => {
      tries++;
      const w = window as unknown as { gtag?: Gtag; fbq?: Fbq };
      const gaReady = !consent.analytics || typeof w.gtag === "function";
      const fbReady = !consent.marketing || typeof w.fbq === "function";
      if ((gaReady && fbReady) || tries > 20) {
        window.clearInterval(timer);
        if (consent.analytics && w.gtag) {
          w.gtag("event", "purchase", {
            transaction_id: props.orderNumber,
            value: props.value,
            currency: "CZK",
            items: props.items.map((i) => ({ item_name: i.name, quantity: i.quantity, price: i.price })),
          });
        }
        if (consent.marketing && w.fbq) {
          w.fbq("track", "Purchase", { value: props.value, currency: "CZK" }, { eventID: props.eventId });
        }
        try {
          window.localStorage.setItem(key, "1");
        } catch {
          /* ignore */
        }
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [props.orderNumber, props.value, props.eventId, props.items]);

  return null;
}
