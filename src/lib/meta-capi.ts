import crypto from "node:crypto";
import type { Order } from "@prisma/client";
import { env } from "./env";

const sha256 = (v: string) => crypto.createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

/** ID události sdílené s Meta Pixelem v prohlížeči (deduplikace). */
export function purchaseEventId(orderNumber: string) {
  return `order-${orderNumber}`;
}

/**
 * Server-side událost Purchase pro Meta Conversions API.
 * Odesílá se jen se souhlasem s marketingovými cookies a jen když je nastaven pixel a token.
 */
export async function sendMetaPurchase(order: Order): Promise<boolean> {
  if (!order.trackingConsent || !env.metaPixelId || !env.metaCapiToken) return false;

  const phone = order.phone.replace(/\D/g, "");
  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor((order.paidAt ?? new Date()).getTime() / 1000),
        event_id: purchaseEventId(order.number),
        action_source: "website",
        event_source_url: `${env.appUrl}/objednavka`,
        user_data: {
          em: [sha256(order.email)],
          ...(phone ? { ph: [sha256(phone.length === 9 ? `420${phone}` : phone)] } : {}),
          ...(order.fbp ? { fbp: order.fbp } : {}),
          ...(order.fbc ? { fbc: order.fbc } : {}),
        },
        custom_data: { currency: "CZK", value: order.totalCzk },
      },
    ],
  };

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${encodeURIComponent(env.metaPixelId)}/events?access_token=${encodeURIComponent(env.metaCapiToken)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" },
  );
  if (!res.ok) throw new Error(`Meta CAPI: HTTP ${res.status} ${await res.text()}`);
  return true;
}
