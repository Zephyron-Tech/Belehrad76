import { getProductBySlug } from "@/lib/catalog";
import { formatCzk } from "@/lib/format";
import { ogImage, OG_SIZE } from "@/lib/og";

export const alt = "Lahev slivovice s portrétem hráče – Mistři Evropy, Bělehrad 1976";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-dynamic";

/** Obrázek ke sdílení lahve hráče: jeho etiketa na kotouči pečeti, číslo a jméno. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProductBySlug((await params).slug);
  const name = product?.playerName ?? product?.name ?? "Mistři Evropy";
  const isBottle = product?.type === "BOTTLE" && product.imageUrl.startsWith("/");
  return ogImage({
    lines: [product?.playerNumber ? `${product.playerNumber} ${name.split(" ")[0]}` : "Mistři Evropy", name.split(" ").slice(1).join(" ") || "1976"],
    sentence: "Lahev slivovice 50 % s portrétem, jménem a číslem dresu.",
    footer: product ? `${formatCzk(product.priceCzk)} · edice Mistři Evropy – Bělehrad 1976` : "Edice Mistři Evropy – Bělehrad 1976",
    picture: isBottle
      ? { src: product.imageUrl, width: 352, height: 600, kind: "label" }
      : { src: "/img/box-vyrez.png", width: 1079, height: 640, kind: "box" },
  });
}
