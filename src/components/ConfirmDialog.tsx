"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/**
 * Tlačítko, které před odesláním formuláře otevře potvrzovací okno (nativní <dialog>: ESC, past fokusu a pozadí zdarma).
 * Musí být uvnitř <form> – potvrzovací tlačítko ho odešle. Během odesílání nejde okno zavřít ani ESC.
 * `requireText` = text, který je nutné opsat (u nevratných akcí).
 */
export function ConfirmSubmit(props: {
  trigger: ReactNode;
  triggerClassName: string;
  triggerDisabled?: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  danger?: boolean;
  pending: boolean;
  requireText?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const wasPending = useRef(false);
  const titleId = useId();
  const [typed, setTyped] = useState("");

  // Po dokončení akce (úspěch i chyba) okno zavřít, výsledek ukáže formulář pod ním
  useEffect(() => {
    if (wasPending.current && !props.pending) ref.current?.close();
    wasPending.current = props.pending;
  }, [props.pending]);

  const typedOk = !props.requireText || typed.trim().toLowerCase() === props.requireText.toLowerCase();

  return (
    <>
      <button
        type="button"
        disabled={props.triggerDisabled || props.pending}
        className={props.triggerClassName}
        onClick={(e) => {
          // povinná pole formuláře se ověří před otevřením okna
          if (e.currentTarget.form && !e.currentTarget.form.reportValidity()) return;
          setTyped("");
          ref.current?.showModal();
        }}
      >
        {props.trigger}
      </button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onCancel={(e) => {
          if (props.pending) e.preventDefault();
        }}
        className="m-auto w-[min(30rem,calc(100vw-2rem))] border border-gold/50 bg-panel p-0 text-cream backdrop:bg-black/70"
      >
        <div className="space-y-4 p-5 text-sm">
          <h3 id={titleId} className="font-serif text-lg font-bold text-gold">
            {props.title}
          </h3>
          <div className="space-y-2 text-cream/85">{props.children}</div>
          {props.requireText && (
            <label className="block text-muted">
              Pro potvrzení opište <strong className="text-cream">{props.requireText}</strong>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                className="mt-1 w-full border border-line bg-ink px-3 py-2 text-sm text-cream focus:border-gold focus:outline-none"
              />
            </label>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={props.pending}
              onClick={() => ref.current?.close()}
              className="border border-line px-4 py-2 text-cream transition-colors hover:border-gold disabled:opacity-50"
            >
              Zpět
            </button>
            <button
              type="submit"
              disabled={props.pending || !typedOk}
              aria-busy={props.pending}
              className={`flex-1 px-4 py-2 font-bold text-ink transition-colors disabled:opacity-50 ${
                props.danger ? "bg-danger hover:brightness-110" : "bg-gold hover:bg-gold-light"
              }`}
            >
              {props.pending ? (props.pendingLabel ?? "Pracuji…") : props.confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
