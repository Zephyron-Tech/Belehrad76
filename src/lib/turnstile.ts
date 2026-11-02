import { env } from "./env";

/** Ověření Cloudflare Turnstile. Bez nastaveného klíče se ochrana nepoužívá. */
export async function verifyTurnstile(token: string | undefined | null, ip: string | null): Promise<boolean> {
  if (!env.turnstileSecretKey) return true;
  if (!token) return false;
  const body = new URLSearchParams({ secret: env.turnstileSecretKey, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      cache: "no-store",
    });
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch (err) {
    console.error("[turnstile] verify failed", err);
    return false;
  }
}
