import { defineConfig, devices } from "@playwright/test";

/**
 * E2E testy proti běžící aplikaci (GOPAY_MODE=mock, vývojová databáze).
 * Lokálně se použije nainstalovaný Microsoft Edge (bez stahování prohlížečů):
 *   npm run build && npm start   (v jiném terminálu)
 *   npm run test:e2e
 */
const channel = process.env.PW_CHANNEL ?? "msedge";

export default defineConfig({
  testDir: "tests-e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
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
