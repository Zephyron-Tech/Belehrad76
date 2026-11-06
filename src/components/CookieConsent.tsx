"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_COOKIE, currentConsent, serializeConsent, writeCookie, type Consent } from "@/lib/consent";

export const OPEN_COOKIE_SETTINGS_EVENT = "open-cookie-settings";

/**
 * Lišta souhlasu s cookies. Google Analytics a Meta Pixel se načtou až po souhlasu.
 */
export function CookieConsent({ ga4Id, metaPixelId }: { ga4Id?: string; metaPixelId?: string }) {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // Lišta se ukáže až po rolování za úvodní sekci (jinde po kousku rolování), ať nezakrývá první dojem
  const [armed, setArmed] = useState(false);
  const pathname = usePathname();
  const [draft, setDraft] = useState<Consent>({ analytics: false, marketing: false });

  useEffect(() => {
    const c = currentConsent();
    setConsent(c);
    setShowBanner(!c);
    setLoaded(true);
    const open = () => {
      setDraft(currentConsent() ?? { analytics: false, marketing: false });
      setShowSettings(true);
      setShowBanner(true);
      setArmed(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, []);

  useEffect(() => {
    setArmed(false);
  }, [pathname]);

  useEffect(() => {
    if (!showBanner || armed) return;
    const check = () => {
      const hero = document.querySelector("[data-hero]");
      const past = hero ? hero.getBoundingClientRect().bottom <= 120 : window.scrollY > 240;
      if (past) setArmed(true);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    // stránky bez úvodní sekce a bez rolování (krátký obsah): lišta se ukáže po chvíli
    const timer = document.querySelector("[data-hero]") ? undefined : window.setTimeout(() => setArmed(true), 10_000);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      window.clearTimeout(timer);
    };
  }, [showBanner, armed, pathname]);

  const save = (c: Consent) => {
    const hadTracking = consent && (consent.analytics || consent.marketing);
    writeCookie(CONSENT_COOKIE, serializeConsent(c), 180);
    setConsent(c);
    // lišta sjede dolů a až pak se odstraní
    setLeaving(true);
    window.setTimeout(() => {
      setShowBanner(false);
      setShowSettings(false);
      setLeaving(false);
    }, 260);
    // Odvolání souhlasu: už načtené skripty odstraní až obnovení stránky
    if (hadTracking && (!c.analytics || !c.marketing)) window.location.reload();
  };

  return (
    <>
      {loaded && consent?.analytics && ga4Id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(ga4Id)},{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {loaded && consent?.marketing && metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(metaPixelId)});fbq('track','PageView');`}
        </Script>
      )}

      {showBanner && armed && (
        <div
          data-leaving={leaving}
          className="cookie-bar fixed inset-x-0 bottom-0 z-[90] bg-panel-2 pb-[env(safe-area-inset-bottom)]" role="region" aria-label="Souhlas s cookies">
          <div className="frame flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between md:gap-10 md:py-5">
            <p className="max-w-[72ch] text-small leading-normal text-cream md:text-[1rem]">
              Nezbytné cookies drží košík a ověření věku. Analytické (Google Analytics) a marketingové (Meta Pixel) zapneme jen
              s vaším souhlasem.{" "}
              <Link href="/cookies" className="link text-gold-light">
                Více o cookies
              </Link>
            </p>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {!showSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setDraft(consent ?? { analytics: false, marketing: false });
                    setShowSettings(true);
                  }}
                  className="link order-last min-h-11 basis-full px-1 text-left text-[1rem] text-cream md:order-first md:mr-2 md:basis-auto"
                >
                  Nastavení
                </button>
              )}
              <button type="button" onClick={() => save({ analytics: false, marketing: false })} className="btn btn-ink min-h-11 flex-1 whitespace-nowrap px-4 text-[1rem] md:flex-none">
                Jen nezbytné
              </button>
              <button type="button" onClick={() => save({ analytics: true, marketing: true })} className="btn min-h-11 flex-1 whitespace-nowrap px-4 text-[1rem] md:flex-none">
                Přijmout vše
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="appear frame pb-5">
              <fieldset className="grid gap-2 sm:grid-cols-3">
                <legend className="sr-only">Nastavení cookies</legend>
                <label className="flex items-start gap-3 bg-panel p-3 text-small text-muted">
                  <input type="checkbox" checked disabled className="mt-1 size-4 accent-[var(--gold)]" />
                  <span>
                    <strong className="text-cream">Nezbytné</strong> – věk 18+, košík, volba cookies
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 bg-panel p-3 text-small text-muted">
                  <input
                    type="checkbox"
                    checked={draft.analytics}
                    onChange={(e) => setDraft({ ...draft, analytics: e.target.checked })}
                    className="mt-1 size-4 accent-[var(--gold)]"
                  />
                  <span>
                    <strong className="text-cream">Analytické</strong> – Google Analytics
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 bg-panel p-3 text-small text-muted">
                  <input
                    type="checkbox"
                    checked={draft.marketing}
                    onChange={(e) => setDraft({ ...draft, marketing: e.target.checked })}
                    className="mt-1 size-4 accent-[var(--gold)]"
                  />
                  <span>
                    <strong className="text-cream">Marketingové</strong> – Meta Pixel (Facebook, Instagram)
                  </span>
                </label>
              </fieldset>
              <button type="button" onClick={() => save(draft)} className="btn mt-3 min-h-11 px-5 text-[1rem]">
                Uložit výběr
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function CookieSettingsLink({ className = "" }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}>
      Nastavení cookies
    </button>
  );
}
