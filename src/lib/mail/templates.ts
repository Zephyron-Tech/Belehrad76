import type { Order, OrderItem } from "@prisma/client";
import type { Settings } from "../settings";
import { formatCzk, formatDateTime, formatZip } from "../format";
import { DELIVERY_LABEL, EVENING_ENTRY_NOTE, PAYMENT_LABEL } from "../labels";
import { formatIban, type TransferInstructions } from "../bank";

export type OrderWithItems = Order & { items: OrderItem[] };

export function esc(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Barvy značky podle webu (černá, zlatá, krémová etiketa, červená pečeť). E-mail má ale světlé tělo: čte se dobře v Gmailu
// i na mobilu a poštovní klienty ho v tmavém režimu převrátí přirozeněji než celoplošně černý. Tmavý je jen pruh se značkou.
const INK = "#0f0d0b";
const PANEL2 = "#241e16";
const TEXT = "#1b1712";
const GOLD = "#c9a35c";
const GOLD_LIGHT = "#e6c98f";
const CREAM = "#efe8dc";
const MUTED = "#6b6252";
const LINE = "#e6dfd0";
const PAGE_BG = "#efe8dc";
const BODY_BG = "#fbf8f1";
const PAPER = "#e8e0cf";
const SEAL = "#b3262d";
const LINK = "#8a5a14";
// Písmo webu (Archivo) poštovní klienti nenačtou, proto systémové úzké / bezpatkové písmo
const DISPLAY = "'Arial Narrow','Helvetica Neue',Arial,sans-serif";
const BODY = "'Helvetica Neue',Helvetica,Arial,sans-serif";

/** Barevný pruh s nadpisem: stejné „kapitoly“ jako na webu (noc, zlato, krémová etiketa) */
type Tone = "night" | "gold" | "paper";
const TONES: Record<Tone, { bg: string; title: string; eyebrow: string }> = {
  night: { bg: PANEL2, title: GOLD, eyebrow: GOLD_LIGHT },
  gold: { bg: GOLD, title: INK, eyebrow: INK },
  paper: { bg: PAPER, title: INK, eyebrow: SEAL },
};

function layout(settings: Settings, title: string, body: string, opts: { tone?: Tone; eyebrow?: string; preheader?: string } = {}): string {
  const tone = TONES[opts.tone ?? "night"];
  // Vše důležité je inline (Gmail mimo vlastní účty <style> odstraňuje); <style> jen vylepšuje úzké displeje a tmavý režim
  return `<!doctype html>
<html lang="cs" xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="x-apple-disable-message-reformatting"><meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<title>${esc(title)}</title>
<style>
@media only screen and (max-width:620px){.px{padding-left:20px !important;padding-right:20px !important}.h1{font-size:28px !important}.col-n{display:none !important}}
@media (prefers-color-scheme:dark){.page{background:#0f0d0b !important}.card{background:#19150f !important}.txt{color:#efe8dc !important}.muted{color:#b0a48c !important}.row{border-color:#3a3026 !important}.lnk{color:#e6c98f !important}.strong{color:#e6c98f !important}}
</style></head>
<body class="page" style="margin:0;padding:0;background:${PAGE_BG};font-family:${BODY};color:${TEXT};-webkit-text-size-adjust:100%;">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${PAGE_BG};">${esc(opts.preheader)}${"&nbsp;&zwnj;".repeat(40)}</div>` : ""}
<table role="presentation" class="page" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAGE_BG}" style="background:${PAGE_BG};">
<tr><td align="center" style="padding:24px 12px;">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
<tr><td class="px" align="center" bgcolor="${INK}" style="background:${INK};padding:28px 32px 24px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center" valign="middle" width="56" height="56" bgcolor="${SEAL}" style="width:56px;height:56px;background:${SEAL};border-radius:28px;font-family:${DISPLAY};font-size:19px;font-weight:bold;letter-spacing:1px;color:#8f1d24;line-height:56px;">1976</td></tr></table>
<div style="font-family:${DISPLAY};font-size:24px;font-weight:bold;letter-spacing:3px;color:${GOLD};text-transform:uppercase;margin-top:14px;">Mistři Evropy</div>
<div style="font-family:${DISPLAY};font-size:12px;letter-spacing:5px;color:${CREAM};text-transform:uppercase;margin-top:4px;">Bělehrad 1976</div>
</td></tr>
<tr><td class="px" bgcolor="${tone.bg}" style="background:${tone.bg};padding:32px 32px 28px;">
${opts.eyebrow ? `<div style="font-family:${BODY};font-size:12px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:${tone.eyebrow};margin:0 0 10px;">${esc(opts.eyebrow)}</div>` : ""}
<h1 class="h1" style="font-family:${DISPLAY};font-size:32px;line-height:1.05;font-weight:bold;text-transform:uppercase;margin:0;color:${tone.title};">${esc(title)}</h1>
</td></tr>
<tr><td class="px card txt" bgcolor="${BODY_BG}" style="background:${BODY_BG};padding:28px 32px 32px;font-size:16px;line-height:1.6;color:${TEXT};">
${body}
</td></tr>
<tr><td class="px muted" align="center" style="padding:22px 32px 4px;font-size:12px;color:${MUTED};line-height:1.6;">
Výtěžek edice jde na podporu Nadace fotbalových internacionálů.<br>
Prodávající: ${esc(settings.str("seller.name"))}, IČO ${esc(settings.str("seller.ico"))}, ${esc(settings.str("seller.address"))}<br>
Kontakt: ${esc(settings.str("contact.email"))}${settings.str("contact.phone") ? `, ${esc(settings.str("contact.phone"))}` : ""}<br>
Prodej alkoholu osobám mladším 18 let je zakázán.
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body></html>`;
}

function itemsTable(order: OrderWithItems): string {
  const cell = `padding:12px 0;border-bottom:1px solid ${LINE};`;
  const rows = order.items
    .map(
      (i) => `<tr>
<td class="row" style="${cell}">${esc(i.name)}${i.madeToOrder ? `<br><span class="muted" style="font-size:12px;color:${MUTED};">vyrábí se na objednávku</span>` : ""}</td>
<td class="row" style="${cell}padding-left:8px;padding-right:8px;text-align:center;white-space:nowrap;" width="40">${i.quantity}×</td>
<td class="row" style="${cell}text-align:right;white-space:nowrap;" width="92">${formatCzk(i.unitPriceCzk * i.quantity)}</td>
</tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:15px;margin:16px 0 20px;">
${rows}
<tr><td class="row muted" style="${cell}color:${MUTED};">Doprava – ${esc(DELIVERY_LABEL[order.deliveryMethod])}</td><td class="row" style="${cell}"></td>
<td class="row" style="${cell}text-align:right;white-space:nowrap;">${order.shippingCzk ? formatCzk(order.shippingCzk) : "zdarma"}</td></tr>
<tr><td class="strong" style="padding:14px 0 0;font-family:${DISPLAY};font-size:20px;font-weight:bold;text-transform:uppercase;color:${TEXT};">Celkem</td><td></td>
<td class="strong" style="padding:14px 0 0;font-family:${DISPLAY};font-size:22px;font-weight:bold;text-align:right;white-space:nowrap;color:${TEXT};">${formatCzk(order.totalCzk)}</td></tr>
</table>`;
}

function itemsText(order: OrderWithItems): string {
  return [
    ...order.items.map((i) => `- ${i.name}: ${i.quantity}× = ${formatCzk(i.unitPriceCzk * i.quantity)}`),
    `- Doprava (${DELIVERY_LABEL[order.deliveryMethod]}): ${order.shippingCzk ? formatCzk(order.shippingCzk) : "zdarma"}`,
    `Celkem: ${formatCzk(order.totalCzk)}`,
  ].join("\n");
}

function deliveryHtml(order: OrderWithItems, settings: Settings): string {
  if (order.deliveryMethod === "PICKUP") {
    return `<p><strong>Osobní převzetí:</strong> ${esc(settings.str("pickup.address"))}<br>${esc(settings.str("pickup.note"))}</p>`;
  }
  if (order.deliveryMethod === "PACKETA") {
    return `<p><strong>Výdejní místo Zásilkovny:</strong><br>${esc(order.packetaPointName)}${order.packetaPointAddress ? `<br>${esc(order.packetaPointAddress)}` : ""}</p>`;
  }
  return `<p><strong>Doručovací adresa:</strong><br>${esc(order.firstName)} ${esc(order.lastName)}<br>${esc(order.street)}<br>${esc(formatZip(order.zip))} ${esc(order.city)}</p>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr><td bgcolor="${GOLD}" style="background:${GOLD};"><a href="${esc(href)}" style="display:inline-block;padding:14px 26px;font-family:${DISPLAY};font-size:17px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${INK};text-decoration:none;">${esc(label)}</a></td></tr></table>`;
}

/** Doručení a dodací lhůta: box kurýrem (jen při doručení na adresu), kusovky na objednávku */
function madeToOrderNote(order: OrderWithItems, settings: Settings): string {
  const notes: string[] = [];
  if (order.deliveryMethod === "SHIPPING" && order.items.some((i) => i.type === "BOX")) notes.push(settings.str("box.delivery"));
  if (order.items.some((i) => i.madeToOrder)) notes.push(settings.str("bottle.lead_time"));
  return notes.map((n) => `<p class="muted" style="font-size:14px;color:${MUTED};">${esc(n)}</p>`).join("\n");
}

/** E-mail ihned po vytvoření objednávky */
export function orderReceivedMail(
  order: OrderWithItems,
  settings: Settings,
  opts: { orderUrl: string; transfer?: TransferInstructions; qrCid?: string },
) {
  const title = `Objednávka ${order.number} přijata`;
  let payment = "";
  let paymentText = "";

  if (order.paymentMethod === "BANK_TRANSFER" && opts.transfer) {
    const t = opts.transfer;
    payment = `<h2 style="font-family:${DISPLAY};font-size:22px;font-weight:800;text-transform:uppercase;color:${TEXT};margin:28px 0 8px;">Platební údaje</h2>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;">
<tr><td style="padding:3px 16px 3px 0;color:${MUTED};">Číslo účtu</td><td><strong>${esc(t.account)}</strong></td></tr>
<tr><td style="padding:3px 16px 3px 0;color:${MUTED};">IBAN</td><td>${esc(formatIban(t.iban))}</td></tr>
<tr><td style="padding:3px 16px 3px 0;color:${MUTED};">Variabilní symbol</td><td><strong>${esc(t.variableSymbol)}</strong></td></tr>
<tr><td style="padding:3px 16px 3px 0;color:${MUTED};">Částka</td><td><strong>${formatCzk(t.amountCzk)}</strong></td></tr>
<tr><td style="padding:3px 16px 3px 0;color:${MUTED};">Zaplaťte do</td><td>${esc(formatDateTime(order.reservedUntil))}</td></tr>
</table>
${opts.qrCid ? `<p><img src="cid:${opts.qrCid}" width="180" height="180" alt="QR platba"></p>` : ""}
<p style="font-size:14px;">Po připsání platby vám pošleme potvrzení. Nezaplacená objednávka se po uplynutí lhůty automaticky zruší.</p>`;
    paymentText = `Platební údaje:\nÚčet: ${t.account}\nIBAN: ${t.iban}\nVS: ${t.variableSymbol}\nČástka: ${formatCzk(t.amountCzk)}\nZaplaťte do: ${formatDateTime(order.reservedUntil)}\n`;
  } else {
    payment = `<p>Pokud platba kartou neproběhla, můžete ji dokončit na stránce objednávky:</p>${button(opts.orderUrl, "Zobrazit objednávku")}`;
    paymentText = `Pokud platba neproběhla, dokončete ji zde: ${opts.orderUrl}\n`;
  }

  const html = layout(
    settings,
    title,
    `<p>Dobrý den,</p>
<p>děkujeme za objednávku z limitované edice Mistři Evropy – Bělehrad 1976. Objednávka čeká na zaplacení.</p>
${itemsTable(order)}
${payment}
${deliveryHtml(order, settings)}
${madeToOrderNote(order, settings)}
${order.eveningInterest ? `<p>Po zaplacení vás zařadíme do losování o vstup na slavnostní večer. <strong>${EVENING_ENTRY_NOTE}</strong></p>` : ""}
<p style="font-size:13px;color:${MUTED};">Stav objednávky: <a href="${esc(opts.orderUrl)}" class="lnk" style="color:${LINK};">${esc(opts.orderUrl)}</a></p>`,
    { tone: "night", eyebrow: "Čeká na zaplacení", preheader: `Objednávka ${order.number} čeká na zaplacení, celkem ${formatCzk(order.totalCzk)}.` },
  );

  const text = `Dobrý den,\n\nděkujeme za objednávku ${order.number}. Objednávka čeká na zaplacení.\n\n${itemsText(order)}\n\n${paymentText}${order.eveningInterest ? `\nPo zaplacení vás zařadíme do losování o vstup na slavnostní večer. ${EVENING_ENTRY_NOTE}\n` : ""}\nStav objednávky: ${opts.orderUrl}\n`;
  return { subject: title, html, text };
}

/** Potvrzení o přijetí platby (s PDF v příloze) */
export function paymentConfirmedMail(order: OrderWithItems, settings: Settings, opts: { orderUrl: string }) {
  const title = `Platba za objednávku ${order.number} přijata`;
  const html = layout(
    settings,
    title,
    `<p>Dobrý den,</p>
<p>potvrzujeme přijetí platby <strong>${formatCzk(order.totalCzk)}</strong> za objednávku <strong>${esc(order.number)}</strong>. Potvrzení o zaplacení najdete v příloze (PDF).</p>
${itemsTable(order)}
${deliveryHtml(order, settings)}
${madeToOrderNote(order, settings)}
${
  order.eveningInterest
    ? `<p>Jste zařazeni do losování o vstup na slavnostní večer ${esc(settings.str("evening.date"))}. <strong>${EVENING_ENTRY_NOTE}</strong> O výsledku vás budeme informovat.</p>`
    : ""
}
<p>O odeslání vás budeme informovat dalším e-mailem.</p>
<p>Děkujeme, že podporujete Nadaci fotbalových internacionálů.</p>`,
    { tone: "gold", eyebrow: "Potvrzení platby", preheader: `Platbu ${formatCzk(order.totalCzk)} jsme přijali. Potvrzení najdete v příloze.` },
  );
  const text = `Dobrý den,\n\npotvrzujeme přijetí platby ${formatCzk(order.totalCzk)} za objednávku ${order.number}. Potvrzení najdete v příloze.\n\n${itemsText(order)}\n\n${order.eveningInterest ? `Jste zařazeni do losování o vstup na slavnostní večer. ${EVENING_ENTRY_NOTE}\n\n` : ""}Stav objednávky: ${opts.orderUrl}\n`;
  return { subject: title, html, text };
}

/** Upozornění provozovateli na zaplacenou objednávku */
export function ownerPaidMail(order: OrderWithItems, settings: Settings, opts: { adminUrl: string; oversold: boolean }) {
  const title = `Zaplacená objednávka ${order.number} – ${formatCzk(order.totalCzk)}`;
  const billing = [order.companyName, order.ico && `IČO ${order.ico}`, order.dic && `DIČ ${order.dic}`].filter(Boolean).join(", ");
  const html = layout(
    settings,
    title,
    `${
      opts.oversold
        ? `<p style="background:#fbe9e7;border-left:4px solid ${SEAL};padding:12px 16px;"><strong>Pozor:</strong> objednávka byla zaplacena přes GoPay až po vypršení rezervace a box už nebyl skladem. Vyřešte prosím ručně (vrácení peněz nebo box z rezervy).</p>`
        : ""
    }
<p><strong>${esc(order.firstName)} ${esc(order.lastName)}</strong><br>${esc(order.email)} · ${esc(order.phone)}</p>
${billing ? `<p>Fakturační údaje: ${esc(billing)}</p>` : ""}
${itemsTable(order)}
<p>Platba: ${esc(PAYMENT_LABEL[order.paymentMethod])}</p>
${deliveryHtml(order, settings)}
<p>Zájem o slavnostní večer: <strong>${order.eveningInterest ? "ANO" : "ne"}</strong></p>
${order.note ? `<p>Poznámka zákazníka: ${esc(order.note)}</p>` : ""}
${button(opts.adminUrl, "Otevřít v administraci")}`,
    { tone: "night", eyebrow: "Pro provozovatele", preheader: `${order.firstName} ${order.lastName}, ${formatCzk(order.totalCzk)}` },
  );
  const text = `${title}\n\n${order.firstName} ${order.lastName}, ${order.email}, ${order.phone}\n${billing}\n\n${itemsText(order)}\n\nPlatba: ${PAYMENT_LABEL[order.paymentMethod]}\nDoprava: ${DELIVERY_LABEL[order.deliveryMethod]}\nVečer: ${order.eveningInterest ? "ANO" : "ne"}\n${order.note ? `Poznámka: ${order.note}\n` : ""}\n${opts.adminUrl}\n`;
  return { subject: title, html, text };
}

/** Odesláno dopravcem / připraveno k osobnímu převzetí */
export function shippedMail(order: OrderWithItems, settings: Settings, opts: { orderUrl: string }) {
  if (order.deliveryMethod === "PICKUP") {
    const title = `Objednávka ${order.number} je připravena k převzetí`;
    const html = layout(
      settings,
      title,
      `<p>Dobrý den,</p>
<p>vaše objednávka <strong>${esc(order.number)}</strong> je připravena k osobnímu převzetí.</p>
<p><strong>Adresa:</strong> ${esc(settings.str("pickup.address"))}<br>${esc(settings.str("pickup.note"))}</p>
<p>Při převzetí prosím prokažte věk 18+ a uveďte číslo objednávky.</p>`,
      { tone: "paper", eyebrow: "K převzetí", preheader: `Objednávku ${order.number} si můžete vyzvednout.` },
    );
    const text = `Dobrý den,\n\nobjednávka ${order.number} je připravena k převzetí.\nAdresa: ${settings.str("pickup.address")}\n${settings.str("pickup.note")}\n\nPři převzetí prokažte věk 18+.\n`;
    return { subject: title, html, text };
  }

  const title = `Objednávka ${order.number} byla odeslána`;
  const html = layout(
    settings,
    title,
    `<p>Dobrý den,</p>
<p>vaši objednávku <strong>${esc(order.number)}</strong> jsme předali dopravci.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;">
<tr><td style="padding:3px 16px 3px 0;color:${MUTED};">Dopravce</td><td><strong>${esc(order.carrier)}</strong></td></tr>
${order.trackingNumber ? `<tr><td style="padding:3px 16px 3px 0;color:${MUTED};">Číslo zásilky</td><td><strong>${esc(order.trackingNumber)}</strong></td></tr>` : ""}
</table>
${deliveryHtml(order, settings)}
${
  order.deliveryMethod === "PACKETA"
    ? "<p>Až zásilka dorazí na výdejní místo, Zásilkovna vám pošle zprávu s kódem pro vyzvednutí. Zásilka obsahuje alkohol – při vyzvednutí prokažte věk 18+ dokladem totožnosti.</p>"
    : "<p>Zásilka obsahuje alkohol – při převzetí může dopravce ověřit věk 18+.</p>"
}`,
    { tone: "paper", eyebrow: "Na cestě", preheader: `Objednávku ${order.number} jsme předali dopravci.` },
  );
  const text = `Dobrý den,\n\nobjednávku ${order.number} jsme předali dopravci.\nDopravce: ${order.carrier}\n${order.trackingNumber ? `Číslo zásilky: ${order.trackingNumber}\n` : ""}\nStav objednávky: ${opts.orderUrl}\n`;
  return { subject: title, html, text };
}
