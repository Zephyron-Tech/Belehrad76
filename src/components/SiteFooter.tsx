import Link from "next/link";
import type { Settings } from "@/lib/settings";
import { PHOTO_CREDITS } from "@/config/credits";
import { CookieSettingsLink } from "./CookieConsent";
import { SocialLinks } from "./SocialLinks";

const LEGAL = [
  { href: "/obchodni-podminky", label: "Obchodní podmínky" },
  { href: "/ochrana-osobnich-udaju", label: "Ochrana osobních údajů" },
  { href: "/cookies", label: "Cookies" },
  { href: "/reklamacni-rad", label: "Reklamační řád" },
  { href: "/odstoupeni-od-smlouvy", label: "Odstoupení od smlouvy" },
];

/** Patička začíná jménem edice přes celou šířku, pod ním kontakty a právní odkazy. */
export function SiteFooter({ settings }: { settings: Settings }) {
  const email = settings.str("contact.email");
  const phone = settings.str("contact.phone");

  return (
    <footer className="field-panel overflow-clip pb-10 pt-16 md:pt-24">
      <div className="frame">
        <p className="display text-[11.4vw] leading-[0.86] text-gold sm:text-[11.6vw] 2xl:text-[10.6rem]" aria-hidden="true">
          Mistři Evropy 1976
        </p>

        <div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-12">
          <div className="md:col-span-5">
            <h2 className="text-lead font-semibold">Máte dotaz?</h2>
            <p className="mt-3">
              <a href={`mailto:${email}`} className="link text-lead text-gold-light">
                {email}
              </a>
            </p>
            {phone && (
              <p className="mt-2">
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="link text-lead">
                  {phone}
                </a>
              </p>
            )}
            <p className="mt-6 max-w-[38ch] text-muted">Výtěžek edice jde na podporu Nadace fotbalových internacionálů.</p>
            <SocialLinks settings={settings} className="mt-6" />
          </div>

          <div className="md:col-span-3 md:col-start-7">
            <h2 className="font-semibold">Prodávající</h2>
            <p className="mt-3 text-muted">
              {settings.str("seller.name")}
              <br />
              {settings.str("seller.address")}
              <br />
              IČO {settings.str("seller.ico")}, DIČ {settings.str("seller.dic")}
            </p>
          </div>

          <nav aria-label="Právní informace" className="md:col-span-3">
            <h2 className="font-semibold">Informace</h2>
            <ul className="mt-3 space-y-2">
              {LEGAL.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="link text-muted decoration-transparent hover:text-cream hover:decoration-current">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <CookieSettingsLink className="link cursor-pointer text-muted decoration-transparent hover:text-cream hover:decoration-current" />
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-16 grid gap-4 text-small text-muted md:grid-cols-12">
          <p className="md:col-span-5">
            <strong className="text-cream">18+</strong> Prodej alkoholu osobám mladším 18 let je zakázán. Pijte zodpovědně.
          </p>
          <p className="md:col-span-6 md:col-start-7">
            Fotografie Bělehradu a švestky: Wikimedia Commons –{" "}
            {PHOTO_CREDITS.map((c, i) => (
              <span key={c.src}>
                <a href={c.page} target="_blank" rel="noopener noreferrer" className="link decoration-transparent hover:decoration-current">
                  {c.title}
                </a>{" "}
                ({c.author},{" "}
                <a href={c.licenceUrl} target="_blank" rel="noopener noreferrer" className="link decoration-transparent hover:decoration-current">
                  {c.licence}
                </a>
                ){i < PHOTO_CREDITS.length - 1 ? ", " : "."}
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
