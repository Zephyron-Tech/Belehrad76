"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { DeliveryMethod, OrderStatus, PaymentMethod } from "@prisma/client";
import type { PacketDraft } from "@/lib/packeta";
import { ConfirmSubmit } from "@/components/ConfirmDialog";
import { anonymizeAction, changeStatusAction, createPacketsAction, saveNoteAction, type ActionState } from "../../../actions";

const inputCls = "mt-1 w-full border border-line bg-ink px-3 py-2 text-sm text-cream focus:border-gold focus:outline-none";

/**
 * Zavolá serverovou akci mimo <form action>: React 19 po akci formulář vynuluje (při chybě by admin přišel o úpravy),
 * takhle zůstanou vyplněné hodnoty zachované.
 */
function useServerAction(fn: (prev: ActionState, form: FormData) => Promise<ActionState>) {
  const [state, setState] = useState<ActionState>(undefined);
  const [pending, start] = useTransition();
  const run = (form: FormData) => {
    setState(undefined);
    start(async () => {
      try {
        setState(await fn(undefined, form));
      } catch {
        setState({ error: "Spojení se serverem selhalo. Zkuste to znovu (případně obnovte stránku)." });
      }
    });
  };
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    run(new FormData(e.currentTarget));
  };
  return { state, pending, run, onSubmit, reset: () => setState(undefined) };
}

function Feedback({ state }: { state: ActionState }) {
  if (!state) return null;
  return (
    <p role={state.error ? "alert" : "status"} className={`mt-3 text-sm ${state.error ? "text-danger" : "text-ok"}`}>
      {state.error ?? state.ok}
    </p>
  );
}

/** Jméno / iniciály – účet je společný, ať je v historii vidět, kdo změnu udělal. */
function ActorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs text-muted">
      Vaše jméno nebo iniciály (nepovinné, pro historii)
      <input name="actor" value={value} onChange={(e) => onChange(e.target.value)} maxLength={40} className={inputCls} />
    </label>
  );
}

export function StatusActions(props: {
  orderId: number;
  status: OrderStatus;
  transitions: OrderStatus[];
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  /** Čárové kódy zásilek založených přes API Zásilkovny – předvyplní číslo zásilky */
  packetaBarcodes?: string[];
}) {
  const { state, pending, onSubmit } = useServerAction(changeStatusAction);
  const [actor, setActor] = useState("");
  const isPickup = props.deliveryMethod === "PICKUP";
  const isPacketa = props.deliveryMethod === "PACKETA";

  if (props.transitions.length === 0) {
    return (
      <section className="border border-line bg-panel p-5">
        <h2 className="font-serif text-lg font-bold text-gold">Stav</h2>
        <p className="mt-2 text-sm text-muted">Objednávka je uzavřená, další změny stavu nejsou možné.</p>
        <Feedback state={state} />
      </section>
    );
  }

  /** Společná skrytá pole každého formuláře; expectedStatus chrání před souběžnou změnou jiným adminem */
  const hidden = (to: OrderStatus) => (
    <>
      <input type="hidden" name="orderId" value={props.orderId} />
      <input type="hidden" name="to" value={to} />
      <input type="hidden" name="expectedStatus" value={props.status} />
      <input type="hidden" name="actor" value={actor} />
    </>
  );

  return (
    <section className="space-y-4 border border-gold/50 bg-panel p-5">
      <h2 className="font-serif text-lg font-bold text-gold">Změnit stav</h2>
      <ActorField value={actor} onChange={setActor} />

      {props.transitions.includes("PAID") && (
        <form onSubmit={onSubmit} className="border-t border-line pt-4">
          {hidden("PAID")}
          <p className="text-sm text-muted">
            {props.status === "CANCELLED"
              ? "Platba dorazila po zrušení objednávky. Box se znovu odečte ze skladu, pokud je k dispozici."
              : props.paymentMethod === "BANK_TRANSFER"
                ? "Po připsání platby na účet (zkontrolujte VS a částku)."
                : "Platba přes GoPay se označí automaticky. Ručně jen ve výjimečných případech."}
          </p>
          <div className="mt-2">
            <ConfirmSubmit
              trigger="Platba přijata → Zaplacená"
              triggerClassName="w-full bg-ok px-4 py-2 text-sm font-bold text-ink transition-opacity hover:opacity-90 disabled:opacity-60"
              title="Označit objednávku jako zaplacenou?"
              confirmLabel="Ano, zaplacená"
              pendingLabel="Ukládám…"
              pending={pending}
            >
              <p>Zákazníkovi odejde e-mail s potvrzením platby a PDF, provozovateli upozornění na novou zaplacenou objednávku.</p>
              <p>Zkontrolujte, že na účtu je správná částka a variabilní symbol.</p>
            </ConfirmSubmit>
          </div>
        </form>
      )}

      {props.transitions.includes("SHIPPED") && (
        <form onSubmit={onSubmit} className="space-y-2 border-t border-line pt-4">
          {hidden("SHIPPED")}
          {isPickup ? (
            <p className="text-sm text-muted">Zákazník dostane e-mail, že objednávka je připravena k převzetí na FAČR.</p>
          ) : isPacketa ? (
            <>
              <input type="hidden" name="carrier" value="Zásilkovna" />
              <label className="block text-sm">
                Číslo zásilky Zásilkovny
                <input
                  name="trackingNumber"
                  defaultValue={props.packetaBarcodes?.join(", ")}
                  key={props.packetaBarcodes?.join(",")}
                  className={inputCls}
                  placeholder="Z1234567890"
                />
              </label>
              <p className="text-xs text-muted">
                Nejdřív založte zásilku v bloku Zásilkovna níže (nebo ručně v klientské sekci s ověřením věku 18+), pak ji podejte na
                podacím místě a označte jako odeslanou.
              </p>
            </>
          ) : (
            <>
              <label className="block text-sm">
                Dopravce *
                <input name="carrier" required className={inputCls} placeholder="např. PPL, DPD, Česká pošta" />
              </label>
              <label className="block text-sm">
                Číslo zásilky
                <input name="trackingNumber" className={inputCls} />
              </label>
            </>
          )}
          <ConfirmSubmit
            trigger={isPickup ? "Připraveno k převzetí" : "Odesláno → poslat e-mail zákazníkovi"}
            triggerClassName="w-full bg-gold px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-gold-light disabled:opacity-60"
            title={isPickup ? "Označit jako připravenou k převzetí?" : "Označit objednávku jako odeslanou?"}
            confirmLabel={isPickup ? "Ano, připravena" : "Ano, odeslána"}
            pendingLabel="Odesílám e-mail…"
            pending={pending}
          >
            <p>
              {isPickup
                ? "Zákazníkovi odejde e-mail, že si objednávku může převzít na FAČR."
                : "Zákazníkovi odejde e-mail, že objednávka byla odeslána (s dopravcem a číslem zásilky)."}
            </p>
            <p>E-mail se odesílá jen jednou, změnu pak nelze vzít zpět.</p>
          </ConfirmSubmit>
        </form>
      )}

      {props.transitions.includes("COMPLETED") && (
        <form onSubmit={onSubmit} className="border-t border-line pt-4">
          {hidden("COMPLETED")}
          <ConfirmSubmit
            trigger={isPickup ? "Předáno zákazníkovi → Dokončená" : "Doručeno → Dokončená"}
            triggerClassName="w-full border border-gold px-4 py-2 text-sm font-semibold text-gold-light transition-colors hover:bg-gold hover:text-ink disabled:opacity-60"
            title="Dokončit objednávku?"
            confirmLabel="Ano, dokončit"
            pendingLabel="Ukládám…"
            pending={pending}
          >
            <p>Objednávka se uzavře. Další změny stavu už nebudou možné.</p>
          </ConfirmSubmit>
        </form>
      )}

      {props.transitions.includes("CANCELLED") && (
        <form onSubmit={onSubmit} className="border-t border-line pt-4">
          {hidden("CANCELLED")}
          <ConfirmSubmit
            trigger="Zrušit objednávku"
            triggerClassName="w-full border border-danger/70 px-4 py-2 text-sm text-danger transition-colors hover:bg-danger hover:text-ink disabled:opacity-40"
            title="Opravdu zrušit objednávku?"
            confirmLabel="Ano, zrušit"
            pendingLabel="Ruším…"
            danger
            pending={pending}
          >
            <p>Box se vrátí na sklad a objednávku už nepůjde obnovit jinak než ručním označením platby.</p>
            {props.status === "PAID" && <p className="text-warn">Objednávka je zaplacená: peníze je nutné vrátit ručně (GoPay / převodem).</p>}
          </ConfirmSubmit>
        </form>
      )}

      <Feedback state={state} />
    </section>
  );
}

export function NoteForm({ orderId, note }: { orderId: number; note: string }) {
  const { state, pending, onSubmit } = useServerAction(saveNoteAction);
  // řízená pole: text zůstane i po chybě
  const [text, setText] = useState(note);
  const [actor, setActor] = useState("");
  const dirty = text !== note;
  return (
    <form onSubmit={onSubmit} className="border border-line bg-panel p-5">
      <h2 className="font-serif text-lg font-bold text-gold">Interní poznámka</h2>
      <input type="hidden" name="orderId" value={orderId} />
      <textarea name="internalNote" value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={4000} className={inputCls} />
      <label className="mt-2 block text-xs text-muted">
        Jméno / iniciály
        <input name="actor" value={actor} onChange={(e) => setActor(e.target.value)} maxLength={40} className={inputCls} />
      </label>
      <div className="mt-3 flex items-center gap-3">
        <button disabled={pending} className="border border-line px-4 py-2 text-sm transition-colors hover:border-gold disabled:opacity-60">
          {pending ? "Ukládám…" : "Uložit poznámku"}
        </button>
        {dirty && !pending && <span className="text-xs text-warn">Neuloženo</span>}
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function AnonymizeForm({ orderId }: { orderId: number }) {
  const { state, pending, onSubmit } = useServerAction(anonymizeAction);
  const [actor, setActor] = useState("");
  return (
    <form onSubmit={onSubmit} className="border border-line bg-panel p-5">
      <h2 className="font-serif text-lg font-bold text-gold">GDPR – anonymizace</h2>
      <p className="mt-2 text-xs text-muted">
        Nevratně nahradí osobní údaje zákazníka (jméno, kontakt, adresa, poznámky). Položky a částky zůstanou. Používejte na žádost
        zákazníka nebo po uplynutí doby uchování – pozor na povinnosti pro účetnictví.
      </p>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="confirm" value="on" />
      <label className="mt-2 block text-xs text-muted">
        Jméno / iniciály
        <input name="actor" value={actor} onChange={(e) => setActor(e.target.value)} maxLength={40} className={inputCls} />
      </label>
      <div className="mt-3">
        <ConfirmSubmit
          trigger="Anonymizovat"
          triggerClassName="border border-danger/70 px-4 py-2 text-sm text-danger transition-colors hover:bg-danger hover:text-ink disabled:opacity-60"
          title="Nevratně anonymizovat objednávku?"
          confirmLabel="Anonymizovat"
          pendingLabel="Anonymizuji…"
          requireText="ANONYMIZOVAT"
          danger
          pending={pending}
        >
          <p>Jméno, kontakt, adresa a poznámky zákazníka se nenávratně smažou. Částky a položky zůstanou.</p>
          <p className="text-warn">Tuto akci nelze vrátit zpět.</p>
        </ConfirmSubmit>
      </div>
      <Feedback state={state} />
    </form>
  );
}

/** Zásilkovna: shrnutí zásilky s možností úprav, založení přes API a štítek k tisku. */
export function PacketaForm(props: {
  orderId: number;
  canCreate: boolean;
  apiReady: boolean;
  barcodes: string[];
  draft: PacketDraft;
}) {
  const { state, pending, onSubmit, reset } = useServerAction(createPacketsAction);
  const [adult, setAdult] = useState(props.draft.adultContent);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { draft } = props;

  // Po úspěšném založení dialog zavřít (výsledek se ukáže v bloku Zásilkovna)
  useEffect(() => {
    if (state?.ok) dialogRef.current?.close();
  }, [state]);
  const missing = draft.parcels.length;
  const smallCls = "mt-1 w-full border border-line bg-ink px-2 py-1.5 text-sm text-cream focus:border-gold focus:outline-none";

  return (
    <section className="border border-line bg-panel p-5">
      <h2 className="font-serif text-lg font-bold text-gold">Zásilkovna</h2>
      {props.barcodes.length > 0 && (
        <>
          <ul className="mt-2 space-y-1 text-sm">
            {props.barcodes.map((b) => (
              <li key={b}>
                <a
                  href={`https://tracking.packeta.com/cs/?id=${encodeURIComponent(b)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-gold-light underline underline-offset-2"
                >
                  {b}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={`/admin/zasilkovna/stitek/${props.orderId}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block border border-gold px-4 py-2 text-sm font-semibold text-gold-light hover:bg-gold hover:text-ink"
          >
            Stáhnout štítek{props.barcodes.length > 1 ? "y" : ""} (PDF)
          </a>
        </>
      )}
      {missing > 0 &&
        (!props.apiReady ? (
          <p className="mt-2 text-sm text-muted">
            API Zásilkovny není nastavené (PACKETA_API_PASSWORD). Zásilku založte ručně v klientské sekci – s ID výdejního místa a
            ověřením věku 18+.
          </p>
        ) : !props.canCreate ? (
          <p className="mt-2 text-sm text-muted">Zásilku lze založit, až bude objednávka zaplacená.</p>
        ) : (
          <>
          <button
            type="button"
            onClick={() => {
              reset();
              dialogRef.current?.showModal();
            }}
            className="mt-3 w-full bg-gold px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-gold-light"
          >
            {props.barcodes.length > 0 ? "Založit zbývající zásilky…" : "Založit zásilku…"}
          </button>
          <dialog
            ref={dialogRef}
            aria-labelledby={`packeta-dialog-${props.orderId}`}
            // během zakládání (volání API Zásilkovny) okno nejde zavřít, ať admin nepřijde o výsledek
            onCancel={(e) => {
              if (pending) e.preventDefault();
            }}
            className="m-auto w-[min(36rem,calc(100vw-2rem))] border border-gold/50 bg-panel p-0 text-cream backdrop:bg-black/70"
          >
          <form onSubmit={onSubmit} className="max-h-[85svh] space-y-4 overflow-y-auto p-5 text-sm">
            <div className="flex items-start justify-between gap-4">
              <h3 id={`packeta-dialog-${props.orderId}`} className="font-serif text-lg font-bold text-gold">
                Nová zásilka Zásilkovny
              </h3>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                disabled={pending}
                aria-label="Zavřít"
                className="px-2 text-xl leading-none text-muted transition-colors hover:text-cream disabled:opacity-40"
              >
                ×
              </button>
            </div>
            <input type="hidden" name="orderId" value={props.orderId} />
            <input type="hidden" name="parcelCount" value={missing} />
            <p className="text-xs text-muted">Zkontrolujte a případně upravte údaje. Zásilka se založí až potvrzením dole.</p>

            <div>
              <p className="text-muted">Výdejní místo</p>
              <p className="font-semibold">{draft.pointName}</p>
              {draft.pointAddress && <p className="text-cream/80">{draft.pointAddress}</p>}
              <p className="text-xs text-muted">ID {draft.addressId} · bez dobírky (zaplaceno předem)</p>
            </div>

            <fieldset className="grid grid-cols-2 gap-2">
              <legend className="mb-1 text-muted">Příjemce</legend>
              <label>
                Jméno
                <input name="name" defaultValue={draft.recipient.name} maxLength={32} required className={smallCls} />
              </label>
              <label>
                Příjmení
                <input name="surname" defaultValue={draft.recipient.surname} maxLength={32} required className={smallCls} />
              </label>
              <label className="col-span-2">
                E-mail
                <input name="email" type="email" defaultValue={draft.recipient.email} required className={smallCls} />
              </label>
              <label className="col-span-2">
                Telefon (na něj přijde SMS s kódem)
                <input name="phone" defaultValue={draft.recipient.phone} required className={smallCls} />
              </label>
            </fieldset>

            {draft.parcels.map((p, i) => (
              <fieldset key={p.number} className="grid grid-cols-3 gap-2 border-t border-line pt-3">
                <legend className="col-span-3 text-muted">
                  Zásilka {p.number}
                  {draft.totalParcels > 1 && ` (${p.index + 1}/${draft.totalParcels})`} · {p.bottles} ks
                </legend>
                <label>
                  Hmotnost (kg)
                  <input name={`p${i}_weight`} defaultValue={p.weightKg} inputMode="decimal" required className={smallCls} />
                </label>
                <label className="col-span-2">
                  Hodnota pro pojištění (Kč)
                  <input name={`p${i}_value`} defaultValue={p.valueCzk} inputMode="numeric" required className={smallCls} />
                </label>
                <label>
                  Délka (mm)
                  <input name={`p${i}_length`} defaultValue={p.size.length} inputMode="numeric" required className={smallCls} />
                </label>
                <label>
                  Šířka (mm)
                  <input name={`p${i}_width`} defaultValue={p.size.width} inputMode="numeric" required className={smallCls} />
                </label>
                <label>
                  Výška (mm)
                  <input name={`p${i}_height`} defaultValue={p.size.height} inputMode="numeric" required className={smallCls} />
                </label>
                <p className="col-span-3 text-xs text-muted">
                  Rozměry jsou odhad – zadejte skutečnou krabici. Standardní zásilka: nejdelší strana max. 600 mm, součet stran max. 1 200 mm.
                </p>
              </fieldset>
            ))}

            <label className="block border-t border-line pt-3">
              Poznámka na štítek (nepovinné)
              <input name="note" maxLength={128} className={smallCls} />
            </label>

            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                name="adultContent"
                checked={adult}
                onChange={(e) => setAdult(e.target.checked)}
                className="mt-1 accent-[var(--gold)]"
              />
              <span>
                Ověření věku 18+ při výdeji (25 Kč)
                {!adult && <span className="block text-xs text-danger">Zásilka obsahuje alkohol – bez ověření věku ji neposílejte.</span>}
              </span>
            </label>

            <label className="block text-xs text-muted">
              Vaše jméno nebo iniciály (nepovinné, pro historii)
              <input name="actor" maxLength={40} className={smallCls} />
            </label>

            {state?.error && (
              <p role="alert" className="text-sm text-danger">
                {state.error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                disabled={pending}
                className="border border-line px-4 py-2 text-sm text-cream transition-colors hover:border-gold disabled:opacity-50"
              >
                Zrušit
              </button>
              <button
                disabled={pending}
                aria-busy={pending}
                className="flex-1 bg-gold px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-gold-light disabled:opacity-60"
              >
                {pending
                  ? "Zakládám…"
                  : `Potvrdit a založit ${missing > 1 ? `${missing} zásilky` : "zásilku"}`}
              </button>
            </div>
          </form>
          </dialog>
          </>
        ))}
      {state?.ok && <Feedback state={state} />}
    </section>
  );
}

