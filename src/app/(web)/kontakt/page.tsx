import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { SocialLinks } from "@/components/SocialLinks";

export const metadata: Metadata = { title: "Kontakt" };

export default async function ContactPage() {
  const settings = await getSettings();
  const email = settings.str("contact.email");
  const phone = settings.str("contact.phone");

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="font-serif text-4xl font-bold text-gold">Kontakt</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <section className="border border-line bg-panel p-6">
          <h2 className="font-serif text-xl font-bold text-cream">Dotazy k objednávkám</h2>
          <p className="mt-3">
            <a href={`mailto:${email}`} className="text-gold-light underline underline-offset-4">
              {email}
            </a>
          </p>
          {phone && (
            <p className="mt-1">
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-cream hover:text-gold-light">
                {phone}
              </a>
            </p>
          )}
          <SocialLinks settings={settings} className="mt-6" />
        </section>

        <section className="border border-line bg-panel p-6">
          <h2 className="font-serif text-xl font-bold text-cream">Osobní převzetí</h2>
          <p className="mt-3 text-cream/90">{settings.str("pickup.address")}</p>
          <p className="mt-2 text-sm text-muted">{settings.text("pickup.note")}</p>
          {settings.str("facr.url") && (
            <a
              href={settings.str("facr.url")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm text-gold-light underline underline-offset-4"
            >
              Fotbalová asociace České republiky
            </a>
          )}
        </section>

        <section className="border border-line bg-panel p-6 md:col-span-2">
          <h2 className="font-serif text-xl font-bold text-cream">Prodávající</h2>
          <p className="mt-3 text-cream/90">
            {settings.str("seller.name")}, {settings.str("seller.address")}
            <br />
            IČO {settings.str("seller.ico")}, DIČ {settings.str("seller.dic")}
            <br />
            <span className="text-sm text-muted">{settings.str("seller.register")}</span>
          </p>
        </section>
      </div>
    </div>
  );
}
