"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useState } from "react";
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
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, []);

  const save = (c: Consent) => {
    const hadTracking = consent && (consent.analytics || consent.marketing);
    writeCookie(CONSENT_COOKIE, serializeConsent(c), 180);
    setConsent(c);
    setShowBanner(false);
    setShowSettings(false);
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

      {showBanner && (
        <div
          className="fixed inset-x-0 bottom-0 z-[90] border-t border-gold/40 bg-panel/98 p-4 shadow-2xl backdrop-blur sm:p-6"
          role="region"
          aria-label="Souhlas s cookies"
        >
          <div className="mx-auto max-w-5xl">
            <p className="text-sm text-cream">
              Používáme nezbytné cookies pro fungování webu a košíku. S vaším souhlasem také analytické cookies (Google
              Analytics) a marketingové cookies (Meta Pixel) pro měření návštěvnosti a reklamy.{" "}
              <Link href="/cookies" className="text-gold-light underline underline-offset-4">
                Více o cookies
              </Link>
            </p>

            {showSettings && (
              <fieldset className="mt-4 grid gap-3 sm:grid-cols-3">
                <legend className="sr-only">Nastavení cookies</legend>
                <label className="flex items-start gap-2 border border-line p-3 text-sm text-muted">
                  <input type="checkbox" checked disabled className="mt-1 accent-[var(--gold)]" />
                  <span>
                    <strong className="text-cream">Nezbytné</strong> – věk 18+, košík, volba cookies
                  </span>
                </label>
                <label className="flex items-start gap-2 border border-line p-3 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={draft.analytics}
                    onChange={(e) => setDraft({ ...draft, analytics: e.target.checked })}
                    className="mt-1 accent-[var(--gold)]"
                  />
                  <span>
                    <strong className="text-cream">Analytické</strong> – Google Analytics
                  </span>
                </label>
                <label className="flex items-start gap-2 border border-line p-3 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={draft.marketing}
                    onChange={(e) => setDraft({ ...draft, marketing: e.target.checked })}
                    className="mt-1 accent-[var(--gold)]"
                  />
                  <span>
                    <strong className="text-cream">Marketingové</strong> – Meta Pixel (Facebook, Instagram)
                  </span>
                </label>
              </fieldset>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              {showSettings ? (
                <button
                  type="button"
                  onClick={() => save(draft)}
                  className="border border-gold px-4 py-2 text-sm font-semibold text-gold-light hover:bg-gold hover:text-ink"
                >
                  Uložit výběr
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDraft(consent ?? { analytics: false, marketing: false });
                    setShowSettings(true);
                  }}
                  className="border border-line px-4 py-2 text-sm text-cream hover:border-gold"
                >
                  Nastavení
                </button>
              )}
              <button
                type="button"
                onClick={() => save({ analytics: false, marketing: false })}
                className="border border-line px-4 py-2 text-sm text-cream hover:border-gold"
              >
                Jen nezbytné
              </button>
              <button
                type="button"
                onClick={() => save({ analytics: true, marketing: true })}
                className="bg-gold px-4 py-2 text-sm font-bold text-ink hover:bg-gold-light"
              >
                Přijmout vše
              </button>
            </div>
          </div>
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
