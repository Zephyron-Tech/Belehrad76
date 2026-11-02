import { defineConfig, devices } from "@playwright/test";

/**
 * E2E testy proti běžící aplikaci (GOPAY_MODE=mock, vývojová databáze).
 * Lokálně se použije nainstalovaný Microsoft Edge (bez stahování prohlížečů):
 *   npm run build && npm start   (v jiném terminálu)
 *   npm run test:e2e
 */
const channel = process.env.PW_CHANNEL ?? "msedge";
// Vývojová verze za heslem (DEV_BASIC_AUTH): E2E_HTTP_CREDENTIALS="jmeno:heslo"
const [httpUser, httpPass] = (process.env.E2E_HTTP_CREDENTIALS ?? "").split(":");
const httpCredentials = httpUser && httpPass ? { username: httpUser, password: httpPass } : undefined;

export default defineConfig({
  testDir: "tests-e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    httpCredentials,
    locale: "cs-CZ",
    timezoneId: "Europe/Prague",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Edge"], channel }, testIgnore: /mobile\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"], channel, browserName: "chromium" }, testMatch: /mobile\.spec\.ts/ },
  ],
});
