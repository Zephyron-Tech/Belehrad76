import { describe, expect, it } from "vitest";
import { calcShipping } from "@/lib/shipping";
import { buildSpd, czechAccountToIban, isValidIban } from "@/lib/bank";
import { priceCart, type CatalogProduct } from "@/lib/cart";
import { toCsv } from "@/lib/csv";
import { Settings } from "@/lib/settings";
import { typo } from "@/lib/format";

const rates = { boxCzk: 490, bottleCzk: 100 };

describe("doprava", () => {
  it("box 490 Kč jednou, i při více boxech", () => {
    expect(calcShipping({ boxes: 1, bottles: 0 }, "SHIPPING", rates)).toBe(490);
    expect(calcShipping({ boxes: 2, bottles: 0 }, "SHIPPING", rates)).toBe(490);
  });
  it("kusovka 100 Kč za kus", () => {
    expect(calcShipping({ boxes: 0, bottles: 3 }, "SHIPPING", rates)).toBe(300);
  });
  it("smíšený košík: jen jednou 490 Kč, kusovky se nepřičítají", () => {
    expect(calcShipping({ boxes: 1, bottles: 2 }, "SHIPPING", rates)).toBe(490);
    expect(calcShipping({ boxes: 3, bottles: 5 }, "SHIPPING", rates)).toBe(490);
  });
  it("osobní převzetí zdarma", () => {
    expect(calcShipping({ boxes: 3, bottles: 5 }, "PICKUP", rates)).toBe(0);
  });
});

describe("bankovní účet a QR platba", () => {
  it("převod čísla účtu na IBAN (vzor ČNB)", () => {
    expect(czechAccountToIban("19-2000145399/0800")).toBe("CZ6508000000192000145399");
  });
  it("účet e-shopu 303642799/0300 má platný IBAN", () => {
    const iban = czechAccountToIban("303642799/0300");
    expect(iban).toMatch(/^CZ\d{2}03000000000303642799$/);
    expect(isValidIban(iban)).toBe(true);
  });
  it("SPD řetězec obsahuje účet, částku a VS", () => {
    const spd = buildSpd({
      iban: "CZ6508000000192000145399",
      amountCzk: 10370,
      variableSymbol: "2600001",
      message: "Objednávka 2600001",
    });
    expect(spd).toBe("SPD*1.0*ACC:CZ6508000000192000145399*AM:10370.00*CC:CZK*X-VS:2600001*MSG:OBJEDNAVKA 2600001");
  });
});

describe("košík", () => {
  const products: CatalogProduct[] = [
    { id: 1, slug: "box", type: "BOX", name: "Box", priceCzk: 9880, stock: 2, active: true, madeToOrder: false, imageUrl: "" },
    { id: 2, slug: "panenka", type: "BOTTLE", name: "Panenka", priceCzk: 760, stock: null, active: true, madeToOrder: true, imageUrl: "" },
    { id: 3, slug: "stara", type: "BOTTLE", name: "Stará", priceCzk: 760, stock: null, active: false, madeToOrder: true, imageUrl: "" },
  ];
  const limits = { maxBoxes: 10, maxBottles: 50 };

  it("oceňuje box + kusovky a dopravu", () => {
    const cart = priceCart(
      [
        { slug: "box", quantity: 1 },
        { slug: "panenka", quantity: 2 },
      ],
      products,
      limits,
      rates,
    );
    expect(cart.issues).toEqual([]);
    expect(cart.itemsTotalCzk).toBe(9880 + 1520);
    expect(cart.shipping).toEqual({ SHIPPING: 490, PICKUP: 0 });
    expect(cart.hasMadeToOrder).toBe(true);
  });

  it("kusovky mají neomezený sklad", () => {
    const cart = priceCart([{ slug: "panenka", quantity: 40 }], products, limits, rates);
    expect(cart.issues).toEqual([]);
    expect(cart.bottles).toBe(40);
  });

  it("box nelze objednat nad stav skladu", () => {
    const cart = priceCart([{ slug: "box", quantity: 5 }], products, limits, rates);
    expect(cart.boxes).toBe(2);
    expect(cart.issues[0].message).toContain("zbývá jen 2");
  });

  it("vyprodaný box se z košíku vyřadí", () => {
    const sold = products.map((p) => (p.slug === "box" ? { ...p, stock: 0 } : p));
    const cart = priceCart([{ slug: "box", quantity: 1 }], sold, limits, rates);
    expect(cart.lines).toHaveLength(0);
    expect(cart.issues[0].message).toContain("vyprodáno");
  });

  it("neaktivní a neznámé položky se vyřadí", () => {
    const cart = priceCart(
      [
        { slug: "stara", quantity: 1 },
        { slug: "neexistuje", quantity: 1 },
      ],
      products,
      limits,
      rates,
    );
    expect(cart.lines).toHaveLength(0);
    expect(cart.issues).toHaveLength(2);
  });

  it("slučuje duplicitní řádky a hlídá limit objednávky", () => {
    const cart = priceCart(
      [
        { slug: "panenka", quantity: 30 },
        { slug: "panenka", quantity: 30 },
      ],
      products,
      limits,
      rates,
    );
    expect(cart.lines).toHaveLength(1);
    expect(cart.bottles).toBe(50);
    expect(cart.issues).toHaveLength(1);
  });
});

describe("CSV", () => {
  it("středník, BOM, uvozovky a ochrana proti CSV injection", () => {
    const csv = toCsv([
      ["a", "b;c", 'd"e'],
      ["=SUM(A1)", 5, null],
    ]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain('a;"b;c";"d""e"\r\n');
    expect(csv).toContain("'=SUM(A1);5;\r\n");
  });
});

describe("nastavení", () => {
  it("dosazuje hodnoty do textů a má výchozí hodnoty", () => {
    const s = new Settings({ "seller.name": "Firma s.r.o." });
    expect(s.interpolate("Prodává {{seller.name}}, IČO {{ seller.ico }}.")).toBe("Prodává Firma s.r.o., IČO 10788433.");
    expect(s.num("shipping.box_czk")).toBe(490);
    expect(s.bool("pickup.enabled")).toBe(true);
  });
});

describe("česká typografie", () => {
  const NBSP = "\u00a0";
  it("nezlomitelná mezera za jednopísmennými předložkami a spojkami", () => {
    expect(typo("a v Praze k dispozici i s boxem")).toBe(`a${NBSP}v${NBSP}Praze k${NBSP}dispozici i${NBSP}s${NBSP}boxem`);
  });
  it("číslo a jednotka zůstanou u sebe", () => {
    expect(typo("slivovice 50 %, lhůta 8 dní.")).toBe(`slivovice 50${NBSP}%, lhůta 8${NBSP}dní.`);
  });
  it("odkazy a slova s více písmeny nemění", () => {
    expect(typo("[řád](/reklamacni-rad) Box")).toBe("[řád](/reklamacni-rad) Box");
  });
});

