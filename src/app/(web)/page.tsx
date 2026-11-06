import Image from "next/image";
import Link from "next/link";
import { getActiveProducts, getPage } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { formatCzk } from "@/lib/format";
import { maybeExpireStaleOrders } from "@/lib/orders/expire";
import { Seal } from "@/components/Seal";
import { Markdown } from "@/components/Markdown";
import { StockBadge } from "@/components/StockBadge";
import { LineupPicker } from "@/components/LineupPicker";
import { JsonLd, organizationJsonLd } from "@/components/JsonLd";

/** Pořadí příchodu prvku v sekci (pro stagger v CSS) */
const order = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function HomePage() {
  maybeExpireStaleOrders();
  const [settings, products, story, foundation, evening, auction] = await Promise.all([
    getSettings(),
    getActiveProducts(),
    getPage("pribeh"),
    getPage("nadace"),
    getPage("vecer"),
    getPage("drazba"),
  ]);
  const box = products.find((p) => p.type === "BOX");
  const bottles = products.filter((p) => p.type === "BOTTLE");
  const salesOpen = settings.bool("sales.open");
  const foundationUrl = settings.str("foundation.url");

  return (
    <>
      <JsonLd data={organizationJsonLd(settings.str("seller.name"), settings.str("contact.email"))} />
      {/* Noc v Bělehradě: nadpis vlevo, obří pečeť oříznutá vpravo, na ní box */}
      <section data-hero className="chapter field-night relative flex !min-h-[calc(100svh-var(--header-h))] flex-col !pb-10 !pt-6 md:block md:!py-0">
        {/* Pečeť a box se měří od rámu stránky (max. šířka), ne od okna – na širokém monitoru zůstanou u nadpisu */}
        <div className="hero-stage order-2 md:order-none">
          <Seal filled decorative id="hero-seal" className="hero-disc" />
          <div className="hero-box">
            <div className="hero-box-frame overflow-clip">
              <Image
                src="/img/box-vyrez.png"
                alt={box ? `${box.name}: 13 lahví v otevřeném boxu s fotografií mužstva` : "Box Mistři Evropy"}
                width={1079}
                height={640}
                priority
                sizes="(min-width: 768px) 50vw, 92vw"
                className="h-auto w-full"
              />
            </div>
            {box && (
              <div className="hero-load" style={{ "--d": "1100ms" } as React.CSSProperties}>
                <StockBadge stock={box.stock} className="mt-4 text-center text-gold-light md:text-left" />
              </div>
            )}
          </div>
        </div>
        <div className="frame relative z-10 order-1 grid md:order-none md:min-h-[calc(100svh-var(--header-h))] md:grid-cols-12 md:items-center">
          <div className="md:col-span-7 md:py-24">
            <h1 className="display hero-title text-gold">
              <span className="hero-line">
                <span style={order(0)}>{settings.str("home.hero_title")}</span>
              </span>
              <span className="hero-line">
                <span style={order(1)} className="text-cream">
                  {settings.str("home.hero_subtitle")}
                </span>
              </span>
            </h1>
            {settings
              .text("home.hero_sentence")
              .split("\n")
              .filter((line) => line.trim())
              .map((line, i) => (
                <p
                  key={i}
                  className={`hero-load max-w-[36ch] ${i === 0 ? "mt-5 text-lead md:mt-8" : "mt-4 text-muted"}`}
                  style={{ "--d": `${420 + i * 60}ms` } as React.CSSProperties}
                >
                  {line}
                </p>
              ))}
            {box && (
              <div className="hero-load mt-6 flex flex-wrap items-center gap-3" style={{ "--d": "520ms" } as React.CSSProperties}>
                <Link href="/eshop" className="btn">
                  Objednat box · {formatCzk(box.priceCzk)}
                </Link>
                <Link href="/#soupiska" className="btn btn-quiet">
                  Jednotlivé lahve
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Příběh: krémové pole etikety */}
      {story && (
        <section id="pribeh" className="chapter chapter-fit field-paper !py-14 md:!py-20" aria-labelledby="pribeh-nadpis">
          <div className="frame">
            <h2 id="pribeh-nadpis" className="display text-head" data-reveal style={order(0)}>
              {story.title}
            </h2>
            <div className="mt-10 grid items-center gap-y-10 md:mt-14 md:grid-cols-2 md:gap-x-12 lg:gap-x-20">
              <div data-reveal style={order(1)}>
                <Markdown source={story.body} settings={settings} className="text-lead [&_p]:leading-[1.45]" />
              </div>
              <figure data-reveal style={order(2)}>
                {/* výřez lahví bez pozadí (PNG s průhledností) – žádné prolnutí, které by při animaci problikávalo */}
                <Image
                  src="/img/lahve-vyrez.png"
                  alt="Třináct lahví edice vedle sebe, na každé portrét, jméno a číslo hráče"
                  width={1280}
                  height={543}
                  sizes="(min-width: 768px) 46vw, 100vw"
                  className="h-auto w-full"
                />
                <figcaption className="display mt-6 text-right text-head tabular">152 × 13 = 1 976</figcaption>
              </figure>
            </div>
          </div>
        </section>
      )}

      {/* Soupiska: živý výběr lahve */}
      <section id="soupiska" className="chapter field-night scroll-mt-[-1.25rem] !pt-16 md:!pt-24" aria-labelledby="soupiska-nadpis">
        <div className="frame">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-x-10 gap-y-4 md:mb-16">
            <h2 id="soupiska-nadpis" className="display text-head" data-reveal style={order(0)}>
              Soupiska finále: 13&nbsp;hráčů, 13&nbsp;lahví
            </h2>
            <p className="max-w-[40ch]" data-reveal style={order(1)}>
              Každý hráč finále má vlastní lahev. V&nbsp;boxu je všech 13, lahev svého oblíbeného hráče můžete koupit i&nbsp;samostatně za {formatCzk(bottles[0]?.priceCzk ?? 760)}.
            </p>
          </div>
          <LineupPicker
            players={bottles.map((p) => ({
              slug: p.slug,
              name: p.playerName ?? p.name,
              number: p.playerNumber,
              imageUrl: p.imageUrl,
              priceCzk: p.priceCzk,
            }))}
            initialSlug="antonin-panenka"
          />
        </div>
      </section>

      {/* Box: zlaté pole, velký výřez boxu a nabídka */}
      {box && (
        <section className="chapter field-gold" aria-labelledby="box-nadpis">
          <div className="frame grid items-center gap-y-12 md:grid-cols-12 md:gap-x-8">
            <figure className="relative md:col-span-7">
              <Seal
                decorative
                id="box-seal"
                className="pointer-events-none absolute left-1/2 top-1/2 h-[118%] w-auto -translate-x-1/2 -translate-y-1/2 opacity-25 [&_*]:stroke-[var(--ink)] [&_text]:fill-[var(--ink)]"
              />
              <div className="relative overflow-clip" data-shutter style={order(0)}>
                <Image
                  src="/img/box-vyrez.png"
                  alt={`${box.name}: otevřený box s fotografií mužstva a 13 lahvemi`}
                  width={1079}
                  height={640}
                  sizes="(min-width: 768px) 56vw, 100vw"
                  className="h-auto w-full"
                />
              </div>
            </figure>
            <div className="md:col-span-5 md:col-start-8">
              <h2 id="box-nadpis" className="display text-head" data-reveal style={order(1)}>
                {box.name}
              </h2>
              <p className="mt-6 max-w-[40ch] text-lead" data-reveal style={order(2)}>
                {box.shortDescription}
              </p>
              <div data-reveal style={order(3)}>
                <p className="display mt-10 text-head tabular">
                  {bottles.length > 0 && (
                    <span className="mr-2 align-middle text-lead font-normal text-[var(--soft)]">
                      {bottles.length}&nbsp;×&nbsp;{formatCzk(bottles[0].priceCzk)}&nbsp;=
                    </span>
                  )}
                  {formatCzk(box.priceCzk)}
                </p>
                <p className="mt-2 text-[var(--soft)]">
                  Doprava {formatCzk(settings.num("shipping.box_czk"))} za celou objednávku. Osobní převzetí v&nbsp;sídle FAČR
                  v&nbsp;Praze zdarma.
                </p>
                <StockBadge stock={box.stock} className="mt-6 text-lead" />
                <div className="mt-8">
                  {salesOpen ? (
                    <Link href="/eshop" className="btn btn-ink">
                      Do e-shopu
                    </Link>
                  ) : (
                    <p className="text-lead">Prodej bude brzy spuštěn.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Nadace: červené pole pečeti */}
      {foundation && (
        <section id="nadace" className="chapter chapter-fit field-seal" aria-labelledby="nadace-nadpis">
          <Seal decorative id="nadace-seal" className="pointer-events-none absolute -right-[18vw] top-1/2 h-[80vw] w-[80vw] -translate-y-1/2 opacity-40 [&_*]:stroke-[var(--seal-deep)] [&_text]:fill-[var(--seal-deep)] md:-right-[8vw] md:h-[46vw] md:w-[46vw]" />
          <div className="frame relative grid md:grid-cols-12">
            <div className="md:col-span-7">
              <h2 id="nadace-nadpis" className="display text-head" data-reveal style={order(0)}>
                {foundation.title}
              </h2>
              <div data-reveal style={order(1)}>
                <Markdown source={foundation.body} settings={settings} className="mt-8 text-lead [&_p]:leading-[1.45]" />
              </div>
              {foundationUrl && (
                <p className="mt-10" data-reveal style={order(2)}>
                  <a href={foundationUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ink">
                    Web Nadace fotbalových internacionálů
                  </a>
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Večer a dražba */}
      <section id="vecer" className="chapter chapter-fit field-night" aria-labelledby="vecer-nadpis">
        <div className="frame grid gap-y-14 lg:grid-cols-12 lg:gap-x-8">
          {evening && (
            <div className="lg:col-span-7">
              <h2 id="vecer-nadpis" className="display text-head" data-reveal style={order(0)}>
                {evening.title}
              </h2>
              <div data-reveal style={order(1)}>
                <Markdown source={evening.body} settings={settings} className="mt-8 text-lead [&_p]:leading-[1.45]" />
              </div>
            </div>
          )}
          {auction && (
            <aside className="field-panel self-end p-8 md:max-w-xl md:p-10 lg:col-span-4 lg:col-start-9" data-reveal style={order(2)}>
              <Seal size={88} id="drazba-seal" />
              <h3 className="display mt-6 text-[2rem]">{auction.title}</h3>
              <Markdown source={auction.body} settings={settings} className="mt-4" />
            </aside>
          )}
        </div>
      </section>
    </>
  );
}
