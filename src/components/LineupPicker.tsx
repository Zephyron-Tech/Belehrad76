"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { formatCzk } from "@/lib/format";
import { Seal } from "./Seal";

export type LineupPlayer = {
  slug: string;
  name: string;
  number: number | null;
  imageUrl: string;
  priceCzk: number;
};

/**
 * Soupiska: 13 jmen s čísly dresů. Výběr jména (klik, klávesnice, na počítači i najetí myší)
 * přepne etiketu jeho lahve na kotouči pečeti. Bez skriptu je vidět výchozí hráč a odkaz do e-shopu.
 */
export function LineupPicker({ players, initialSlug }: { players: LineupPlayer[]; initialSlug?: string }) {
  const start = Math.max(
    0,
    players.findIndex((p) => p.slug === initialSlug),
  );
  const [active, setActive] = useState(start);
  const hoverTimer = useRef<number | undefined>(undefined);
  const list = useRef<HTMLUListElement>(null);
  const current = players[active];
  if (!current) return null;

  const select = (i: number) => {
    setActive(i);
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const next =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? i + 1
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? i - 1
          : null;
    if (next === null) return;
    e.preventDefault();
    const n = (next + players.length) % players.length;
    select(n);
    (list.current?.children[n]?.querySelector("button") as HTMLButtonElement | null)?.focus();
  };

  // Seznam zarovnaný nahoru: pravý sloupec mění výšku podle délky jména a svislé centrování by seznam posouvalo pod myší
  return (
    <div className="lineup grid items-start gap-y-10 md:grid-cols-12 md:gap-x-8">
      <div
        className="order-2 md:order-1 md:col-span-5 md:pt-[4vh]"
        data-reveal
        style={{ "--i": 1 } as React.CSSProperties}
      >
        <ul ref={list} className="lineup-names" aria-label="Hráči – vyberte lahev">
          {players.map((p, i) => (
            <li key={p.slug}>
              <button
                type="button"
                aria-pressed={i === active}
                tabIndex={i === active ? 0 : -1}
                onClick={() => select(i)}
                onKeyDown={(e) => onKey(e, i)}
                onPointerEnter={(e) => {
                  if (e.pointerType !== "mouse") return;
                  window.clearTimeout(hoverTimer.current);
                  hoverTimer.current = window.setTimeout(() => setActive(i), 90);
                }}
                onPointerLeave={() => window.clearTimeout(hoverTimer.current)}
                className="lineup-name"
              >
                {/* posun vybraného jména jen uvnitř tlačítka – plocha pro myš zůstává na místě */}
                <span className="lineup-name__inner">
                  <span className="lineup-num tabular">{p.number}</span>
                  {/* na telefonu jen příjmení, jako na soupisce */}
                  <span className="md:hidden">{p.name.split(" ").slice(-1)[0]}</span>
                  <span className="hidden md:inline">{p.name}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <Link href="/eshop#lahve" className="btn btn-quiet mt-8 md:mt-10">
          Všech 13 lahví v e-shopu
        </Link>
      </div>

      <div className="order-1 md:order-2 md:col-span-7">
        <div className="lineup-stage" data-reveal style={{ "--i": 2 } as React.CSSProperties}>
          <Seal filled decorative id="lineup-seal" className="lineup-disc" />
          {players.map((p, i) => (
            <Image
              key={p.slug}
              src={p.imageUrl}
              alt={i === active ? `Etiketa lahve – ${p.name}` : ""}
              aria-hidden={i !== active}
              width={352}
              height={600}
              sizes="(min-width: 768px) 22vw, 46vw"
              loading={Math.abs(i - active) <= 2 ? "eager" : "lazy"}
              fetchPriority={i === active ? "high" : undefined}
              className="lineup-label label-paper"
              data-active={i === active}
            />
          ))}
        </div>
        {/* jméno vlevo, tlačítko s cenou vpravo a svisle uprostřed bloku – u nejdelšího jména zůstává na stejném místě */}
        <div
          className="mt-8 grid items-center gap-x-8 gap-y-5 md:mt-10 md:grid-cols-[minmax(0,1fr)_auto]"
          aria-live="polite"
        >
          <p className="min-w-0">
            <span className="display block text-[clamp(2.25rem,1rem+2.6vw,3.75rem)] text-gold md:whitespace-nowrap">
              {current.number}&nbsp;{current.name}
            </span>
            <span className="mt-1 block text-muted">Lahev slivovice 50&nbsp;% s portrétem</span>
          </p>
          <Link href={`/produkt/${current.slug}`} className="btn w-full md:w-auto md:justify-self-end">
            Koupit lahev
            <span aria-hidden="true" className="opacity-60">
              ·
            </span>
            <span className="tabular">{formatCzk(current.priceCzk)}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
