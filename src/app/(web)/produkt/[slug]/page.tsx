import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getActiveProducts, getProductBySlug } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { formatCzk } from "@/lib/format";
import { maybeExpireStaleOrders } from "@/lib/orders/expire";
import { Markdown } from "@/components/Markdown";
import { StockBadge } from "@/components/StockBadge";
import { Seal } from "@/components/Seal";
import { AddToCart } from "@/components/cart/AddToCart";
import { JsonLd, productJsonLd } from "@/components/JsonLd";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical: `/produkt/${product.slug}` },
    // obrázek ke sdílení vykreslí opengraph-image.tsx vedle stránky
    openGraph: { type: "website", locale: "cs_CZ", siteName: "Mistři Evropy – Bělehrad 1976", title: product.name, description: product.shortDescription, url: `/produkt/${product.slug}` },
    twitter: { card: "summary_large_image", title: product.name, description: product.shortDescription },
  };
}

export default async function ProductPage({ params }: Props) {
  maybeExpireStaleOrders();
  const { slug } = await params;
  const [product, settings, products] = await Promise.all([getProductBySlug(slug), getSettings(), getActiveProducts()]);
  if (!product) notFound();
  // Box nemá vlastní stránku – kupuje se přímo v e-shopu (kvůli gólu nad nadpisem)
  if (product.type === "BOX") permanentRedirect("/eshop");

  // Stránka kusovky (jednotlivé lahve hráče)
  const salesOpen = settings.bool("sales.open");
  const extraPhotos = product.galleryUrls.filter((u) => u !== product.imageUrl);
  const max = settings.num("order.max_bottles");
  const name = product.playerName ?? product.name;
  const shippingText = `Doprava ${formatCzk(settings.num("shipping.bottle_czk"))} za lahev, s boxem v objednávce jen ${formatCzk(settings.num("shipping.box_czk"))} za celou zásilku.`;

  // Sousední hráči na soupisce (v kruhu)
  const bottles = products.filter((p) => p.type === "BOTTLE");
  const at = bottles.findIndex((p) => p.slug === product.slug);
  const prev = at >= 0 ? bottles[(at - 1 + bottles.length) % bottles.length] : undefined;
  const next = at >= 0 ? bottles[(at + 1) % bottles.length] : undefined;

  return (
    <>
      <JsonLd data={productJsonLd(product, settings.str("seller.name"))} />
      <div className="field-night flex flex-col pb-6 pt-5 md:min-h-[calc(100svh-var(--header-h))] md:pb-8 md:pt-6">
        <div className="frame flex flex-1 flex-col">
          <nav aria-label="Drobečková navigace">
            <ol className="flex flex-wrap gap-x-6 text-muted">
              <li>
                <Link href="/eshop#lahve" className="link decoration-transparent hover:text-cream hover:decoration-current">
                  Lahve hráčů
                </Link>
              </li>
              <li aria-current="page" className="text-cream">
                {name}
              </li>
            </ol>
          </nav>

          <div className="my-6 grid flex-1 items-center gap-y-8 md:my-4 md:grid-cols-12 md:gap-x-10">
            <div className="md:col-span-6">
              <div className="lineup-stage lineup-stage--fit" data-reveal>
                <Seal filled decorative id="produkt-seal" className="lineup-disc" />
                <Image
                  src={product.imageUrl}
                  alt={`Etiketa lahve – ${name}`}
                  width={352}
                  height={600}
                  priority
                  sizes="(min-width: 768px) 24vw, 52vw"
                  className="lineup-label label-paper"
                  data-active="true"
                />
              </div>
              <p className="mt-3 text-center text-small text-muted">Obrázky jsou ilustrační vizualizace.</p>
            </div>

            <div className="md:col-span-6">
              {/* číslo dresu vedle nadpisu: ušetří výšku, aby se vše vešlo do první obrazovky */}
              <div className="flex items-end gap-5">
                <p className="display text-[clamp(4rem,3rem+3.5vw,6.5rem)] leading-[0.78] text-gold tabular" aria-hidden="true">
                  {product.playerNumber}
                </p>
                <h1 className="display text-head">{product.name}</h1>
              </div>
              <p className="mt-3 max-w-[44ch] text-lead">{product.shortDescription}</p>
              <p className="display mt-5 text-head tabular">{formatCzk(product.priceCzk)}</p>
              <p className="mt-1 max-w-[52ch] text-muted">
                Cena včetně DPH. {shippingText} Nebo osobní převzetí na FAČR zdarma.
              </p>
              <StockBadge stock={product.stock} className="mt-3 text-lead text-gold-light" />
              {product.madeToOrder && <p className="mt-4 max-w-[52ch] bg-panel-2 px-4 py-3">{settings.text("bottle.lead_time")}</p>}

              <div className="mt-6">
                {salesOpen ? (
                  <AddToCart slug={product.slug} max={max} />
                ) : (
                  <p className="bg-panel-2 p-4 text-lead">Prodej bude brzy spuštěn.</p>
                )}
              </div>
            </div>
          </div>

          {prev && next && (
            <nav aria-label="Další hráči" className="grid grid-cols-2 gap-6 pt-2">
              <Link href={`/produkt/${prev.slug}`} className="sibling group">
                <span className="text-muted">Předchozí hráč</span>
                <span className="display block text-[clamp(1.25rem,1rem+1.2vw,2rem)]">
                  <span className="tabular text-gold">{prev.playerNumber}</span> {prev.playerName}
                </span>
              </Link>
              <Link href={`/produkt/${next.slug}`} className="sibling group text-right">
                <span className="text-muted">Další hráč</span>
                <span className="display block text-[clamp(1.25rem,1rem+1.2vw,2rem)]">
                  <span className="tabular text-gold">{next.playerNumber}</span> {next.playerName}
                </span>
              </Link>
            </nav>
          )}
        </div>
      </div>

      <section className="field-panel py-16 md:py-24" aria-labelledby="o-lahvi">
        <div className="frame grid gap-y-10 md:grid-cols-12 md:gap-x-10">
          <h2 id="o-lahvi" className="display text-head md:col-span-5">
            O lahvi
          </h2>
          <div className="md:col-span-7">
            <Markdown source={product.description} settings={settings} className="text-lead [&_p]:leading-[1.5]" />
            <p className="mt-8 max-w-[60ch]">
              Kdo si v předprodeji objedná box, může se zařadit do losování o vstup na slavnostní večer{" "}
              {settings.str("evening.date")}.{" "}
              <Link href="/#vecer" className="link text-gold-light">
                Více o večeru
              </Link>
            </p>
            {extraPhotos.length > 0 && (
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {extraPhotos.map((src, i) => (
                  <Image
                    key={src}
                    src={src}
                    alt={`${product.name} – fotografie ${i + 2}`}
                    width={600}
                    height={800}
                    sizes="(min-width: 640px) 20vw, 45vw"
                    className="label-paper h-auto w-full object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
