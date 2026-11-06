import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatCzk, formatDateTime, formatZip } from "@/lib/format";
import { formatIban, qrDataUrl, transferInstructions } from "@/lib/bank";
import { DELIVERY_LABEL, EVENING_ENTRY_NOTE, PAYMENT_LABEL, statusLabel } from "@/lib/labels";
import { syncOrderPayments } from "@/lib/orders/payments";
import { purchaseEventId } from "@/lib/meta-capi";
import { env } from "@/lib/env";
import { PayButton } from "./PayButton";
import { PurchaseTracker } from "./PurchaseTracker";

export const metadata: Metadata = { title: "Objednávka", robots: { index: false, follow: false } };

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ platba?: string }>;
};

export default async function OrderPage({ params, searchParams }: Props) {
  const [{ token }, { platba }] = await Promise.all([params, searchParams]);
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) notFound();

  let order = await prisma.order.findUnique({ where: { publicToken: token }, include: { items: true } });
  if (!order) notFound();

  // Návrat z platební brány: stav ověříme přímo v GoPay
  if (platba === "navrat" && order.status === "PENDING" && order.paymentMethod === "GOPAY") {
    await syncOrderPayments(order.id);
    order = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true } });
  }

  const settings = await getSettings();
  const isPaid = order.status === "PAID" || order.status === "SHIPPED" || order.status === "COMPLETED";
  const isPending = order.status === "PENDING";
  const expired = !!order.reservedUntil && order.reservedUntil < new Date();

  const transfer =
    isPending && order.paymentMethod === "BANK_TRANSFER" && !expired
      ? transferInstructions(settings.str("bank.account"), order.totalCzk, order.number, settings.str("seller.name"))
      : null;
  const qr = transfer ? await qrDataUrl(transfer.spd) : null;

  return (
    <div className="frame max-w-5xl py-12 md:py-20">
      <p className="text-muted">
        Objednávka č. <span className="tabular text-cream">{order.number}</span>
      </p>

      {isPaid && (
        <>
          <h1 className="display mt-4 text-head">Děkujeme, platba je přijata</h1>
          <p className="mt-6 max-w-[56ch] text-lead">
            Potvrzení o zaplacení jsme poslali na <strong className="text-cream">{order.email}</strong>. Výtěžek edice jde na podporu
            Nadace fotbalových internacionálů.
          </p>
          <PurchaseTracker
            orderNumber={order.number}
            value={order.totalCzk}
            eventId={purchaseEventId(order.number)}
            items={order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.unitPriceCzk }))}
          />
        </>
      )}

      {isPending && order.paymentMethod === "GOPAY" && (
        <>
          <h1 className="display mt-4 text-head">Objednávka čeká na zaplacení</h1>
          {platba === "navrat" && <p className="mt-6 max-w-[56ch] text-lead">Platba zatím nebyla dokončena nebo byla zrušena.</p>}
          {platba === "chyba" && (
            <p className="mt-4 text-warn">Platební bránu se nepodařilo otevřít. Objednávka je uložena, zkuste platbu spustit znovu.</p>
          )}
          {expired ? (
            <p className="mt-6 max-w-[56ch] text-lead">Čas na zaplacení vypršel. Objednávka bude zrušena.</p>
          ) : (
            <div className="mt-6 max-w-sm">
              <PayButton token={order.publicToken} />
              <p className="mt-3 text-muted">Zboží pro vás držíme do {formatDateTime(order.reservedUntil)}.</p>
            </div>
          )}
        </>
      )}

      {isPending && transfer && (
        <>
          <h1 className="display mt-4 text-head">Objednávka přijata</h1>
          <p className="mt-6 max-w-[56ch] text-lead">
            Děkujeme. Zaplaťte prosím převodem nebo naskenujte QR kód v bankovní aplikaci. Údaje jsme poslali i na{" "}
            <strong className="text-cream">{order.email}</strong>.
          </p>
          <div className="mt-10 grid gap-8 bg-panel p-6 sm:grid-cols-[1fr_auto] md:p-8">
            <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3">
              <dt className="text-muted">Číslo účtu</dt>
              <dd className="font-semibold text-cream">{transfer.account}</dd>
              <dt className="text-muted">IBAN</dt>
              <dd className="text-cream">{formatIban(transfer.iban)}</dd>
              <dt className="text-muted">Variabilní symbol</dt>
              <dd className="font-semibold text-cream">{transfer.variableSymbol}</dd>
              <dt className="text-muted">Částka</dt>
              <dd className="display tabular text-[2rem] leading-none text-gold-light">{formatCzk(transfer.amountCzk)}</dd>
              <dt className="text-muted">Zaplaťte do</dt>
              <dd className="text-cream">{formatDateTime(order.reservedUntil)}</dd>
            </dl>
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="QR kód pro platbu" width={200} height={200} className="mx-auto bg-white p-2" />
            )}
          </div>
          <p className="mt-4 text-muted">
            Po připsání platby vám pošleme potvrzení. Nezaplacená objednávka se po uplynutí lhůty automaticky zruší.
          </p>
        </>
      )}

      {isPending && order.paymentMethod === "BANK_TRANSFER" && expired && (
        <>
          <h1 className="display mt-4 text-head">Lhůta k zaplacení uplynula</h1>
          <p className="mt-6 max-w-[56ch] text-lead">
            Platbu jsme v určené lhůtě nepřijali, proto objednávku zrušíme. Pokud jste už zaplatili, ozvěte se nám prosím na{" "}
            <a href={`mailto:${settings.str("contact.email")}`} className="link text-gold-light">
              {settings.str("contact.email")}
            </a>{" "}
            – platbu dohledáme.
          </p>
        </>
      )}

      {order.status === "CANCELLED" && (
        <>
          <h1 className="display mt-4 text-head">Objednávka byla zrušena</h1>
          <p className="mt-6 max-w-[56ch] text-lead">
            Pokud jste již zaplatili, ozvěte se nám prosím na{" "}
            <a href={`mailto:${settings.str("contact.email")}`} className="link text-gold-light">
              {settings.str("contact.email")}
            </a>
            .
          </p>
        </>
      )}

      <section className="mt-14 bg-panel p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="display text-[2rem]">Shrnutí objednávky</h2>
          <span className="bg-panel-2 px-3 py-1.5 font-semibold">{statusLabel(order.status, order.deliveryMethod)}</span>
        </div>
        <ul className="mt-6 space-y-1">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 py-2">
              <span>
                {i.quantity}× {i.name}
                {i.madeToOrder && <span className="block text-small text-muted">vyrábí se na objednávku</span>}
              </span>
              <span className="tabular">{formatCzk(i.unitPriceCzk * i.quantity)}</span>
            </li>
          ))}
          <li className="flex justify-between gap-3 py-2 text-muted">
            <span>Doprava – {DELIVERY_LABEL[order.deliveryMethod]}</span>
            <span>{order.shippingCzk ? formatCzk(order.shippingCzk) : "zdarma"}</span>
          </li>
          <li className="!mt-4 flex items-baseline justify-between gap-3 bg-panel-2 px-4 py-4 font-semibold">
            <span>Celkem</span>
            <span className="display tabular text-[2rem] text-gold-light">{formatCzk(order.totalCzk)}</span>
          </li>
        </ul>
        <dl className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-muted">Platba</dt>
            <dd>{PAYMENT_LABEL[order.paymentMethod]}</dd>
          </div>
          <div>
            <dt className="text-muted">Doručení</dt>
            <dd>
              {order.deliveryMethod === "PICKUP" ? (
                <>
                  {settings.str("pickup.address")}
                  <span className="block text-small text-muted">{settings.text("pickup.note")}</span>
                </>
              ) : order.deliveryMethod === "PACKETA" ? (
                <>
                  Zásilkovna: {order.packetaPointName}
                  {order.packetaPointAddress && <span className="block text-small text-muted">{order.packetaPointAddress}</span>}
                </>
              ) : (
                <>
                  {order.street}, {formatZip(order.zip)} {order.city}
                </>
              )}
            </dd>
          </div>
          {order.trackingNumber && (
            <div>
              <dt className="text-muted">Zásilka</dt>
              <dd>
                {order.carrier}: {order.trackingNumber}
              </dd>
            </div>
          )}
          {order.eveningInterest && (
            <div>
              <dt className="text-muted">Slavnostní večer</dt>
              <dd>
                Zájem o losování o vstup
                <span className="block text-muted">{EVENING_ENTRY_NOTE}</span>
              </dd>
            </div>
          )}
        </dl>
      </section>

      {env.gopayMode === "mock" && isPending && order.paymentMethod === "GOPAY" && (
        <p className="mt-6 text-small text-warn">Vývojový režim: platby jsou simulované (GOPAY_MODE=mock).</p>
      )}

      <p className="mt-8">
        <Link href="/" className="link text-gold-light">
          Zpět na úvod
        </Link>
      </p>
    </div>
  );
}
