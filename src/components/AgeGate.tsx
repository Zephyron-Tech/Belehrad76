"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AGE_COOKIE, AGE_COOKIE_MAX_AGE_S, readCookie, writeCookieSeconds } from "@/lib/consent";
import { Seal } from "./Seal";

/** Stránky s prodejem alkoholu. Úvod a informační stránky jsou bez brány. */
const SHOP_PATHS = ["/eshop", "/produkt", "/kosik", "/pokladna"];

export function isShopPath(pathname: string) {
  return SHOP_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Věková brána 18+ při vstupu do e-shopu (ne na úvodní stránce).
 * Potvrzení se ukládá do cookie s krátkou platností (5 minut). Po vypršení se brána
 * při dalším vstupu na stránku e-shopu ukáže znovu – i při proklikávání bez obnovení.
 */
export function AgeGate({ verified }: { verified: boolean }) {
  const pathname = usePathname();
  const [confirmed, setConfirmed] = useState(verified);
  const [deniedOn, setDeniedOn] = useState<string | null>(null);

  // Při každé změně stránky ověřit, že potvrzení ještě platí
  useEffect(() => {
    if (readCookie(AGE_COOKIE) !== "1") setConfirmed(false);
  }, [pathname]);

  // Stránka pod bránou se neposouvá
  const visible = !confirmed && isShopPath(pathname);
  useEffect(() => {
    if (!visible) return;
    const html = document.documentElement;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = "";
    };
  }, [visible]);

  // Po potvrzení brána krátce zprůhlední a až pak se odstraní (dřív zmizela z jednoho snímku na druhý)
  const [mounted, setMounted] = useState(visible);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (visible) {
      setMounted(true);
      setLeaving(false);
      return;
    }
    if (!mounted) return;
    setLeaving(true);
    const t = window.setTimeout(() => {
      setMounted(false);
      setLeaving(false);
    }, 280);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!mounted) return null;
  const denied = deniedOn === pathname;

  // Fokus zůstává v dialogu (Tab i Shift+Tab kolují mezi jeho prvky)
  const trapFocus = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>("button, a[href]")];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      data-leaving={leaving}
      className="age-gate fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden overscroll-contain bg-ink"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-title"
      aria-describedby="age-desc"
      onKeyDown={trapFocus}
    >
      <Seal filled decorative id="age-seal" className="age-gate__seal pointer-events-none absolute" />
      <div className="frame relative flex min-h-full flex-col justify-center py-16">
        <div className="age-gate__body max-w-2xl">
          <h2 id="age-title" className="display text-head">
            Je vám více než 18 let?
          </h2>
          {denied ? (
            <>
              <p id="age-desc" className="mt-6 max-w-[44ch] text-lead">
                E-shop je určen pouze osobám starším 18 let. Prodej alkoholu osobám mladším 18 let je zakázán.
              </p>
              <Link href="/" className="btn btn-quiet mt-10">
                Zpět na úvodní stránku
              </Link>
            </>
          ) : (
            <>
              <p id="age-desc" className="mt-6 max-w-[44ch] text-lead">
                Chystáte se vstoupit na stránky s prodejem alkoholu. Vstup je povolen pouze osobám starším 18 let.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  autoFocus
                  onClick={() => {
                    writeCookieSeconds(AGE_COOKIE, "1", AGE_COOKIE_MAX_AGE_S);
                    setConfirmed(true);
                  }}
                  className="btn sm:min-w-56"
                >
                  Ano, je mi 18+
                </button>
                <button type="button" onClick={() => setDeniedOn(pathname)} className="btn btn-quiet sm:min-w-32">
                  Ne
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
