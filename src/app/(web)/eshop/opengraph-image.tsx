import { getActiveProducts } from "@/lib/catalog";
import { formatCzk } from "@/lib/format";
import { ogImage, OG_SIZE } from "@/lib/og";

export const alt = "E-shop Mistři Evropy 1976: box 13 lahví a lahve jednotlivých hráčů";
export const size = OG_SIZE;
export const contentType = "image/png";
// cena a zbývající boxy se čtou z databáze
export const dynamic = "force-dynamic";

export default async function Image() {
  const products = await getActiveProducts();
  const box = products.find((p) => p.type === "BOX");
  const bottle = products.find((p) => p.type === "BOTTLE");
  const prices = [box && `Box ${formatCzk(box.priceCzk)}`, bottle && `lahev ${formatCzk(bottle.priceCzk)}`].filter(Boolean).join(" · ");
  return ogImage({
    lines: ["E-shop", "Bělehrad 1976"],
    sentence: "Box se 13 lahvemi, nebo lahev jednoho hráče.",
    footer: prices || "Limitovaná edice 152 boxů",
    picture: { src: "/img/box-vyrez.png", width: 1079, height: 640, kind: "box" },
  });
}
