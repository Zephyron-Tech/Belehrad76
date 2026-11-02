import { execSync } from "node:child_process";

/**
 * Před testy aplikuje migrace na testovací databázi (nedestruktivně).
 * Testy si data v tabulkách mažou samy (tests/helpers.ts → resetDb).
 */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://eshop@localhost:5544/eshop_test";
  if (!/\/eshop_test(\?|$)/.test(url)) {
    throw new Error(`Testy smí běžet jen proti testovací databázi eshop_test, ne: ${url}`);
  }
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
}
