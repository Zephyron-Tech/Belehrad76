import type { Metadata } from "next";
import Image from "next/image";
import { getActiveProducts, shippingRates } from "@/lib/catalog";
import { bottleShippingFromCzk } from "@/lib/shipping";
import { getSettings } from "@/lib/settings";
import { formatCzk } from "@/lib/format";
import { maybeExpireStaleOrders } from "@/lib/orders/expire";
import { PlayerCard } from "@/components/PlayerCard";
import { StockBadge } from "@/components/StockBadge";
import { AddToCart } from "@/components/cart/AddToCart";
import { GoalKick } from "@/components/GoalKick";
import { JsonLd, productJsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "E-shop",
  description: "Box Mistři Evropy se 13 lahvemi slivovice a lahve jednotlivých hráčů z Bělehradu 1976.",
  alternates: { canonical: "/eshop" },
  openGraph: { type: "website", locale: "cs_CZ", siteName: "Mistři Evropy – Bělehrad 1976", title: "E-shop · Mistři Evropy 1976", url: "/eshop" },
  twitter: { card: "summary_large_image", title: "E-shop · Mistři Evropy 1976" },
};

const order = (i: number) => ({ "--i": i }) as React.CSSProperties;

/** Barvy panáčka s brankou na krémovém poli */
const goalKickOnPaper = { "--gk-ink": "var(--seal)", "--gk-ball": "var(--ink)", "--gk-turf": "var(--paper-muted)" } as React.CSSProperties;

export default async function EshopPage() {
  maybeExpireStaleOrders();
  const [settings, products] = await Promise.all([getSettings(), getActiveProducts()]);
  const boxes = products.filter((p) => p.type === "BOX");
  const bottles = products.filter((p) => p.type === "BOTTLE");
  const salesOpen = settings.bool("sales.open");

  return (
    <>
      {products.map((p) => (
        <JsonLd key={p.id} data={productJsonLd(p, settings.str("seller.name"))} />
      ))}
      <header className="field-night pb-8 pt-6 md:pb-16 md:pt-20">
        <div className="frame grid gap-4 md:grid-cols-12 md:items-end md:gap-6">
          <h1 className="display text-head md:col-span-6" data-reveal style={order(0)}>
            E-shop edice 1976
          </h1>
          <p className="max-w-[48ch] md:col-span-6" data-reveal style={order(1)}>
            Box se 13 lahvemi, nebo lahev jednoho hráče. Výtěžek edice jde na podporu Nadace fotbalových internacionálů.
          </p>
        </div>
        {!salesOpen && (
          <p className="frame mt-8">
            <span className="block bg-panel-2 p-4 text-lead">Prodej bude brzy spuštěn. Děkujeme za trpělivost.</span>
          </p>
        )}
      </header>

      {boxes.map((box) => (
        <section key={box.id} className="field-paper py-10 md:py-24" aria-labelledby={`nadpis-${box.slug}`}>
          <div className="frame grid items-center gap-y-8 md:grid-cols-12 md:gap-x-10">
            <div className="md:col-span-7" data-reveal style={order(0)}>
              <Image
                src="/img/box-vyrez.png"
                alt={`${box.name}: 13 lahví v otevřeném boxu s fotografií mužstva`}
                width={1079}
                height={640}
                priority
                sizes="(min-width: 768px) 56vw, 100vw"
                className="h-auto w-full"
              />
              <p className="mt-3 text-small text-[var(--soft)]">Vizualizace boxu, finální podoba se může lišit.</p>
            </div>
            <div className="flex flex-col md:col-span-5 md:block">
              {/* Panáček s míčem a branka – po přidání boxu do košíku vstřelí gól. Na telefonu pod tlačítkem, aby nezabíral první obrazovku. */}
              <div className="order-1 mt-6 max-w-md md:order-none md:mt-0" style={goalKickOnPaper}>
                <GoalKick slug={box.slug} />
              </div>
              <h2 id={`nadpis-${box.slug}`} className="display mt-2 text-head">
                {box.name}
              </h2>
              <p className="mt-4 text-lead">{box.shortDescription}</p>
              {/* cena a sklad na telefonu v jednom řádku */}
              <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 md:mt-8 md:block">
                <p className="display text-head tabular">{formatCzk(box.priceCzk)}</p>
                <StockBadge stock={box.stock} className="text-lead text-seal md:mt-2" />
              </div>
              <div className="mt-5 md:mt-8">
                {salesOpen && (
                  <>
                    <AddToCart slug={box.slug} max={Math.min(box.stock ?? 0, settings.num("order.max_boxes"))} />
                    <p className="mt-3 text-[var(--soft)]">Pokud chcete dát gól, dejte box do košíku.</p>
                  </>
                )}
              </div>
              <dl className="order-2 mt-8 grid gap-x-6 gap-y-3 sm:grid-cols-[auto_1fr] md:order-none md:mt-10">
                <dt className="font-semibold">Doprava</dt>
                <dd>
                  {formatCzk(settings.num("shipping.box_czk"))} za celou objednávku, ať objednáte jeden box, nebo více – i s lahvemi
                  navíc. Osobní převzetí na FAČR je zdarma.
                </dd>
                <dt className="font-semibold">Doručení</dt>
                <dd>{settings.text("box.delivery")}</dd>
              </dl>
            </div>
          </div>
        </section>
      ))}

      <section id="lahve" className="field-night scroll-mt-[-1.25rem] py-16 md:py-28" aria-labelledby="lahve-nadpis">
        <header className="frame grid gap-6 md:grid-cols-12 md:items-end">
          <h2 id="lahve-nadpis" className="display text-head md:col-span-6" data-reveal style={order(0)}>
            Lahve jednotlivých hráčů
          </h2>
          <p className="max-w-[52ch] md:col-span-6" data-reveal style={order(1)}>
            Každá lahev slivovice 50 % nese portrét, jméno a číslo dresu. {settings.text("bottle.lead_time")} Lahve posíláme Zásilkovnou na výdejní místo od{" "}
            {formatCzk(bottleShippingFromCzk(shippingRates(settings)))} za zásilku (podle hmotnosti, s ověřením věku 18+), s boxem v objednávce
            kurýrem jen {formatCzk(settings.num("shipping.box_czk"))} za celou zásilku. Osobní převzetí na FAČR je zdarma.
          </p>
        </header>
        <div className="frame mt-12 grid gap-x-16 md:mt-16 lg:grid-cols-2">
          {bottles.map((p) => (
            <PlayerCard key={p.id} product={p}>
              {salesOpen && <AddToCart slug={p.slug} max={settings.num("order.max_bottles")} compact />}
            </PlayerCard>
          ))}
        </div>
      </section>
    </>
  );
}
