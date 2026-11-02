import { prisma } from "../db";
import { cancelOrder } from "./transitions";
import { syncOrderPayments } from "./payments";

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

let lastRun = 0;

/** Levné „líné“ spuštění při běžných požadavcích (nejvýše jednou za minutu). Doplňuje cron. */
export function maybeExpireStaleOrders() {
  if (Date.now() - lastRun < 60_000) return;
  lastRun = Date.now();
  expireStaleOrders().catch((err) => console.error("[expire] failed", err));
}
