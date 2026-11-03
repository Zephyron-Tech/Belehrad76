/**
 * Vygeneruje ikony webu a podklad pečeti pro obrázky ke sdílení (OG).
 * Pečeť se vykreslí v Chromu se skutečným písmem Archivo (komponenta Seal), pak ji zmenší sharp.
 *
 *   npx tsx scripts/brand-assets.ts
 *
 * Výstupy (commitují se): src/app/icon.png, src/app/apple-icon.png, src/app/favicon.ico,
 * public/icons/icon-192.png, public/icons/icon-512.png, public/icons/icon-maskable-512.png, public/og/pecet.png
 */
import { mkdir, writeFile } from "node:fs/promises";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { chromium } from "@playwright/test";
import { Seal } from "../src/components/Seal";

const COLORS = "--seal:#b3262d;--seal-deep:#8f1d24;--cream:#efe8dc;--ink:#0f0d0b;--font-archivo:'Archivo'";
const FONT = "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&display=block";

/** Ikona: červený kotouč, tmavší prstenec a „1976“ krémově – čitelné i ve 32 px. */
const ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <circle cx="256" cy="256" r="256" fill="var(--seal)"/>
  <circle cx="256" cy="256" r="218" fill="none" stroke="var(--seal-deep)" stroke-width="14"/>
  <text x="256" y="318" text-anchor="middle" fill="var(--cream)" font-family="Archivo" font-weight="800"
        font-size="176" style="font-stretch:62%">1976</text>
</svg>`;

async function render(html: string, size: number, transparent = true) {
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<!doctype html><html><head><link rel="stylesheet" href="${FONT}"><style>
      html,body{margin:0;background:${transparent ? "transparent" : "#0f0d0b"}}
      :root{${COLORS}} svg{display:block;width:${size}px;height:${size}px}
    </style></head><body>${html}</body></html>`,
    { waitUntil: "networkidle" },
  );
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ omitBackground: transparent, clip: { x: 0, y: 0, width: size, height: size } });
  await browser.close();
  return png;
}

/** Soubor .ico s PNG uvnitř (podporují všechny současné prohlížeče). */
function ico(images: { size: number; png: Buffer }[]) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(png.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.png)]);
}

// Komponenty projektu se kompilují s klasickým JSX (React.createElement) – tsx je spouští mimo Next
(globalThis as unknown as { React: typeof React }).React = React;

async function main() {
  await mkdir("public/icons", { recursive: true });
  await mkdir("public/og", { recursive: true });

  const icon = await render(ICON_SVG, 512);
  await writeFile("src/app/icon.png", await sharp(icon).resize(512).png().toBuffer());
  await writeFile("public/icons/icon-512.png", await sharp(icon).resize(512).png().toBuffer());
  await writeFile("public/icons/icon-192.png", await sharp(icon).resize(192).png().toBuffer());
  // iOS ikona a „maskable“ pro Android: plné pozadí, kotouč s okrajem (bezpečná zóna)
  // iOS ikona a „maskable“ pro Android: plné pozadí, kotouč s okrajem (bezpečná zóna)
  const iconFor = async (size: number, inner: number) =>
    sharp({ create: { width: size, height: size, channels: 4, background: "#0f0d0b" } })
      .composite([{ input: await sharp(icon).resize(inner).png().toBuffer(), gravity: "center" }])
      .png()
      .toBuffer();
  await writeFile("src/app/apple-icon.png", await iconFor(180, 156));
  await writeFile("public/icons/icon-maskable-512.png", await iconFor(512, 400));
  await writeFile(
    "src/app/favicon.ico",
    ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, png: await sharp(icon).resize(size).png().toBuffer() })))),
  );

  const seal = renderToStaticMarkup(createElement(Seal, { filled: true, decorative: true, id: "og" }));
  await writeFile("public/og/pecet.png", await sharp(await render(seal, 1200)).png({ compressionLevel: 9 }).toBuffer());

  console.log("Hotovo: ikony a podklad pečeti.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
