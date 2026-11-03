import { expect, test } from "@playwright/test";

test("mobil: bez vodorovného posouvání, menu a hlavní stránky", async ({ page, context }) => {
  const url = process.env.E2E_BASE_URL ?? "http://localhost:3000";
  await context.addCookies([
    { name: "age_verified", value: "1", url },
    { name: "cookie_consent", value: "v1:a0:m0", url },
  ]);
  for (const path of ["/", "/eshop", "/produkt/antonin-panenka", "/pokladna", "/obchodni-podminky"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `vodorovné přetečení na ${path}`).toBeLessThanOrEqual(1);
  }
  await page.goto("/");
  await page.getByText("Menu").click();
  await expect(page.getByRole("link", { name: "E-shop" }).last()).toBeVisible();
});
