import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveProducts, getProductBySlug } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { formatCzk } from "@/lib/format";
import { maybeExpireStaleOrders } from "@/lib/orders/expire";
import { Markdown } from "@/components/Markdown";
import { StockBadge } from "@/components/StockBadge";
import { AddToCart } from "@/components/cart/AddToCart";
import { PlayerCard } from "@/components/PlayerCard";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: { title: product.name, description: product.shortDescription, images: [product.imageUrl] },
  };
}

export default async function ProductPage({ params }: Props) {
  maybeExpireStaleOrders();
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product) notFound();

  const isBox = product.type === "BOX";
  const salesOpen = settings.bool("sales.open");
  const gallery = [product.imageUrl, ...product.galleryUrls.filter((u) => u !== product.imageUrl)];
  const players = isBox ? (await getActiveProducts()).filter((p) => p.type === "BOTTLE") : [];
  const max = isBox ? Math.min(product.stock ?? 0, settings.num("order.max_boxes")) : settings.num("order.max_bottles");
  const boxShipping = formatCzk(settings.num("shipping.box_czk"));
  const shippingText = isBox
    ? `Doprava ${boxShipping} za celou objednávku – i při více boxech a přidaných kusovkách.`
    : `Doprava ${formatCzk(settings.num("shipping.bottle_czk"))} za kus (s boxem v objednávce jen ${boxShipping} celkem).`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <nav aria-label="Drobečková navigace" className="text-sm text-muted">
        <Link href="/eshop" className="hover:text-gold-light">
          E-shop
        </Link>{" "}
        / <span className="text-cream">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="space-y-4">
          {gallery.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={i === 0 ? product.name : `${product.name} – fotografie ${i + 1}`}
              className={`w-full border border-line ${isBox ? "" : "label-paper mx-auto max-w-sm"}`}
            />
          ))}
          <p className="text-xs text-muted">Obrázky jsou ilustrační vizualizace.</p>
        </div>

        <div>
          {!isBox && <p className="text-sm text-muted">Hráč č. {product.playerNumber}</p>}
          <h1 className="font-serif text-4xl font-bold text-cream">{product.name}</h1>
          <p className="mt-3 text-lg text-cream/85">{product.shortDescription}</p>
          <p className="mt-6 font-serif text-4xl font-bold text-gold-light">{formatCzk(product.priceCzk)}</p>
          <p className="mt-1 text-sm text-muted">
            Cena včetně DPH. {shippingText} Nebo osobní převzetí na FAČR zdarma.
          </p>
          <div className="mt-4">
            <StockBadge stock={product.stock} />
          </div>
          {product.madeToOrder && (
            <p className="mt-4 border-l-2 border-gold pl-3 text-sm text-cream/85">{settings.str("bottle.lead_time")}</p>
          )}

          <div className="mt-6">
            {salesOpen ? (
              <AddToCart slug={product.slug} max={max} />
            ) : (
              <p className="border border-line p-3 text-sm text-muted">Prodej bude brzy spuštěn.</p>
            )}
          </div>

          <Markdown source={product.description} settings={settings} className="mt-8" />

          {isBox && (
            <div className="mt-8 border border-line bg-panel p-5">
              <h2 className="font-serif text-xl font-bold text-gold">Obsah boxu</h2>
              <ol className="mt-3 grid gap-x-6 gap-y-1 text-sm text-cream/90 sm:grid-cols-2">
                {players.map((p) => (
                  <li key={p.id}>
                    <span className="inline-block w-8 text-muted">{p.playerNumber}</span>
                    {p.playerName}
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-sm text-muted">13 lahví slivovice 50 %, jedna za každého hráče.</p>
            </div>
          )}

          <p className="mt-6 text-sm text-muted">
            Objednávkou v předprodeji se můžete zařadit do losování o vstup na slavnostní večer {settings.str("evening.date")}.{" "}
            <Link href="/#vecer" className="text-gold-light underline underline-offset-4">
              Více o večeru
            </Link>
          </p>
        </div>
      </div>

      {isBox && players.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl font-bold text-gold">Lahve v boxu</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {players.map((p) => (
              <PlayerCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
