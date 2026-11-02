import { NextResponse } from "next/server";
import { syncGopayPayment } from "@/lib/orders/payments";

/**
 * Notifikace GoPay o změně stavu platby (GET ?id=…).
 * Stav si vždy ověříme dotazem na GoPay API, obsahu notifikace nevěříme.
 */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id || !/^[A-Za-z0-9]{1,40}$/.test(id)) return new NextResponse("bad request", { status: 400 });
  try {
    await syncGopayPayment(id);
    return new NextResponse("ok");
  } catch (err) {
    console.error("[gopay] notification failed", id, err);
    // 500 → GoPay notifikaci zopakuje
    return new NextResponse("error", { status: 500 });
  }
}
