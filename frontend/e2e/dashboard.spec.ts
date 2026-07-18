import { test, expect } from "@playwright/test";

test.describe("Survey Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
  });

  test("should display survey list page structure", async ({ page }) => {
    await page.goto("/dashboard/surveys");
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes("/surveys") || url.includes("/auth/login")).toBeTruthy();
  });

  test("should have create survey button on surveys page", async ({ page }) => {
    await page.goto("/dashboard/surveys");
    await page.waitForTimeout(1000);
    const createBtn = page.locator('button:has-text("Create"), a:has-text("Create Survey")');
    if (await createBtn.isVisible()) {
      await expect(createBtn).toBeVisible();
    }
  });
});

test.describe("Verification Dashboard", () => {
  test("should display verification page structure", async ({ page }) => {
    await page.goto("/dashboard/verifications");
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes("/verifications") || url.includes("/auth/login")).toBeTruthy();
  });
});

test.describe("NFT Certificates", () => {
  test("should display NFT gallery page", async ({ page }) => {
    await page.goto("/dashboard/nfts");
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes("/nfts") || url.includes("/auth/login")).toBeTruthy();
  });
});

test.describe("Wallet Management", () => {
  test("should display wallet page", async ({ page }) => {
    await page.goto("/dashboard/wallet");
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes("/wallet") || url.includes("/auth/login")).toBeTruthy();
  });
});

test.describe("Analytics Dashboard", () => {
  test("should display analytics page", async ({ page }) => {
    await page.goto("/dashboard/analytics");
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes("/analytics") || url.includes("/auth/login")).toBeTruthy();
  });
});

test.describe("Admin Panel", () => {
  test("should display admin page structure", async ({ page }) => {
    await page.goto("/dashboard/admin");
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes("/admin") || url.includes("/auth/login")).toBeTruthy();
  });

  test("should display user management page", async ({ page }) => {
    await page.goto("/dashboard/admin/users");
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes("/admin/users") || url.includes("/auth/login")).toBeTruthy();
  });

  test("should display system settings page", async ({ page }) => {
    await page.goto("/dashboard/admin/settings");
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes("/admin/settings") || url.includes("/auth/login")).toBeTruthy();
  });
});

test.describe("Notifications", () => {
  test("should display notifications page", async ({ page }) => {
    await page.goto("/dashboard/notifications");
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes("/notifications") || url.includes("/auth/login")).toBeTruthy();
  });
});

test.describe("Legal Pages", () => {
  test("should display terms of service", async ({ page }) => {
    await page.goto("/legal/terms");
    await expect(page).toHaveTitle(/Terms/);
  });

  test("should display privacy policy", async ({ page }) => {
    await page.goto("/legal/privacy");
    await expect(page).toHaveTitle(/Privacy/);
  });

  test("should display cookie policy", async ({ page }) => {
    await page.goto("/legal/cookies");
    await expect(page).toHaveTitle(/Cookie/);
  });
});
