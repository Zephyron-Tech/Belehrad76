import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { expireStaleOrders, retryPaidNotifications } from "@/lib/orders/expire";

/**
 * Zrušení nezaplacených objednávek po vypršení rezervace a dorovnání neodeslaných e-mailů po zaplacení.
 * Volat pravidelně (např. každých 5 minut) s hlavičkou: Authorization: Bearer <CRON_SECRET>
 */
async function handle(req: Request) {
  const expected = env.cronSecret;
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const ok =
    expected.length > 0 &&
    given.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return new NextResponse("Unauthorized", { status: 401 });

  const cancelled = await expireStaleOrders();
  const notified = await retryPaidNotifications();
  return NextResponse.json({ cancelled, notified });
}

export const GET = handle;
export const POST = handle;
