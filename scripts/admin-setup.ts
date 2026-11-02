/**
 * Založí nebo přenastaví jediný společný účet administrace.
 *
 *   npm run admin:setup -- --email objednavky@belehrad76.cz
 *
 * Heslo se zadá interaktivně (nebo proměnnou ADMIN_PASSWORD). Vygeneruje se nové tajemství pro 2FA
 * a vypíše QR kód pro aplikaci Google Authenticator / Microsoft Authenticator.
 * Spuštěním se zneplatní všechna stávající přihlášení.
 */
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import QRCode from "qrcode";
import { PrismaClient } from "@prisma/client";
import { generateTotpSecret, hashPassword, totpUri } from "../src/lib/auth";

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = (arg("email") ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error("Použití: npm run admin:setup -- --email vas@email.cz");
    process.exit(1);
  }

  let password = process.env.ADMIN_PASSWORD ?? "";
  if (!password) {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    password = await rl.question("Nové heslo (min. 12 znaků): ");
    rl.close();
  }
  if (password.length < 12) {
    console.error("Heslo musí mít alespoň 12 znaků.");
    process.exit(1);
  }

  const secret = generateTotpSecret();
  const passwordHash = await hashPassword(password);

  // Jediný účet: ostatní smazat
  await prisma.$transaction([
    prisma.adminSession.deleteMany(),
    prisma.adminUser.deleteMany({ where: { email: { not: email } } }),
    prisma.adminUser.upsert({
      where: { email },
      update: { passwordHash, totpSecret: secret, failedAttempts: 0, lockedUntil: null },
      create: { email, passwordHash, totpSecret: secret },
    }),
  ]);

  const uri = totpUri(email, secret);
  console.log(`\nÚčet administrace: ${email}`);
  console.log("\nNaskenujte QR kód v aplikaci pro dvoufázové ověření:\n");
  console.log(await QRCode.toString(uri, { type: "terminal", small: true }));
  console.log(`Nebo zadejte klíč ručně: ${secret}\n`);
  console.log("Klíč i heslo předávejte jen oprávněným osobám bezpečným kanálem.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
