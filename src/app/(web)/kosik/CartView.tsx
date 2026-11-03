"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { useSyncedPricedCart } from "@/components/cart/usePricedCart";
import { formatCzk } from "@/lib/format";

export function CartView() {
  const { setQuantity, remove } = useCart();
  const { data, loading, error, ready, notices } = useSyncedPricedCart();

  if (!ready || (loading && !data)) return <p className="mt-10 text-muted">Načítám košík…</p>;
  if (error) return <p className="mt-10 font-medium text-danger">{error}</p>;

  if (!data || data.lines.length === 0) {
    return (
      <div className="mt-10 bg-panel p-8 md:p-12">
        <p className="display text-[2rem]">Košík je prázdný</p>
        {notices.map((i) => (
          <p key={i.slug} className="mt-3 text-warn">
            {i.message}
          </p>
        ))}
        <p className="mt-3 max-w-[48ch] text-muted">Box se 13 lahvemi i lahve jednotlivých hráčů najdete v e-shopu.</p>
        <Link href="/eshop" className="btn mt-8">
          Do e-shopu
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
      <div>
        {notices.length > 0 && (
          <div className="mb-8 bg-[color-mix(in_srgb,var(--warn)_14%,var(--ink))] p-5" role="status">
            {notices.map((i) => (
              <p key={i.slug}>{i.message}</p>
            ))}
          </div>
        )}

        <ul className="space-y-3">
          {data.lines.map((line) => (
            <li key={line.slug} className="cart-line bg-panel">
              <span className={`cart-line__thumb ${line.type === "BOTTLE" ? "label-paper" : "bg-paper"}`}>
                <Image
                  src={line.type === "BOX" ? "/img/box-vyrez.png" : line.imageUrl}
                  alt=""
                  width={line.type === "BOX" ? 1079 : 352}
                  height={line.type === "BOX" ? 640 : 600}
                  sizes="96px"
                  className={line.type === "BOX" ? "h-full w-full object-contain p-1" : "h-full w-full object-cover"}
                />
              </span>
              <div className="min-w-0">
                <Link
                  href={line.type === "BOX" ? "/eshop" : `/produkt/${line.slug}`}
                  className="link font-semibold decoration-transparent hover:decoration-current"
                >
                  {line.name}
                </Link>
                <p className="tabular text-muted">{formatCzk(line.unitPriceCzk)} / ks</p>
                {line.madeToOrder && <p className="text-small text-muted">Vyrábí se na objednávku</p>}
              </div>
              <div className="cart-line__controls">
                <div className="stepper" role="group" aria-label={`Počet – ${line.name}`}>
                  <button
                    type="button"
                    onClick={() => setQuantity(line.slug, line.quantity - 1)}
                    disabled={line.quantity <= 1}
                    aria-label="Méně"
                  >
                    −
                  </button>
                  <span className="tabular grid w-10 place-items-center font-semibold" aria-live="polite">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(line.slug, line.quantity + 1)}
                    disabled={line.quantity >= line.maxQuantity}
                    aria-label="Více"
                  >
                    +
                  </button>
                </div>
                <p className="tabular w-28 text-right font-semibold">{formatCzk(line.lineTotalCzk)}</p>
                <button
                  type="button"
                  onClick={() => remove(line.slug)}
                  className="link min-h-11 text-muted hover:text-danger"
                  aria-label={`Odebrat – ${line.name}`}
                >
                  Odebrat
                </button>
              </div>
            </li>
          ))}
        </ul>

        {data.boxes > 0 && <p className="mt-8 bg-panel-2 p-4">{data.boxDelivery}</p>}
        {data.hasMadeToOrder && <p className="mt-3 bg-panel-2 p-4">{data.leadTime}</p>}
      </div>

      <aside className="self-start bg-panel p-6 md:p-8 lg:sticky lg:top-24" aria-label="Souhrn košíku">
        <dl className="space-y-3">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Zboží</dt>
            <dd className="tabular">{formatCzk(data.itemsTotalCzk)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Doprava na adresu</dt>
            <dd className="tabular">{formatCzk(data.shipping.SHIPPING)}</dd>
          </div>
          {data.pickupEnabled && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">nebo osobní převzetí na FAČR</dt>
              <dd>zdarma</dd>
            </div>
          )}
          <div className="!mt-6 flex items-baseline justify-between gap-4 bg-panel-2 px-4 py-4">
            <dt className="font-semibold">Celkem s dopravou na adresu</dt>
            <dd className="display tabular text-[2rem] text-gold-light">{formatCzk(data.itemsTotalCzk + data.shipping.SHIPPING)}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col gap-3">
          {data.salesOpen ? (
            <Link href="/pokladna" className="btn w-full">
              K objednávce
            </Link>
          ) : (
            <p className="text-muted">Prodej zatím není spuštěn.</p>
          )}
          <Link href="/eshop" className="link text-center text-muted">
            Pokračovat v nákupu
          </Link>
        </div>
      </aside>
    </div>
  );
}
