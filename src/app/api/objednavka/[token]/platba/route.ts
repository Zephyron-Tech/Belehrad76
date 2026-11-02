import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startGopayPayment } from "@/lib/orders/payments";
import { ipFromHeaders } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";

/** Nový pokus o platbu přes GoPay pro nezaplacenou objednávku. */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const ip = ipFromHeaders(req.headers);
  if (!rateLimit(`pay:${ip ?? "unknown"}`, 20, 10 * 60_000).ok) {
    return NextResponse.json({ error: "Příliš mnoho pokusů. Zkuste to prosím za chvíli." }, { status: 429 });
  }
  const { token } = await params;
  const order = await prisma.order.findUnique({ where: { publicToken: token }, select: { id: true } });
  if (!order) return NextResponse.json({ error: "Objednávka nenalezena." }, { status: 404 });

  try {
    const redirectUrl = await startGopayPayment(order.id);
    return NextResponse.json({ redirectUrl });
  } catch (err) {
    console.error("[gopay] retry failed", err);
    const message = err instanceof Error && !("status" in err) ? err.message : "Platební bránu se nepodařilo otevřít.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
