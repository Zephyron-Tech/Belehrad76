/**
 * Klient GoPay REST API.
 * Dokumentace: https://doc.gopay.com
 *
 * Režimy (GOPAY_MODE):
 *  - mock:       simulace brány pro lokální vývoj, platba se „zaplatí“ na stránce /platba-test/{id}
 *  - sandbox:    testovací prostředí GoPay (gw.sandbox.gopay.com)
 *  - production: ostrá brána (gate.gopay.cz)
 */
import crypto from "node:crypto";
import { env } from "./env";
import { prisma } from "./db";

export type GopayState =
  | "CREATED"
  | "PAYMENT_METHOD_CHOSEN"
  | "PAID"
  | "AUTHORIZED"
  | "CANCELED"
  | "TIMEOUTED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type CreatePaymentInput = {
  orderNumber: string;
  amountCzk: number;
  description: string;
  items: { name: string; amountCzk: number; count: number; type: "ITEM" | "DELIVERY" }[];
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city?: string | null;
    street?: string | null;
    zip?: string | null;
  };
  returnUrl: string;
  notificationUrl: string;
};

export type CreatedPayment = { id: string; gwUrl: string; state: GopayState };

export class GopayError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "GopayError";
  }
}

function apiBase() {
  return env.gopayMode === "production" ? "https://gate.gopay.cz/api" : "https://gw.sandbox.gopay.com/api";
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;
  if (!env.gopayClientId || !env.gopayClientSecret || !env.gopayGoid) {
    throw new GopayError("GoPay není nakonfigurováno (GOPAY_GOID, GOPAY_CLIENT_ID, GOPAY_CLIENT_SECRET).");
  }
  const basic = Buffer.from(`${env.gopayClientId}:${env.gopayClientSecret}`).toString("base64");
  const res = await fetch(`${apiBase()}/oauth2/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope: "payment-all" }),
    cache: "no-store",
  });
  if (!res.ok) throw new GopayError(`GoPay token: HTTP ${res.status} ${await res.text()}`, res.status);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new GopayError(`GoPay ${path}: HTTP ${res.status} ${await res.text()}`, res.status);
  return (await res.json()) as T;
}

const toHalere = (czk: number) => Math.round(czk * 100);

export async function createPayment(input: CreatePaymentInput): Promise<CreatedPayment> {
  if (env.gopayMode === "mock") {
    const id = `M${Date.now()}${crypto.randomInt(1000, 9999)}`;
    return { id, gwUrl: `${env.appUrl}/platba-test/${id}`, state: "CREATED" };
  }

  const instruments = env.gopayInstruments;
  const body = {
    payer: {
      allowed_payment_instruments: instruments,
      default_payment_instrument: instruments.includes("PAYMENT_CARD") ? "PAYMENT_CARD" : instruments[0],
      contact: {
        first_name: input.contact.firstName,
        last_name: input.contact.lastName,
        email: input.contact.email,
        phone_number: input.contact.phone.replace(/\s/g, ""),
        ...(input.contact.city ? { city: input.contact.city } : {}),
        ...(input.contact.street ? { street: input.contact.street } : {}),
        ...(input.contact.zip ? { postal_code: input.contact.zip } : {}),
        country_code: "CZE",
      },
    },
    target: { type: "ACCOUNT", goid: Number(env.gopayGoid) },
    amount: toHalere(input.amountCzk),
    currency: "CZK",
    order_number: input.orderNumber,
    order_description: input.description,
    items: input.items.map((i) => ({
      type: i.type,
      name: i.name.slice(0, 256),
      amount: toHalere(i.amountCzk),
      count: i.count,
    })),
    callback: { return_url: input.returnUrl, notification_url: input.notificationUrl },
    lang: "CS",
  };

  const json = await api<{ id: number; gw_url: string; state: GopayState }>("/payments/payment", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return { id: String(json.id), gwUrl: json.gw_url, state: json.state };
}

/** Aktuální stav platby přímo z GoPay (nikdy nevěříme jen návratu zákazníka). */
export async function getPaymentState(id: string): Promise<GopayState> {
  if (env.gopayMode === "mock") {
    const payment = await prisma.payment.findUnique({ where: { gopayId: id } });
    if (!payment) throw new GopayError("Platba neexistuje.", 404);
    return payment.state as GopayState;
  }
  if (!/^\d+$/.test(id)) throw new GopayError("Neplatné ID platby.", 400);
  const json = await api<{ state: GopayState }>(`/payments/payment/${id}`, { method: "GET" });
  return json.state;
}
