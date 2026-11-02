"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getClientIp } from "@/lib/request";
import { login, logout, requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { ADMIN_TRANSITIONS, changeStatus, TransitionError } from "@/lib/orders/transitions";
import { anonymizeOrder } from "@/lib/gdpr";
import { verifyTurnstile } from "@/lib/turnstile";

export type ActionState = { error?: string; ok?: string } | undefined;

export async function loginAction(_: ActionState, form: FormData): Promise<ActionState> {
  const ip = await getClientIp();
  if (!(await verifyTurnstile(String(form.get("cf-turnstile-response") ?? ""), ip))) {
    return { error: "Ověření, že nejste robot, se nezdařilo." };
  }
  const result = await login(
    {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      code: String(form.get("code") ?? ""),
    },
    ip,
  );
  if (!result.ok) return { error: result.error };
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

const STATUSES: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"];

export async function changeStatusAction(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const ip = await getClientIp();
  const orderId = Number(form.get("orderId"));
  const to = String(form.get("to")) as OrderStatus;
  const actor = String(form.get("actor") ?? "").trim() || null;
  if (!Number.isInteger(orderId) || !STATUSES.includes(to)) return { error: "Neplatný požadavek." };

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!order) return { error: "Objednávka neexistuje." };
  if (!ADMIN_TRANSITIONS[order.status].includes(to)) return { error: "Tento přechod stavu není povolen." };

  try {
    await changeStatus(
      orderId,
      to,
      { source: "admin", actor, ip },
      { carrier: String(form.get("carrier") ?? ""), trackingNumber: String(form.get("trackingNumber") ?? "") },
    );
  } catch (err) {
    if (err instanceof TransitionError) return { error: err.message };
    console.error("[admin] status change failed", err);
    return { error: "Změnu se nepodařilo uložit." };
  }
  revalidatePath(`/admin/objednavky/${orderId}`);
  return { ok: "Stav objednávky byl změněn." };
}

export async function saveNoteAction(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const ip = await getClientIp();
  const orderId = Number(form.get("orderId"));
  const note = String(form.get("internalNote") ?? "").slice(0, 4000);
  const actor = String(form.get("actor") ?? "").trim() || null;
  if (!Number.isInteger(orderId)) return { error: "Neplatný požadavek." };
  await prisma.order.update({ where: { id: orderId }, data: { internalNote: note || null } });
  await audit({ action: "internal_note", orderId }, { source: "admin", actor, ip });
  revalidatePath(`/admin/objednavky/${orderId}`);
  return { ok: "Poznámka uložena." };
}

export async function anonymizeAction(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const ip = await getClientIp();
  const orderId = Number(form.get("orderId"));
  if (form.get("confirm") !== "on") return { error: "Potvrďte anonymizaci zaškrtnutím." };
  try {
    await anonymizeOrder(orderId, { source: "admin", actor: String(form.get("actor") ?? "").trim() || null, ip });
  } catch (err) {
    return { error: (err as Error).message };
  }
  revalidatePath(`/admin/objednavky/${orderId}`);
  return { ok: "Osobní údaje byly anonymizovány." };
}
