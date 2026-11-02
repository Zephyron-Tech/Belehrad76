/**
 * Připraví dočasné obrázky z vizualizací ve složce foto/:
 *  - public/img/box.jpg     vizualizace boxu
 *  - public/img/lahve.jpg   řada 13 lahví
 *  - public/img/hraci/*.jpg výřez etikety (portrét + jméno + číslo) pro každou kusovku
 *
 * Jde o zástupné obrázky, dokud zadavatel nedodá finální fotografie.
 * Spuštění: npm run images:prepare
 */
import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import { PLAYERS } from "../prisma/players";

const ROOT = path.resolve(__dirname, "..");
const SRC_BOX = path.join(ROOT, "foto", "WhatsApp Image 2026-11-01 at 20.00.17.jpeg");
const SRC_BOTTLES = path.join(ROOT, "foto", "WhatsApp Image 2026-11-01 at 20.00.17 (1).jpeg");
const OUT = path.join(ROOT, "public", "img");

// Fotka lahví má 1280 × 543 px, 13 lahví s roztečí ~91,3 px.
const FIRST_CENTER_X = 92;
const PITCH_X = 91.3;
const LABEL_WIDTH = 88;
const LABEL_TOP = 258;
const LABEL_HEIGHT = 150;

async function main() {
  await fs.mkdir(path.join(OUT, "hraci"), { recursive: true });

  await sharp(SRC_BOX).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(OUT, "box.jpg"));
  await sharp(SRC_BOTTLES).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(OUT, "lahve.jpg"));

  for (const [index, player] of PLAYERS.entries()) {
    const center = Math.round(FIRST_CENTER_X + index * PITCH_X);
    const file = path.join(OUT, "hraci", `${player.slug}.jpg`);
    await sharp(SRC_BOTTLES)
      .extract({
        left: center - LABEL_WIDTH / 2,
        top: LABEL_TOP,
        width: LABEL_WIDTH,
        height: LABEL_HEIGHT,
      })
      .resize({ width: LABEL_WIDTH * 4, kernel: "lanczos3" })
      .sharpen()
      .jpeg({ quality: 90, mozjpeg: true })
      .toFile(file);
    console.log("✔", path.relative(ROOT, file));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
