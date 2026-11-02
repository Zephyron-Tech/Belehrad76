"use client";

import { useActionState, useState } from "react";
import type { DeliveryMethod, OrderStatus, PaymentMethod } from "@prisma/client";
import { anonymizeAction, changeStatusAction, saveNoteAction, type ActionState } from "../../../actions";

const inputCls = "mt-1 w-full border border-line bg-ink px-3 py-2 text-sm text-cream focus:border-gold focus:outline-none";

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
}) {
  const [state, action, pending] = useActionState(changeStatusAction, undefined);
  const [actor, setActor] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const isPickup = props.deliveryMethod === "PICKUP";

  if (props.transitions.length === 0) {
    return (
      <section className="border border-line bg-panel p-5">
        <h2 className="font-serif text-lg font-bold text-gold">Stav</h2>
        <p className="mt-2 text-sm text-muted">Objednávka je uzavřená, další změny stavu nejsou možné.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 border border-gold/50 bg-panel p-5">
      <h2 className="font-serif text-lg font-bold text-gold">Změnit stav</h2>
      <ActorField value={actor} onChange={setActor} />

      {props.transitions.includes("PAID") && (
        <form action={action} className="border-t border-line pt-4">
          <input type="hidden" name="orderId" value={props.orderId} />
          <input type="hidden" name="to" value="PAID" />
          <input type="hidden" name="actor" value={actor} />
          <p className="text-sm text-muted">
            {props.status === "CANCELLED"
              ? "Platba dorazila po zrušení objednávky. Box se znovu odečte ze skladu, pokud je k dispozici."
              : props.paymentMethod === "BANK_TRANSFER"
                ? "Po připsání platby na účet (zkontrolujte VS a částku)."
                : "Platba přes GoPay se označí automaticky. Ručně jen ve výjimečných případech."}
          </p>
          <button disabled={pending} className="mt-2 w-full bg-ok px-4 py-2 text-sm font-bold text-ink disabled:opacity-60">
            Platba přijata → Zaplacená
          </button>
          <p className="mt-1 text-xs text-muted">Zákazníkovi odejde potvrzení platby s PDF.</p>
        </form>
      )}

      {props.transitions.includes("SHIPPED") && (
        <form action={action} className="space-y-2 border-t border-line pt-4">
          <input type="hidden" name="orderId" value={props.orderId} />
          <input type="hidden" name="to" value="SHIPPED" />
          <input type="hidden" name="actor" value={actor} />
          {isPickup ? (
            <p className="text-sm text-muted">Zákazník dostane e-mail, že objednávka je připravena k převzetí na FAČR.</p>
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
          <button disabled={pending} className="w-full bg-gold px-4 py-2 text-sm font-bold text-ink hover:bg-gold-light disabled:opacity-60">
            {isPickup ? "Připraveno k převzetí" : "Odesláno → poslat e-mail zákazníkovi"}
          </button>
        </form>
      )}

      {props.transitions.includes("COMPLETED") && (
        <form action={action} className="border-t border-line pt-4">
          <input type="hidden" name="orderId" value={props.orderId} />
          <input type="hidden" name="to" value="COMPLETED" />
          <input type="hidden" name="actor" value={actor} />
          <button disabled={pending} className="w-full border border-gold px-4 py-2 text-sm font-semibold text-gold-light disabled:opacity-60">
            {isPickup ? "Předáno zákazníkovi → Dokončená" : "Doručeno → Dokončená"}
          </button>
        </form>
      )}

      {props.transitions.includes("CANCELLED") && (
        <form action={action} className="border-t border-line pt-4">
          <input type="hidden" name="orderId" value={props.orderId} />
          <input type="hidden" name="to" value="CANCELLED" />
          <input type="hidden" name="actor" value={actor} />
          <label className="flex items-start gap-2 text-sm text-muted">
            <input type="checkbox" checked={confirmCancel} onChange={(e) => setConfirmCancel(e.target.checked)} className="mt-1" />
            <span>
              Opravdu zrušit? Box se vrátí na sklad.
              {props.status === "PAID" && " Peníze je nutné vrátit ručně (GoPay / převodem)."}
            </span>
          </label>
          <button
            disabled={pending || !confirmCancel}
            className="mt-2 w-full border border-danger/70 px-4 py-2 text-sm text-danger disabled:opacity-40"
          >
            Zrušit objednávku
          </button>
        </form>
      )}

      <Feedback state={state} />
    </section>
  );
}

export function NoteForm({ orderId, note }: { orderId: number; note: string }) {
  const [state, action, pending] = useActionState(saveNoteAction, undefined);
  return (
    <form action={action} className="border border-line bg-panel p-5">
      <h2 className="font-serif text-lg font-bold text-gold">Interní poznámka</h2>
      <input type="hidden" name="orderId" value={orderId} />
      <textarea name="internalNote" defaultValue={note} rows={4} maxLength={4000} className={inputCls} />
      <label className="mt-2 block text-xs text-muted">
        Jméno / iniciály
        <input name="actor" maxLength={40} className={inputCls} />
      </label>
      <button disabled={pending} className="mt-3 border border-line px-4 py-2 text-sm hover:border-gold disabled:opacity-60">
        Uložit poznámku
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function AnonymizeForm({ orderId }: { orderId: number }) {
  const [state, action, pending] = useActionState(anonymizeAction, undefined);
  return (
    <form action={action} className="border border-line bg-panel p-5">
      <h2 className="font-serif text-lg font-bold text-gold">GDPR – anonymizace</h2>
      <p className="mt-2 text-xs text-muted">
        Nevratně nahradí osobní údaje zákazníka (jméno, kontakt, adresa, poznámky). Položky a částky zůstanou. Používejte na žádost
        zákazníka nebo po uplynutí doby uchování – pozor na povinnosti pro účetnictví.
      </p>
      <input type="hidden" name="orderId" value={orderId} />
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" name="confirm" /> Rozumím, anonymizovat
      </label>
      <label className="mt-2 block text-xs text-muted">
        Jméno / iniciály
        <input name="actor" maxLength={40} className={inputCls} />
      </label>
      <button disabled={pending} className="mt-3 border border-danger/70 px-4 py-2 text-sm text-danger disabled:opacity-60">
        Anonymizovat
      </button>
      <Feedback state={state} />
    </form>
  );
}
