import { expect, test } from "@playwright/test";

test("mobil: bez vodorovného posouvání, menu a hlavní stránky", async ({ page, context }) => {
  await context.addCookies([
    { name: "age_verified", value: "1", url: "http://localhost:3000" },
    { name: "cookie_consent", value: "v1:a0:m0", url: "http://localhost:3000" },
  ]);
  for (const path of ["/", "/eshop", "/produkt/box-mistri-evropy", "/pokladna", "/obchodni-podminky"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `vodorovné přetečení na ${path}`).toBeLessThanOrEqual(1);
  }
  await page.goto("/");
  await page.getByText("Menu").click();
  await expect(page.getByRole("link", { name: "E-shop" }).last()).toBeVisible();
});
