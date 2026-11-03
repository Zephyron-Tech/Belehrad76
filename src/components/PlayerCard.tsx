import Image from "next/image";
import Link from "next/link";
import type { Product } from "@prisma/client";
import { formatCzk } from "@/lib/format";

/**
 * Řádek kusovky v e-shopu: výřez etikety místo odrážky, jméno s číslem dresu, cena.
 * `children` je ovládání košíku (vykreslí ho e-shop, jen když běží prodej).
 */
export function PlayerCard({ product, children }: { product: Product; children?: React.ReactNode }) {
  const name = product.playerName ?? product.name;
  return (
    <div className="player-row group">
      <Link href={`/produkt/${product.slug}`} className="player-row__link">
        <span className="player-row__thumb label-paper">
          <Image
            src={product.imageUrl}
            alt={`Etiketa lahve – ${name}`}
            width={352}
            height={600}
            sizes="96px"
            className="h-full w-full object-cover"
          />
        </span>
        <span className="min-w-0">
          <span className="display block text-[1.375rem] leading-[1.05] sm:text-[1.75rem]">
            <span className="tabular text-gold">{product.playerNumber}</span> {name}
          </span>
          <span className="mt-2 hidden text-muted sm:block">Slivovice 50 % s jeho portrétem na etiketě</span>
        </span>
      </Link>
      <div className="player-row__buy">
        <p className="tabular font-semibold">{formatCzk(product.priceCzk)}</p>
        {children}
      </div>
    </div>
  );
}
