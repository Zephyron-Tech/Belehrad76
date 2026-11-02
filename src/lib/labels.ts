import type { DeliveryMethod, OrderStatus, PaymentMethod } from "@prisma/client";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Přijatá – čeká na platbu",
  PAID: "Zaplacená",
  SHIPPED: "Odeslaná",
  COMPLETED: "Dokončená",
  CANCELLED: "Zrušená",
};

/** U osobního převzetí se „odeslaná“ zobrazuje jako „připravená k převzetí“. */
export function statusLabel(status: OrderStatus, delivery: DeliveryMethod): string {
  if (status === "SHIPPED" && delivery === "PICKUP") return "Připravená k převzetí";
  return STATUS_LABEL[status];
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  GOPAY: "Kartou / online převodem (GoPay)",
  BANK_TRANSFER: "Bankovním převodem / QR kódem",
};

export const DELIVERY_LABEL: Record<DeliveryMethod, string> = {
  SHIPPING: "Doručení na adresu",
  PICKUP: "Osobní převzetí na FAČR",
};
