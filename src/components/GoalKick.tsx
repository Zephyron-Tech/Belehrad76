"use client";

import { useEffect, useRef, useState } from "react";
import { CART_ADDED_EVENT, type CartAddedDetail } from "./cart/AddToCart";

/** Délka animace v ms (musí sedět s .goal-kick v globals.css) */
const DURATION_MS = 1900;

/**
 * Panáček s míčem a branka z čar nad nadpisem boxu.
 * V klidu stojí; po přidání boxu do košíku se rozběhne a vstřelí gól.
 */
export function GoalKick({ slug }: { slug: string }) {
  const [run, setRun] = useState(0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onAdded = (e: Event) => {
      if ((e as CustomEvent<CartAddedDetail>).detail?.slug !== slug) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      window.clearTimeout(timer.current);
      setRun((r) => r + 1);
      timer.current = window.setTimeout(() => setRun(0), DURATION_MS);
    };
    window.addEventListener(CART_ADDED_EVENT, onAdded);
    return () => {
      window.removeEventListener(CART_ADDED_EVENT, onAdded);
      window.clearTimeout(timer.current);
    };
  }, [slug]);

  return (
    <svg
      key={run}
      viewBox="0 0 320 60"
      aria-hidden="true"
      className={`goal-kick block h-auto w-full text-gold ${run ? "is-playing" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* trávník */}
      <line x1="2" y1="56" x2="318" y2="56" strokeWidth={1} stroke="var(--line)" />

      {/* panáček */}
      <g className="gk-runner">
        <circle cx="14" cy="21" r="4.5" />
        <line x1="14" y1="26" x2="14" y2="40" />
        <line className="gk-arm-a" x1="14" y1="30" x2="8" y2="37" />
        <line className="gk-arm-b" x1="14" y1="30" x2="20" y2="37" />
        <line className="gk-leg-a" x1="14" y1="40" x2="10" y2="55" />
        <line className="gk-leg-b" x1="14" y1="40" x2="18" y2="55" />
      </g>

      {/* míč */}
      <circle className="gk-ball" cx="56" cy="52" r="3.5" fill="var(--cream)" stroke="none" />

      {/* branka: tyč, břevno, zadní strana a síť */}
      <g className="gk-goal">
        <polyline points="292,56 292,24 314,24 318,56" />
        <g strokeWidth={0.75} stroke="var(--gold-light)" opacity={0.6}>
          <line x1="297" y1="24" x2="300" y2="56" />
          <line x1="303" y1="24" x2="306" y2="56" />
          <line x1="309" y1="24" x2="312" y2="56" />
          <line x1="292" y1="34" x2="315.5" y2="34" />
          <line x1="292" y1="45" x2="317" y2="45" />
        </g>
      </g>

      <text className="gk-text" x="303" y="16" textAnchor="middle" fill="var(--gold-light)" stroke="none" fontSize="11" fontWeight="700">
        GÓL!
      </text>
    </svg>
  );
}
