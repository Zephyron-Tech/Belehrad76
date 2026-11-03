import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createOrder, CheckoutError } from "@/lib/orders/create";
import { cancelOrder, markCompleted, markPaid, markShipped, TransitionError } from "@/lib/orders/transitions";
import { expireStaleOrders } from "@/lib/orders/expire";
import { startGopayPayment, syncGopayPayment } from "@/lib/orders/payments";
import { eveningCsv } from "@/lib/exports";
import { sentMailLog } from "@/lib/mail/transport";
import { boxStock, checkout, resetDb, setSetting } from "./helpers";

const admin = { source: "admin" as const, actor: "JN", ip: "127.0.0.1" };

describe("objednávky a sklad", () => {
  beforeEach(() => resetDb());

  it("objednávka zarezervuje box, spočítá dopravu a pošle e-mail s QR platbou", async () => {
    const order = await createOrder(
      checkout({
        lines: [
          { slug: "box", quantity: 1 },
          { slug: "panenka", quantity: 2 },
        ],
      }),
      "1.2.3.4",
    );
    expect(order.status).toBe("PENDING");
    expect(order.number).toMatch(/^26\d{5}$/);
    expect(order.itemsTotalCzk).toBe(9880 + 2 * 760);
    expect(order.shippingCzk).toBe(490);
    expect(order.totalCzk).toBe(9880 + 1520 + 490);
    expect(order.stockReserved).toBe(true);
    expect(await boxStock()).toBe(143);

    expect(sentMailLog).toHaveLength(1);
    expect(sentMailLog[0].subject).toContain(order.number);
    expect(sentMailLog[0].attachments).toContain("qr-platba.png");
  });

  it("jen kusovky: sklad boxů se nemění, doprava 100 Kč/ks, osobní převzetí zdarma", async () => {
    const shipped = await createOrder(checkout({ lines: [{ slug: "viktor", quantity: 3 }] }), null);
    expect(shipped.shippingCzk).toBe(300);
    expect(shipped.stockReserved).toBe(false);

    const pickup = await createOrder(
      checkout({ lines: [{ slug: "viktor", quantity: 3 }], deliveryMethod: "PICKUP", address: undefined }),
      null,
    );
    expect(pickup.shippingCzk).toBe(0);
    expect(pickup.street).toBeNull();
    expect(await boxStock()).toBe(144);
  });

  it("poslední box nelze prodat dvakrát ani při souběžných objednávkách", async () => {
    await resetDb(1);
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, (_, i) =>
        createOrder(checkout({ customer: { firstName: "A", lastName: `B${i}`, email: `a${i}@example.com`, phone: "777123456" } }), null),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    expect(rejected).toHaveLength(4);
    for (const r of rejected) expect(r.reason).toBeInstanceOf(CheckoutError);
    expect(await boxStock()).toBe(0);
  });

  it("validace: chybí souhlasy nebo adresa", async () => {
    await expect(
      createOrder({ ...checkout(), consents: { terms: true, age: false, privacy: true, marketing: false } }, null),
    ).rejects.toMatchObject({ fieldErrors: { "consents.age": expect.any(String) } });
    await expect(createOrder(checkout({ address: { street: "", city: "Praha", zip: "1" } }), null)).rejects.toMatchObject({
      fieldErrors: { "address.street": expect.any(String), "address.zip": expect.any(String) },
    });
  });

  it("prodej lze vypnout v nastavení", async () => {
    await setSetting("sales.open", "false");
    await expect(createOrder(checkout(), null)).rejects.toThrow("Prodej momentálně není spuštěn");
  });

  it("platba převodem: ruční označení jako zaplacená je idempotentní a e-maily jdou jednou", async () => {
    const order = await createOrder(checkout({ eveningInterest: true, companionName: "Eva Nováková" }), null);
    sentMailLog.length = 0;

    const first = await markPaid(order.id, admin);
    const second = await markPaid(order.id, admin);
    expect(first.changed).toBe(true);
    expect(second.changed).toBe(false);

    const paid = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(paid.status).toBe("PAID");
    expect(paid.paymentConfirmationSentAt).not.toBeNull();
    expect(await boxStock()).toBe(143); // odečteno jen jednou

    const customerMails = sentMailLog.filter((m) => m.to === "jan@example.com");
    expect(customerMails).toHaveLength(1);
    expect(customerMails[0].attachments).toContain(`potvrzeni-platby-${order.number}.pdf`);
    expect(sentMailLog.filter((m) => m.to === "objednavky@belehrad76.cz")).toHaveLength(1);

    const log = await prisma.auditLog.findMany({ where: { orderId: order.id, action: "status_change" } });
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ fromStatus: "PENDING", toStatus: "PAID", source: "admin", actor: "JN", ip: "127.0.0.1" });
  });

  it("odeslání pošle e-mail s dopravcem, pak dokončení", async () => {
    const order = await createOrder(checkout(), null);
    await markPaid(order.id, admin);
    sentMailLog.length = 0;

    await expect(markShipped(order.id, { carrier: "" }, admin)).rejects.toBeInstanceOf(TransitionError);
    await markShipped(order.id, { carrier: "PPL", trackingNumber: "123456789" }, admin);
    await markShipped(order.id, { carrier: "PPL", trackingNumber: "123456789" }, admin);
    expect(sentMailLog).toHaveLength(1);
    expect(sentMailLog[0].subject).toContain("odeslána");

    await markCompleted(order.id, admin);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("COMPLETED");
  });

  it("osobní převzetí: e-mail „připravena k převzetí“ bez dopravce", async () => {
    const order = await createOrder(checkout({ deliveryMethod: "PICKUP", address: undefined }), null);
    await markPaid(order.id, admin);
    sentMailLog.length = 0;
    await markShipped(order.id, {}, admin);
    expect(sentMailLog[0].subject).toContain("připravena k převzetí");
  });

  it("zrušení vrátí box na sklad", async () => {
    const order = await createOrder(checkout({ lines: [{ slug: "box", quantity: 2 }] }), null);
    expect(await boxStock()).toBe(142);
    await cancelOrder(order.id, admin);
    expect(await boxStock()).toBe(144);
    await cancelOrder(order.id, admin); // idempotentní
    expect(await boxStock()).toBe(144);
  });

  it("po vypršení rezervace se nezaplacená objednávka zruší a box se uvolní", async () => {
    const order = await createOrder(checkout(), null);
    expect(await boxStock()).toBe(143);
    const cancelled = await expireStaleOrders(new Date(Date.now() + 8 * 24 * 3_600_000));
    expect(cancelled).toBe(1);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("CANCELLED");
    expect(await boxStock()).toBe(144);
  });

  it("pozdě došlý převod: zrušenou objednávku lze označit jako zaplacenou, box se znovu odečte", async () => {
    const order = await createOrder(checkout(), null);
    await expireStaleOrders(new Date(Date.now() + 8 * 24 * 3_600_000));
    expect(await boxStock()).toBe(144);
    await markPaid(order.id, admin);
    expect(await boxStock()).toBe(143);
  });

  it("pozdě došlý převod bez boxu skladem: admin dostane chybu, stav se nezmění", async () => {
    await resetDb(1);
    const late = await createOrder(checkout(), null);
    await expireStaleOrders(new Date(Date.now() + 8 * 24 * 3_600_000));
    await createOrder(checkout({ customer: { firstName: "B", lastName: "C", email: "b@example.com", phone: "777123456" } }), null);
    await expect(markPaid(late.id, admin)).rejects.toBeInstanceOf(TransitionError);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: late.id } })).status).toBe("CANCELLED");
  });
});

describe("GoPay (simulace)", () => {
  beforeEach(() => resetDb());

  it("zaplacení přes bránu: opakovaná notifikace nic nezdvojí", async () => {
    const order = await createOrder(checkout({ paymentMethod: "GOPAY" }), null);
    const gwUrl = await startGopayPayment(order.id);
    expect(gwUrl).toContain("/platba-test/");
    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } });

    expect(await syncGopayPayment(payment.gopayId)).toBe("CREATED");
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PENDING");

    await prisma.payment.update({ where: { id: payment.id }, data: { state: "PAID" } });
    sentMailLog.length = 0;
    await syncGopayPayment(payment.gopayId);
    await syncGopayPayment(payment.gopayId);

    const paid = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(paid.status).toBe("PAID");
    expect(sentMailLog.filter((m) => m.to === "jan@example.com")).toHaveLength(1);
    expect(await boxStock()).toBe(143);
  });

  it("zrušená platba nechá objednávku čekat; po vypršení se ověří a zruší", async () => {
    const order = await createOrder(checkout({ paymentMethod: "GOPAY" }), null);
    await startGopayPayment(order.id);
    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } });
    await prisma.payment.update({ where: { id: payment.id }, data: { state: "CANCELED" } });
    await syncGopayPayment(payment.gopayId);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PENDING");

    await expireStaleOrders(new Date(Date.now() + 31 * 60_000));
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("CANCELLED");
    expect(await boxStock()).toBe(144);
  });

  it("platba dokončená těsně před vypršením se při expiraci ověří a objednávka se nezruší", async () => {
    const order = await createOrder(checkout({ paymentMethod: "GOPAY" }), null);
    await startGopayPayment(order.id);
    await prisma.payment.updateMany({ where: { orderId: order.id }, data: { state: "PAID" } });
    const cancelled = await expireStaleOrders(new Date(Date.now() + 31 * 60_000));
    expect(cancelled).toBe(0);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PAID");
  });

  it("GoPay zaplaceno po vypršení a box mezitím prodán: objednávka je zaplacená, provozovatel dostane varování", async () => {
    await resetDb(1);
    const order = await createOrder(checkout({ paymentMethod: "GOPAY" }), null);
    await startGopayPayment(order.id);
    await cancelOrder(order.id, { source: "system" }, "test");
    await createOrder(checkout({ customer: { firstName: "B", lastName: "C", email: "b@example.com", phone: "777123456" } }), null);
    sentMailLog.length = 0;

    await prisma.payment.updateMany({ where: { orderId: order.id }, data: { state: "PAID" } });
    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } });
    await syncGopayPayment(payment.gopayId);

    const paid = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(paid.status).toBe("PAID");
    expect(paid.stockReserved).toBe(false);
    expect(await boxStock()).toBe(0);
    const audit = await prisma.auditLog.findFirst({ where: { orderId: order.id, toStatus: "PAID" } });
    expect(audit?.detail).toContain("přeprodej");
  });
});

describe("export zájemců o večer", () => {
  beforeEach(() => resetDb());

  it("obsahuje jen zaplacené objednávky se zájmem o večer", async () => {
    const paidInterested = await createOrder(checkout({ eveningInterest: true, companionName: "Eva Nováková" }), null);
    await createOrder(
      checkout({ eveningInterest: true, customer: { firstName: "Ne", lastName: "Zaplatil", email: "x@example.com", phone: "777123456" } }),
      null,
    );
    const paidNotInterested = await createOrder(
      checkout({ customer: { firstName: "Bez", lastName: "Zájmu", email: "y@example.com", phone: "777123456" } }),
      null,
    );
    await markPaid(paidInterested.id, admin);
    await markPaid(paidNotInterested.id, admin);

    const { csv, count } = await eveningCsv();
    expect(count).toBe(1);
    expect(csv).toContain("Eva Nováková");
    expect(csv).toContain(paidInterested.number);
    expect(csv).not.toContain("Zaplatil");
    expect(csv).not.toContain("Zájmu");
  });
});
