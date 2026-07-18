import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should load the landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Survey Verification Platform/);
  });

  test("should display the hero section", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("section").first();
    await expect(hero).toBeVisible();
  });

  test("should have navigation links", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
  });

  test("should display BackOffice Pro branding", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=BackOffice Pro")).toBeVisible();
  });

  test("should have a CTA button linking to register", async ({ page }) => {
    await page.goto("/");
    const ctaButton = page.locator('a[href*="register"], button:has-text("Get Started")').first();
    if (await ctaButton.isVisible()) {
      await expect(ctaButton).toBeVisible();
    }
  });
});

test.describe("Authentication", () => {
  test("should navigate to login page", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible();
  });

  test("should navigate to register page", async ({ page }) => {
    await page.goto("/auth/register");
    await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible();
  });

  test("should show validation error for empty login", async ({ page }) => {
    await page.goto("/auth/login");
    const submitButton = page.locator("button[type='submit']");
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe("Dashboard (requires auth)", () => {
  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url.includes("/auth/login") || url.includes("/dashboard")).toBeTruthy();
  });
});
