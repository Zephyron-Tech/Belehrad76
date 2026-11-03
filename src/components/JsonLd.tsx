import type { Product } from "@prisma/client";

/** Strukturovaná data pro vyhledávače (schema.org). `<` se escapuje, aby text z DB nemohl ukončit skript. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

const base = () => (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");

/** Produkt s nabídkou: cena v Kč a dostupnost podle skladu (NULL = vyrábí se na objednávku, vždy dostupné). */
export function productJsonLd(p: Product, sellerName: string) {
  const url = p.type === "BOX" ? `${base()}/eshop` : `${base()}/produkt/${p.slug}`;
  const available = p.stock === null || p.stock > 0;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.shortDescription,
    image: [`${base()}${p.imageUrl}`],
    sku: p.slug,
    brand: { "@type": "Brand", name: "Mistři Evropy – Bělehrad 1976" },
    offers: {
      "@type": "Offer",
      url,
      price: p.priceCzk,
      priceCurrency: "CZK",
      availability: available ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      seller: { "@type": "Organization", name: sellerName },
    },
  };
}

export function organizationJsonLd(sellerName: string, email: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: sellerName,
    url: base(),
    email,
  };
}
