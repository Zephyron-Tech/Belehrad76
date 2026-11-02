import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { formatCzk } from "@/lib/format";

export const metadata = { title: "Testovací platební brána", robots: { index: false } };

/** Simulace platební brány pro vývoj (GOPAY_MODE=mock). V sandboxu a produkci neexistuje. */
export default async function MockGatewayPage({ params }: { params: Promise<{ id: string }> }) {
  if (env.gopayMode !== "mock") notFound();
  const { id } = await params;
  const payment = await prisma.payment.findUnique({ where: { gopayId: id }, include: { order: true } });
  if (!payment) notFound();

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="border-2 border-dashed border-warn p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-warn">Testovací brána – žádné skutečné peníze</p>
        <h1 className="mt-3 font-serif text-2xl font-bold text-cream">Platba objednávky {payment.order.number}</h1>
        <p className="mt-2 text-3xl font-bold text-gold-light">{formatCzk(payment.amountCzk)}</p>
        <p className="mt-1 text-sm text-muted">Stav platby: {payment.state}</p>
        <form action="/api/gopay/mock" method="post" className="mt-6 flex flex-col gap-3">
          <input type="hidden" name="id" value={id} />
          <button name="result" value="PAID" className="bg-ok px-4 py-3 font-bold text-ink">
            Simulovat úspěšnou platbu
          </button>
          <button name="result" value="CANCELED" className="border border-line px-4 py-3 text-cream">
            Simulovat zrušení platby
          </button>
        </form>
      </div>
    </div>
  );
}
