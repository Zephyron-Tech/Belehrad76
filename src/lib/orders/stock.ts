import type { Prisma } from "@prisma/client";
import { OutOfStockError } from "../errors";

export { OutOfStockError };

type Item = { productId: number; quantity: number; name: string };

/**
 * Odečte ze skladu položky s omezeným skladem (boxy). Kusovky mají sklad NULL = neomezený.
 * Odečet je atomický (UPDATE … WHERE stock >= qty), takže poslední box nemůže koupit dvakrát.
 * Při nedostatku vyhodí OutOfStockError – volající transakce se tím celá vrátí.
 */
export async function reserveStock(tx: Prisma.TransactionClient, items: Item[]): Promise<boolean> {
  let reservedAny = false;
  for (const item of items) {
    const product = await tx.product.findUnique({ where: { id: item.productId }, select: { stock: true, name: true } });
    if (!product || product.stock === null) continue;
    const res = await tx.product.updateMany({
      where: { id: item.productId, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    });
    if (res.count !== 1) throw new OutOfStockError(product.name);
    reservedAny = true;
  }
  return reservedAny;
}

/** Vrátí položky s omezeným skladem zpět na sklad. */
export async function releaseStock(tx: Prisma.TransactionClient, items: Item[]) {
  for (const item of items) {
    await tx.product.updateMany({
      where: { id: item.productId, stock: { not: null } },
      data: { stock: { increment: item.quantity } },
    });
  }
}
