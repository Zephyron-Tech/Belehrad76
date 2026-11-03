/** Souhlas s cookies – sdíleno klientem (banner, pokladna). */
export const CONSENT_COOKIE = "cookie_consent";

export type Consent = { analytics: boolean; marketing: boolean };

export function parseConsent(value: string | undefined | null): Consent | null {
  if (!value) return null;
  const m = value.match(/^v1:a([01]):m([01])$/);
  if (!m) return null;
  return { analytics: m[1] === "1", marketing: m[2] === "1" };
}

export function serializeConsent(c: Consent) {
  return `v1:a${c.analytics ? 1 : 0}:m${c.marketing ? 1 : 0}`;
}

export function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

export function writeCookie(name: string, value: string, days: number) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${days * 86400}; Path=/; SameSite=Lax${secure}`;
}

export function currentConsent(): Consent | null {
  return parseConsent(readCookie(CONSENT_COOKIE));
}
