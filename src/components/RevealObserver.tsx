"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SELECTOR = "[data-reveal]:not(.is-in), [data-shutter]:not(.is-in)";

/**
 * Vstup částí sekcí při rolování (jednou, bez opakování). Skrytý výchozí stav je v CSS jen pod html.js,
 * takže bez skriptu je všechno vidět. Prvky přidané později (klientské komponenty) zachytí MutationObserver.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    // Obrázek se závěrkou je oříznutý clip-path, a ten prohlížeč počítá do průniku –
    // proto se u něj sleduje rodič a třída se přidá obrázku.
    const targets = new Map<Element, Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (targets.get(e.target) ?? e.target).classList.add("is-in");
          targets.delete(e.target);
          io.unobserve(e.target);
        }
      },
      // kladný dolní okraj: animace se spustí o 10 % výšky okna dřív, než prvek vjede do záběru
      { rootMargin: "0px 0px 10% 0px", threshold: 0.05 },
    );
    const scan = () =>
      document.querySelectorAll(SELECTOR).forEach((el) => {
        const watch = el.hasAttribute("data-shutter") ? (el.parentElement ?? el) : el;
        if (targets.has(watch)) return;
        targets.set(watch, el);
        io.observe(watch);
      });
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
