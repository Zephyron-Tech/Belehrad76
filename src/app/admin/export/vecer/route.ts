import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { eveningCsv } from "@/lib/exports";
import { audit } from "@/lib/audit";
import { ipFromHeaders } from "@/lib/request";

export async function GET(req: Request) {
  if (!(await getAdminSession())) return new NextResponse("Unauthorized", { status: 401 });

  const { csv, count } = await eveningCsv();
  await audit({ action: "export_evening", detail: `${count} zájemců` }, { source: "admin", ip: ipFromHeaders(req.headers) });

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zajemci-vecer-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
