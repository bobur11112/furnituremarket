import { expect, test } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.skip(!adminEmail || !adminPassword, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD for the Supabase integration test.");

test("guest order appears in admin panel", async ({ page }) => {
  await page.goto("/catalog");
  await page.getByRole("link", { name: /view aster boucle lounge chair/i }).click();
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.getByRole("link", { name: /proceed to checkout/i }).click();

  await expect(page.getByRole("heading", { name: /secure order/i })).toBeVisible();
  await page.getByLabel("Full name").fill("Guest Customer");
  await page.getByLabel("Email").fill("guest@example.com");
  await page.getByLabel("Phone").fill("+998901112233");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Street address").fill("21 Gallery Avenue");
  await page.getByLabel("City").fill("Tashkent");
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page).toHaveURL(/\/catalog$/);

  await page.goto("/auth");
  await page.getByLabel("Email").fill(adminEmail!);
  await page.getByLabel("Password").fill(adminPassword!);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("heading", { name: "Marketplace control" })).toBeVisible();
  await expect(page.getByText("Guest Customer")).toBeVisible();
});
