import { plural } from "@/lib/format";

/** Zbývající boxy jako věta. Barva a velikost se dědí z rodiče (pole kapitoly). */
export function StockBadge({ stock, className = "" }: { stock: number | null; className?: string }) {
  if (stock === null) return null;
  if (stock <= 0) {
    return <p className={`font-semibold ${className}`}>Vyprodáno</p>;
  }
  return (
    <p className={`font-semibold ${className}`}>
      Už {plural(stock, "zbývá jen", "zbývají jen", "zbývá jen")} <span className="tabular">{stock}</span>{" "}
      {plural(stock, "box", "boxy", "boxů")}
    </p>
  );
}
