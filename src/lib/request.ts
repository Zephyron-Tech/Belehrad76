import { headers } from "next/headers";

/** IP adresa klienta (za Traefikem z X-Forwarded-For). */
export function ipFromHeaders(h: Headers): string | null {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim() || null;
  return h.get("x-real-ip");
}

export async function getClientIp(): Promise<string | null> {
  return ipFromHeaders(await headers());
}
