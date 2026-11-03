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
    <div className="frame max-w-xl py-16">
      <div className="bg-panel p-6 md:p-8">
        <p className="font-semibold text-warn">Testovací brána – žádné skutečné peníze</p>
        <h1 className="display mt-3 text-[2rem]">Platba objednávky {payment.order.number}</h1>
        <p className="display tabular mt-4 text-head text-gold-light">{formatCzk(payment.amountCzk)}</p>
        <p className="mt-1 text-muted">Stav platby: {payment.state}</p>
        <form action="/api/gopay/mock" method="post" className="mt-6 flex flex-col gap-3">
          <input type="hidden" name="id" value={id} />
          <button name="result" value="PAID" className="btn">
            Simulovat úspěšnou platbu
          </button>
          <button name="result" value="CANCELED" className="btn btn-quiet">
            Simulovat zrušení platby
          </button>
        </form>
      </div>
    </div>
  );
}
