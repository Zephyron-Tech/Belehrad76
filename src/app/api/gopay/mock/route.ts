import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { syncGopayPayment, orderUrl } from "@/lib/orders/payments";

/** Jen pro vývoj (GOPAY_MODE=mock): simulace výsledku platby na testovací bráně. */
export async function POST(req: Request) {
  if (env.gopayMode !== "mock") return new NextResponse("Not found", { status: 404 });

  const form = await req.formData();
  const id = String(form.get("id") ?? "");
  const result = String(form.get("result") ?? "");
  if (!["PAID", "CANCELED"].includes(result)) return new NextResponse("bad request", { status: 400 });

  const payment = await prisma.payment.findUnique({ where: { gopayId: id }, include: { order: true } });
  if (!payment) return new NextResponse("Not found", { status: 404 });

  await prisma.payment.update({ where: { id: payment.id }, data: { state: result } });
  // Notifikace jako od GoPay
  await syncGopayPayment(id);

  return NextResponse.redirect(`${orderUrl(payment.order.publicToken)}?platba=navrat&id=${encodeURIComponent(id)}`, 303);
}
