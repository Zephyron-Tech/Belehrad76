"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Tenký zlatý proužek nahoře při přechodu na jinou stránku: ukáže se až když načítání trvá déle než chvilku
 * (rychlé přechody neblikají) a zmizí, jakmile je nová stránka vykreslená. Stažení souborů ho nespouští.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => setActive(false), [pathname]);

  useEffect(() => {
    let show: ReturnType<typeof setTimeout> | undefined;
    let guard: ReturnType<typeof setTimeout> | undefined;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !a.href || a.hasAttribute("download") || (a.target && a.target !== "_self")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      // soubory ke stažení: stránka se nemění
      if (/^\/admin\/(export|zasilkovna)\//.test(url.pathname)) return;
      clearTimeout(show);
      clearTimeout(guard);
      show = setTimeout(() => setActive(true), 150);
      guard = setTimeout(() => setActive(false), 15_000); // pojistka
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      clearTimeout(show);
      clearTimeout(guard);
    };
  }, []);

  if (!active) return null;
  return (
    <div role="progressbar" aria-label="Načítám stránku" className="pointer-events-none fixed inset-x-0 top-0 z-[300] h-[3px] overflow-hidden bg-gold/15">
      <div className="nav-progress h-full w-1/3 bg-gold" />
    </div>
  );
}
