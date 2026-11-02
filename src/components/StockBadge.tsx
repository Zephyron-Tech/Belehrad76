import { plural } from "@/lib/format";

export function StockBadge({ stock }: { stock: number | null }) {
  if (stock === null) return null;
  if (stock <= 0) {
    return <span className="inline-block border border-seal px-3 py-1 text-sm font-semibold text-seal">Vyprodáno</span>;
  }
  return (
    <span className="inline-block border border-gold/60 px-3 py-1 text-sm font-semibold text-gold-light">
      Zbývá {stock} {plural(stock, "box", "boxy", "boxů")}
    </span>
  );
}
