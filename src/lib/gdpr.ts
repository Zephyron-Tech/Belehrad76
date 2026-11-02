import { prisma } from "./db";
import { audit, type ActionContext } from "./audit";

const ANON = "anonymizováno";

/**
 * Anonymizace osobních údajů objednávky (výmaz na žádost zákazníka / po uplynutí doby uchování).
 * Zůstanou jen údaje potřebné pro statistiku: položky, částky, stav, data.
 * Povoleno jen u dokončených nebo zrušených objednávek.
 */
export async function anonymizeOrder(orderId: number, ctx: ActionContext) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Objednávka neexistuje.");
  if (order.anonymizedAt) return false;
  if (order.status !== "COMPLETED" && order.status !== "CANCELLED") {
    throw new Error("Anonymizovat lze jen dokončenou nebo zrušenou objednávku.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        firstName: ANON,
        lastName: ANON,
        email: `anonym-${order.id}@invalid`,
        phone: ANON,
        street: order.street ? ANON : null,
        city: order.city ? ANON : null,
        zip: null,
        companyName: order.companyName ? ANON : null,
        ico: null,
        dic: null,
        note: null,
        internalNote: null,
        companionName: null,
        fbp: null,
        fbc: null,
        anonymizedAt: new Date(),
      },
    });
    await audit({ action: "anonymize", orderId }, ctx, tx);
  });
  return true;
}
