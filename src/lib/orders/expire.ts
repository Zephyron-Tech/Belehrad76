import { prisma } from "../db";
import { cancelOrder } from "./transitions";
import { syncOrderPayments } from "./payments";
import { sendPaidNotifications } from "./notifications";

/**
 * Zruší nezaplacené objednávky po vypršení rezervace a vrátí boxy na sklad.
 * U plateb přes GoPay se před zrušením ještě ověří stav platby.
 */
export async function expireStaleOrders(now = new Date()): Promise<number> {
  const stale = await prisma.order.findMany({
    where: { status: "PENDING", reservedUntil: { lt: now } },
    select: { id: true, paymentMethod: true },
    take: 200,
  });

  let cancelled = 0;
  for (const order of stale) {
    if (order.paymentMethod === "GOPAY") {
      await syncOrderPayments(order.id);
      const current = await prisma.order.findUnique({ where: { id: order.id }, select: { status: true } });
      if (current?.status !== "PENDING") continue;
    }
    await cancelOrder(order.id, { source: "system" }, "Nezaplaceno včas – rezervace vypršela");
    cancelled++;
  }
  return cancelled;
}

/**
 * Dorovná e-maily po zaplacení, které se nepodařilo odeslat (výpadek SMTP apod.):
 * potvrzení s PDF zákazníkovi a upozornění provozovateli. Odeslání je jednorázové
 * (časová razítka v objednávce), takže opakované volání nic nezdvojí.
 */
export async function retryPaidNotifications(now = new Date()): Promise<number> {
  const pending = await prisma.order.findMany({
    where: {
      status: { in: ["PAID", "SHIPPED", "COMPLETED"] },
      anonymizedAt: null,
      paidAt: { gte: new Date(now.getTime() - 7 * 24 * 3_600_000) },
      OR: [{ paymentConfirmationSentAt: null }, { ownerNotifiedAt: null }],
    },
    select: { id: true },
    take: 50,
  });
  let retried = 0;
  for (const { id } of pending) {
    try {
      await sendPaidNotifications(id);
      retried++;
    } catch (err) {
      console.error("[notify] retry failed", id, err);
    }
  }
  return retried;
}

let lastRun = 0;

/** Levné „líné“ spuštění při běžných požadavcích (nejvýše jednou za minutu). Doplňuje cron. */
export function maybeExpireStaleOrders() {
  if (Date.now() - lastRun < 60_000) return;
  lastRun = Date.now();
  expireStaleOrders().catch((err) => console.error("[expire] failed", err));
}
