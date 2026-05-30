import { expect, test } from "@playwright/test";

test("add product to cart and reach checkout", async ({ page }) => {
  await page.goto("/auth");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.goto("/catalog");
  await page.getByRole("link", { name: /view aster boucle lounge chair/i }).click();
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.getByRole("link", { name: /proceed to checkout/i }).click();

  await expect(page.getByRole("heading", { name: /secure order/i })).toBeVisible();
});
