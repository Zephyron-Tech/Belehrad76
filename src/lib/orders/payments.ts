import { prisma } from "../db";
import { env } from "../env";
import { createPayment, getPaymentState, type GopayState } from "../gopay";
import { audit } from "../audit";
import { PaymentError } from "../errors";
import { markPaid } from "./transitions";

export function orderUrl(publicToken: string) {
  return `${env.appUrl}/objednavka/${publicToken}`;
}

/**
 * Založí novou platbu v GoPay pro nezaplacenou objednávku a vrátí adresu brány.
 * Zákazník může platbu opakovat, dokud trvá rezervace.
 */
export async function startGopayPayment(orderId: number): Promise<string> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new PaymentError("Objednávka neexistuje.");
  if (order.status !== "PENDING") throw new PaymentError("Objednávka už nečeká na platbu.");
  if (order.paymentMethod !== "GOPAY") throw new PaymentError("Objednávka se neplatí přes platební bránu.");
  if (order.reservedUntil && order.reservedUntil < new Date()) {
    throw new PaymentError("Čas na zaplacení vypršel. Vytvořte prosím novou objednávku.");
  }

  const items: { name: string; amountCzk: number; count: number; type: "ITEM" | "DELIVERY" }[] = order.items.map((i) => ({
    name: i.name,
    amountCzk: i.unitPriceCzk * i.quantity,
    count: i.quantity,
    type: "ITEM",
  }));
  if (order.shippingCzk > 0) items.push({ name: "Doprava", amountCzk: order.shippingCzk, count: 1, type: "DELIVERY" });

  const payment = await createPayment({
    orderNumber: order.number,
    amountCzk: order.totalCzk,
    description: `Objednávka ${order.number} – Mistři Evropy 1976`,
    items,
    contact: {
      firstName: order.firstName,
      lastName: order.lastName,
      email: order.email,
      phone: order.phone,
      city: order.city,
      street: order.street,
      zip: order.zip,
    },
    returnUrl: `${orderUrl(order.publicToken)}?platba=navrat`,
    notificationUrl: `${env.appUrl}/api/gopay/notify`,
  });

  await prisma.payment.create({
    data: { orderId: order.id, gopayId: payment.id, state: payment.state, amountCzk: order.totalCzk, gwUrl: payment.gwUrl },
  });
  return payment.gwUrl;
}

/**
 * Ověří stav platby v GoPay a podle něj upraví objednávku.
 * Volá se z notifikace GoPay, při návratu zákazníka a před zrušením po vypršení rezervace.
 */
export async function syncGopayPayment(gopayId: string): Promise<GopayState | null> {
  const payment = await prisma.payment.findUnique({ where: { gopayId } });
  if (!payment) return null;

  const state = await getPaymentState(gopayId);
  if (state !== payment.state) {
    await prisma.payment.update({ where: { id: payment.id }, data: { state } });
  }

  if (state === "PAID") {
    if (payment.state !== "PAID") await flagDuplicatePayment(payment.orderId, gopayId);
    await markPaid(payment.orderId, { source: "gopay" });
  } else if ((state === "REFUNDED" || state === "PARTIALLY_REFUNDED") && state !== payment.state) {
    await audit({ action: "payment_refunded", orderId: payment.orderId, detail: state }, { source: "gopay" });
  }
  return state;
}

/**
 * Zákazník mohl stejnou objednávku zaplatit dvakrát (např. ve dvou záložkách). Druhá platba
 * objednávku nezmění, ale provozovatel ji musí vrátit – zapíše se do historie objednávky.
 */
async function flagDuplicatePayment(orderId: number, gopayId: string) {
  const otherPaid = await prisma.payment.count({ where: { orderId, state: "PAID", gopayId: { not: gopayId } } });
  if (otherPaid === 0) return;
  console.warn("[gopay] duplicate payment", orderId, gopayId);
  await audit(
    { action: "duplicate_payment", orderId, detail: `Objednávka zaplacena podruhé (GoPay ${gopayId}) – vraťte platbu` },
    { source: "gopay" },
  );
}

/**
 * Ověří platby objednávky (nejnovější první). Zahrnuje i platby vedené jako PAID –
 * kdyby se po zápisu stavu platby nestihla označit objednávka (výpadek), dorovná se to tady.
 */
export async function syncOrderPayments(orderId: number) {
  const payments = await prisma.payment.findMany({
    where: { orderId, state: { notIn: ["CANCELED", "TIMEOUTED", "REFUNDED", "PARTIALLY_REFUNDED"] } },
    orderBy: { createdAt: "desc" },
  });
  for (const p of payments) {
    try {
      const state = await syncGopayPayment(p.gopayId);
      if (state === "PAID") return;
    } catch (err) {
      console.error("[gopay] sync failed", p.gopayId, err);
    }
  }
}
