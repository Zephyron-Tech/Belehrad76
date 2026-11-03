import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { SocialLinks } from "@/components/SocialLinks";

export const metadata: Metadata = { title: "Kontakt" };

export default async function ContactPage() {
  const settings = await getSettings();
  const email = settings.str("contact.email");
  const phone = settings.str("contact.phone");

  return (
    <div className="frame py-14 md:py-24">
      <h1 className="display text-head">Kontakt</h1>

      <div className="mt-12 grid gap-y-14 md:mt-16 md:grid-cols-12 md:gap-x-10">
        <section className="md:col-span-7" aria-labelledby="dotazy">
          <h2 id="dotazy" className="text-lead font-semibold">
            Dotazy k objednávkám
          </h2>
          <p className="mt-4">
            <a href={`mailto:${email}`} className="display link text-[clamp(2rem,1.2rem+3vw,3.5rem)] text-gold-light">
              {email}
            </a>
          </p>
          {phone && (
            <p className="mt-3">
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="link text-lead">
                {phone}
              </a>
            </p>
          )}
          <SocialLinks settings={settings} className="mt-8" />
        </section>

        <div className="space-y-12 md:col-span-5">
          <section aria-labelledby="prevzeti" className="bg-panel p-6 md:p-8">
            <h2 id="prevzeti" className="display text-[2rem]">
              Osobní převzetí
            </h2>
            <p className="mt-4">{settings.str("pickup.address")}</p>
            <p className="mt-3 text-muted">{settings.text("pickup.note")}</p>
            {settings.str("facr.url") && (
              <a href={settings.str("facr.url")} target="_blank" rel="noopener noreferrer" className="link mt-5 inline-block text-gold-light">
                Fotbalová asociace České republiky
              </a>
            )}
          </section>

          <section aria-labelledby="prodavajici">
            <h2 id="prodavajici" className="display text-[2rem]">
              Prodávající
            </h2>
            <p className="mt-4">
              {settings.str("seller.name")}, {settings.str("seller.address")}
              <br />
              IČO {settings.str("seller.ico")}, DIČ {settings.str("seller.dic")}
            </p>
            <p className="mt-3 text-muted">{settings.str("seller.register")}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
