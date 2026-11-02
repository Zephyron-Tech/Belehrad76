import { plural } from "@/lib/format";

export function StockBadge({ stock }: { stock: number | null }) {
  if (stock === null) return null;
  if (stock <= 0) {
    return <p className="text-xl font-semibold text-seal sm:text-2xl">Vyprodáno</p>;
  }
  return (
    <p className="text-xl font-semibold text-gold sm:text-2xl">
      Už {plural(stock, "zbývá jen", "zbývají jen", "zbývá jen")} {stock} {plural(stock, "box", "boxy", "boxů")}
    </p>
  );
}
