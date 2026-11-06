"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useSyncedPricedCart } from "@/components/cart/usePricedCart";
import { formatCzk } from "@/lib/format";
import { currentConsent, readCookie } from "@/lib/consent";
import { EVENING_ENTRY_NOTE } from "@/lib/labels";
import { Turnstile } from "./Turnstile";
import { PacketaPicker, type PacketaPoint } from "./PacketaPicker";

type Props = {
  pickupAddress: string;
  pickupNote: string;
  eveningDate: string;
  transferDays: number;
  gopayMinutes: number;
  boxShippingCzk: number;
  packetaApiKey?: string;
  packetaMock: boolean;
  turnstileSiteKey?: string;
};

type Delivery = "SHIPPING" | "PACKETA" | "PICKUP";
type Payment = "GOPAY" | "BANK_TRANSFER";

const inputCls = "input mt-2";
const labelCls = "block font-medium";
const legendCls = "display text-[2rem]";
const checkCls = "mt-0.5 size-5 shrink-0 accent-[var(--gold)]";

export function CheckoutForm(props: Props) {
  const { clear } = useCart();
  const { data, loading, ready, notices, inSync, refresh } = useSyncedPricedCart();

  const [delivery, setDelivery] = useState<Delivery>("PACKETA");
  const [packetaPoint, setPacketaPoint] = useState<PacketaPoint | null>(null);
  const [payment, setPayment] = useState<Payment>("GOPAY");
  const [company, setCompany] = useState(false);
  const [evening, setEvening] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Turnstile token je jednorázový: po neúspěšném odeslání se widget načte znovu
  const [tsKey, setTsKey] = useState(0);
  const submittingRef = useRef(false);

  const onToken = useCallback((t: string | null) => setTurnstileToken(t), []);
  const alertRef = useRef<HTMLDivElement>(null);

  // Po neúspěšném odeslání přejde focus na první chybné pole, jinak na hlášku nahoře
  useEffect(() => {
    if (!formError) return;
    const invalid = document.querySelector<HTMLElement>('form [aria-invalid="true"]');
    (invalid ?? alertRef.current)?.focus();
  }, [formError, fieldErrors]);

  // Nabízí se jen způsoby dostupné pro obsah košíku (box → kurýr, kusovky → Zásilkovna, nad 490 Kč → kurýr)
  const available = (d: Delivery) => !!data && data.shipping[d] !== null && (d !== "PICKUP" || data.pickupEnabled);
  const effectiveDelivery: Delivery = available(delivery)
    ? delivery
    : ((["PACKETA", "SHIPPING", "PICKUP"] as const).find(available) ?? delivery);
  const shipping = data ? (data.shipping[effectiveDelivery] ?? 0) : 0;
  const total = data ? data.itemsTotalCzk + shipping : 0;
  const hasBox = useMemo(() => (data?.boxes ?? 0) > 0, [data]);

  if (!ready || (loading && !data)) return <p className="mt-8 text-muted">Načítám…</p>;
  if (!data || data.lines.length === 0) {
    return (
      <div className="mt-10 bg-panel p-8 md:p-12">
        <p className="display text-[2rem]">Košík je prázdný</p>
        <Link href="/eshop" className="btn mt-6">
          Do e-shopu
        </Link>
      </div>
    );
  }
  if (!data.salesOpen) return <p className="mt-8 text-muted">Prodej zatím není spuštěn.</p>;

  const err = (key: string) =>
    fieldErrors[key] ? (
      <p id={`${key}-error`} className="mt-2 font-medium text-danger">
        {fieldErrors[key]}
      </p>
    ) : null;
  const aria = (key: string) => ({
    "aria-invalid": fieldErrors[key] ? true : undefined,
    "aria-describedby": fieldErrors[key] ? `${key}-error` : undefined,
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!data) return;
    setFormError(null);
    setFieldErrors({});

    if (!inSync) {
      setFormError("Košík se mezitím změnil – zkontrolujte prosím souhrn objednávky a odešlete ji znovu.");
      return;
    }
    if (effectiveDelivery === "PACKETA" && !packetaPoint) {
      setFieldErrors({ packetaPoint: "Vyberte výdejní místo Zásilkovny." });
      setFormError("Vyberte prosím výdejní místo Zásilkovny.");
      return;
    }
    if (props.turnstileSiteKey && !turnstileToken) {
      setFormError("Počkejte prosím na ověření, že nejste robot.");
      return;
    }

    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim();
    const consent = currentConsent();
    const body = {
      lines: data.lines.map((l) => ({ slug: l.slug, quantity: l.quantity })),
      customer: { firstName: s("firstName"), lastName: s("lastName"), email: s("email"), phone: s("phone") },
      deliveryMethod: effectiveDelivery,
      address: effectiveDelivery === "SHIPPING" ? { street: s("street"), city: s("city"), zip: s("zip") } : undefined,
      packetaPoint: effectiveDelivery === "PACKETA" ? (packetaPoint ?? undefined) : undefined,
      billing: company ? { companyName: s("companyName"), ico: s("ico"), dic: s("dic") } : undefined,
      note: s("note") || undefined,
      paymentMethod: payment,
      eveningInterest: hasBox && evening,
      consents: {
        terms: f.get("terms") === "on",
        age: f.get("age") === "on",
        privacy: f.get("privacy") === "on",
        marketing: f.get("marketing") === "on",
      },
      tracking: {
        consent: !!consent?.marketing,
        fbp: consent?.marketing ? readCookie("_fbp") : undefined,
        fbc: consent?.marketing ? readCookie("_fbc") : undefined,
      },
      turnstileToken: turnstileToken ?? undefined,
    };

    // dvojklik / dvojí klepnutí dřív, než se překreslí tlačítko
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/objednavka", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { redirectUrl?: string; error?: string; fieldErrors?: Record<string, string> };
      if (!res.ok || !json.redirectUrl) {
        setFieldErrors(json.fieldErrors ?? {});
        setFormError(json.error ?? "Objednávku se nepodařilo odeslat.");
        submittingRef.current = false;
        setSubmitting(false);
        setTurnstileToken(null);
        setTsKey((k) => k + 1);
        refresh(); // ceny a sklad se mohly mezitím změnit
        return;
      }
      clear();
      window.location.href = json.redirectUrl;
    } catch {
      setFormError("Spojení selhalo. Zkuste to prosím znovu.");
      submittingRef.current = false;
      setSubmitting(false);
      setTurnstileToken(null);
      setTsKey((k) => k + 1);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
      <div className="space-y-14">
        {formError && (
          <div role="alert" ref={alertRef} tabIndex={-1} className="bg-[color-mix(in_srgb,var(--danger)_16%,var(--ink))] p-5 font-medium text-cream">
            {formError}
          </div>
        )}
        {notices.length > 0 && (
          <div role="status" className="bg-[color-mix(in_srgb,var(--warn)_14%,var(--ink))] p-5 text-cream">
            {notices.map((i) => (
              <p key={i.slug}>{i.message}</p>
            ))}
          </div>
        )}

        <fieldset>
          <legend className={legendCls}>Kontaktní údaje</legend>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className={labelCls}>
              Jméno *
              <input name="firstName" autoComplete="given-name" required className={inputCls} {...aria("customer.firstName")} />
              {err("customer.firstName")}
            </label>
            <label className={labelCls}>
              Příjmení *
              <input name="lastName" autoComplete="family-name" required className={inputCls} {...aria("customer.lastName")} />
              {err("customer.lastName")}
            </label>
            <label className={labelCls}>
              E-mail *
              <input name="email" type="email" autoComplete="email" required className={inputCls} {...aria("customer.email")} />
              {err("customer.email")}
            </label>
            <label className={labelCls}>
              Telefon *
              <input name="phone" type="tel" autoComplete="tel" required placeholder="+420 777 123 456" className={inputCls} {...aria("customer.phone")} />
              {err("customer.phone")}
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend className={legendCls}>Doprava</legend>
          <div className="mt-6 grid gap-3">
            {available("PACKETA") && (
              <label className="option-tile" data-selected={effectiveDelivery === "PACKETA"}>
                <input type="radio" name="delivery" checked={effectiveDelivery === "PACKETA"} onChange={() => setDelivery("PACKETA")} className={checkCls} />
                <span className="flex-1">
                  <span className="flex justify-between gap-4 font-semibold">
                    Zásilkovna – výdejní místo <span className="tabular text-gold-light">{formatCzk(data.shipping.PACKETA ?? 0)}</span>
                  </span>
                  <span className="mt-1 block text-muted">
                    Cena podle hmotnosti zásilky. Jen výdejní místa s obsluhou (ne Z-BOX), při vyzvednutí Zásilkovna ověří věk 18+ (doklad totožnosti).
                  </span>
                </span>
              </label>
            )}
            {available("SHIPPING") && (
              <label className="option-tile" data-selected={effectiveDelivery === "SHIPPING"}>
                <input type="radio" name="delivery" checked={effectiveDelivery === "SHIPPING"} onChange={() => setDelivery("SHIPPING")} className={checkCls} />
                <span className="flex-1">
                  <span className="flex justify-between gap-4 font-semibold">
                    Kurýr na adresu v ČR <span className="tabular text-gold-light">{formatCzk(data.shipping.SHIPPING ?? 0)}</span>
                  </span>
                  <span className="mt-1 block text-muted">
                    {hasBox
                      ? `${formatCzk(props.boxShippingCzk)} za celou objednávku s boxem. ${data.boxDelivery}`
                      : `${formatCzk(props.boxShippingCzk)} za celou zásilku.`}{" "}
                    Při převzetí může dopravce ověřit věk 18+.
                  </span>
                </span>
              </label>
            )}
            {data.pickupEnabled && (
              <label className="option-tile" data-selected={effectiveDelivery === "PICKUP"}>
                <input type="radio" name="delivery" checked={effectiveDelivery === "PICKUP"} onChange={() => setDelivery("PICKUP")} className={checkCls} />
                <span className="flex-1">
                  <span className="flex justify-between gap-4 font-semibold">
                    Osobní převzetí na FAČR <span className="text-gold-light">zdarma</span>
                  </span>
                  <span className="mt-1 block text-muted">
                    {props.pickupAddress}. {props.pickupNote}
                  </span>
                </span>
              </label>
            )}
          </div>

          {effectiveDelivery === "PACKETA" && (
            <PacketaPicker
              apiKey={props.packetaApiKey}
              mock={props.packetaMock}
              value={packetaPoint}
              onChange={(p) => {
                setPacketaPoint(p);
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.packetaPoint;
                  return next;
                });
              }}
              error={fieldErrors["packetaPoint"] ?? fieldErrors["packetaPoint.id"] ?? null}
            />
          )}

          {effectiveDelivery === "SHIPPING" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr]">
              <label className={`${labelCls} sm:col-span-2`}>
                Ulice a číslo popisné *
                <input name="street" autoComplete="street-address" className={inputCls} {...aria("address.street")} />
                {err("address.street")}
              </label>
              <label className={labelCls}>
                Město *
                <input name="city" autoComplete="address-level2" className={inputCls} {...aria("address.city")} />
                {err("address.city")}
              </label>
              <label className={labelCls}>
                PSČ *
                <input name="zip" autoComplete="postal-code" inputMode="numeric" placeholder="110 00" className={inputCls} {...aria("address.zip")} />
                {err("address.zip")}
              </label>
              <p className="text-small text-muted sm:col-span-2">Doručujeme pouze v rámci České republiky.</p>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className={legendCls}>Platba</legend>
          <div className="mt-6 grid gap-3">
            <label className="option-tile" data-selected={payment === "GOPAY"}>
              <input type="radio" name="payment" checked={payment === "GOPAY"} onChange={() => setPayment("GOPAY")} className={checkCls} />
              <span>
                <span className="block font-semibold">Online kartou nebo bankovním převodem</span>
                <span className="mt-1 block text-muted">
                  Platební brána GoPay (karta, Apple Pay, Google Pay, rychlý převod). Zboží držíme {props.gopayMinutes} minut.
                </span>
              </span>
            </label>
            <label className="option-tile" data-selected={payment === "BANK_TRANSFER"}>
              <input type="radio" name="payment" checked={payment === "BANK_TRANSFER"} onChange={() => setPayment("BANK_TRANSFER")} className={checkCls} />
              <span>
                <span className="block font-semibold">Bankovním převodem / QR kódem</span>
                <span className="mt-1 block text-muted">
                  Platební údaje a QR kód dostanete po odeslání objednávky. Zboží držíme {props.transferDays} dní.
                </span>
              </span>
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend className={legendCls}>Fakturační údaje</legend>
          <label className="mt-5 flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={company} onChange={(e) => setCompany(e.target.checked)} className={checkCls} />
            Nakupuji na firmu (doplnit IČO a DIČ)
          </label>
          {company && (
            <div className="appear mt-4 grid gap-4 sm:grid-cols-3">
              <label className={`${labelCls} sm:col-span-3`}>
                Název firmy
                <input name="companyName" autoComplete="organization" className={inputCls} {...aria("billing.companyName")} />
                {err("billing.companyName")}
              </label>
              <label className={labelCls}>
                IČO
                <input name="ico" inputMode="numeric" className={inputCls} {...aria("billing.ico")} />
                {err("billing.ico")}
              </label>
              <label className={labelCls}>
                DIČ
                <input name="dic" placeholder="CZ12345678" className={inputCls} {...aria("billing.dic")} />
                {err("billing.dic")}
              </label>
            </div>
          )}
        </fieldset>

        {/* Losování o vstup jen při nákupu boxu (1 vstup na 1 box) */}
        {hasBox && (
          <fieldset>
            <legend className={legendCls}>Slavnostní večer {props.eveningDate}</legend>
            <label className="mt-6 flex cursor-pointer items-start gap-3 bg-panel p-6 md:p-8">
              <input type="checkbox" checked={evening} onChange={(e) => setEvening(e.target.checked)} className={checkCls} />
              <span>
                Chci se zúčastnit losování o vstup na slavnostní večer {props.eveningDate}
                <span className="mt-1 block text-muted">
                  Do losování zařadíme zaplacené objednávky boxů z předprodeje. {EVENING_ENTRY_NOTE}
                </span>
              </span>
            </label>
          </fieldset>
        )}

        <label className={labelCls}>
          Poznámka k objednávce
          <textarea name="note" rows={3} maxLength={1000} className={inputCls} />
        </label>

        <fieldset className="space-y-4">
          <legend className="sr-only">Souhlasy</legend>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="age" required className={checkCls} {...aria("consents.age")} />
            <span>
              Potvrzuji, že je mi <strong>více než 18 let</strong>. *{err("consents.age")}
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="terms" required className={checkCls} {...aria("consents.terms")} />
            <span>
              Souhlasím s{" "}
              <Link href="/obchodni-podminky" target="_blank" className="link text-gold-light">
                obchodními podmínkami
              </Link>
              . *{err("consents.terms")}
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="privacy" required className={checkCls} {...aria("consents.privacy")} />
            <span>
              Seznámil(a) jsem se se{" "}
              <Link href="/ochrana-osobnich-udaju" target="_blank" className="link text-gold-light">
                zásadami ochrany osobních údajů
              </Link>
              . *{err("consents.privacy")}
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="marketing" className={checkCls} />
            <span className="text-muted">Chci dostávat novinky o edici a podobných akcích e-mailem (nepovinné).</span>
          </label>
        </fieldset>

        {props.turnstileSiteKey && <Turnstile key={tsKey} siteKey={props.turnstileSiteKey} onToken={onToken} />}
      </div>

      <aside className="self-start bg-panel p-6 md:p-8 lg:sticky lg:top-24">
        <h2 className="display text-[2rem]">Souhrn</h2>
        <ul className="mt-6 space-y-3">
          {data.lines.map((l) => (
            <li key={l.slug} className="flex justify-between gap-3">
              <span>
                {l.quantity}× {l.name}
              </span>
              <span className="tabular shrink-0">{formatCzk(l.lineTotalCzk)}</span>
            </li>
          ))}
          <li className="flex justify-between gap-3 text-muted">
            <span>Doprava</span>
            <span className="tabular">{shipping ? formatCzk(shipping) : "zdarma"}</span>
          </li>
        </ul>
        <p className="mt-6 flex items-baseline justify-between gap-4 bg-panel-2 px-4 py-4">
          <span className="font-semibold">Celkem</span>
          <span className="display tabular text-[2rem] text-gold-light">{formatCzk(total)}</span>
        </p>
        <p className="mt-2 text-small text-muted">Ceny včetně DPH.</p>
        {data.hasMadeToOrder && <p className="mt-3 text-small">{data.leadTime}</p>}
        <button
          type="submit"
          disabled={submitting || loading}
          aria-busy={submitting}
          className="btn mt-6 w-full disabled:cursor-wait"
        >
          {submitting ? "Odesílám…" : payment === "GOPAY" ? "Objednat a zaplatit" : "Objednat s povinností platby"}
        </button>
        <Link href="/kosik" className="link mt-4 block text-center text-muted">
          Upravit košík
        </Link>
        <p className="mt-6 text-small text-muted">Výtěžek edice jde na podporu Nadace fotbalových internacionálů.</p>
      </aside>
    </form>
  );
}
