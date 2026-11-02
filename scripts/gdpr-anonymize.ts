/**
 * Anonymizuje osobní údaje dokončených a zrušených objednávek starších než zadaný počet měsíců.
 *
 *   npm run gdpr:anonymize -- --months 120            (náhled, nic nemění)
 *   npm run gdpr:anonymize -- --months 120 --apply    (provede)
 *
 * Dobu uchování určí účetní / právník (účetní a daňové lhůty).
 */
import { PrismaClient } from "@prisma/client";
import { anonymizeOrder } from "../src/lib/gdpr";

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const months = Number(arg("months"));
  if (!Number.isInteger(months) || months < 1) {
    console.error("Použití: npm run gdpr:anonymize -- --months <počet> [--apply]");
    process.exit(1);
  }
  const apply = process.argv.includes("--apply");
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const orders = await prisma.order.findMany({
    where: { anonymizedAt: null, status: { in: ["COMPLETED", "CANCELLED"] }, createdAt: { lt: cutoff } },
    select: { id: true, number: true },
  });
  console.log(`Objednávek k anonymizaci (vytvořené před ${cutoff.toISOString().slice(0, 10)}): ${orders.length}`);
  if (!apply) {
    console.log("Náhled – nic nebylo změněno. Pro provedení přidejte --apply.");
    return;
  }
  for (const o of orders) {
    await anonymizeOrder(o.id, { source: "system", actor: "gdpr-skript" });
  }
  console.log(`Hotovo: anonymizováno ${orders.length} objednávek.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
