import { prisma } from "./db";
import { getSettings, type Settings } from "./settings";
import { priceCart, type CartLineInput, type PricedCart } from "./cart";

/** Produkty v pořadí pro zobrazení. Sklad se čte vždy čerstvě z DB. */
export async function getActiveProducts() {
  return prisma.product.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({ where: { slug, active: true } });
}

export async function getPage(slug: string) {
  return prisma.page.findUnique({ where: { slug } });
}

export function cartLimits(settings: Settings) {
  return { maxBoxes: settings.num("order.max_boxes"), maxBottles: settings.num("order.max_bottles") };
}

export function shippingRates(settings: Settings) {
  return { boxCzk: settings.num("shipping.box_czk"), bottleCzk: settings.num("shipping.bottle_czk") };
}

export async function priceCartFromDb(input: CartLineInput[]): Promise<{ cart: PricedCart; settings: Settings }> {
  const settings = await getSettings();
  const slugs = [...new Set(input.map((l) => l.slug))];
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return { cart: priceCart(input, products, cartLimits(settings), shippingRates(settings)), settings };
}
