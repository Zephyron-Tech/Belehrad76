import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { ordersCsv } from "@/lib/exports";
import { audit } from "@/lib/audit";
import { ipFromHeaders } from "@/lib/request";

function parseDate(value: string | null, endOfDay = false): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}+01:00`);
}

export async function GET(req: Request) {
  if (!(await getAdminSession())) return new NextResponse("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const from = parseDate(url.searchParams.get("od"));
  const to = parseDate(url.searchParams.get("do"), true);
  const onlyPaid = url.searchParams.get("zaplacene") === "1";

  const { csv, count } = await ordersCsv({ from, to, onlyPaid });
  await audit(
    { action: "export_orders", detail: `${count} objednávek${onlyPaid ? ", jen zaplacené" : ""}` },
    { source: "admin", ip: ipFromHeaders(req.headers) },
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="objednavky-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
