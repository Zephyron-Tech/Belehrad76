import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getSettings } from "@/lib/settings";
import { env } from "@/lib/env";
import { CartProvider } from "@/components/cart/CartProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AgeGate } from "@/components/AgeGate";
import { AGE_COOKIE } from "@/lib/consent";
import { CookieConsent } from "@/components/CookieConsent";
import { ToastProvider } from "@/components/Toast";
import { RevealObserver } from "@/components/RevealObserver";

// Sklad, ceny a texty se čtou z databáze při každém požadavku
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const description = settings.str("seo.description");
  return {
    description,
    openGraph: {
      type: "website",
      locale: "cs_CZ",
      siteName: "Mistři Evropy – Bělehrad 1976",
      title: "Mistři Evropy – Bělehrad 1976",
      description,
      url: "/",
    },
    twitter: { card: "summary_large_image", title: "Mistři Evropy – Bělehrad 1976", description },
  };
}

export default async function WebLayout({ children }: { children: React.ReactNode }) {
  const [settings, jar] = await Promise.all([getSettings(), cookies()]);
  const ageVerified = jar.get(AGE_COOKIE)?.value === "1";

  return (
    <CartProvider>
      <ToastProvider>
      <a href="#obsah" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[200] focus:bg-gold focus:px-4 focus:py-3 focus:text-ink">
        Přeskočit na obsah
      </a>
      <SiteHeader salesOpen={settings.bool("sales.open")} />
      <main id="obsah">{children}</main>
      <SiteFooter settings={settings} />
      <AgeGate verified={ageVerified} />
      <RevealObserver />
      <CookieConsent ga4Id={env.ga4Id || undefined} metaPixelId={env.metaPixelId || undefined} />
      </ToastProvider>
    </CartProvider>
  );
}
