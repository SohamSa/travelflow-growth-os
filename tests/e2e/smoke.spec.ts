import { expect, test } from "@playwright/test";

test.describe("TravelFlow Growth OS smoke", () => {
  test("dashboard loads with KPIs", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /growth dashboard/i })).toBeVisible();
    await expect(page.getByText(/Demo Workspace/i).first()).toBeVisible();
    await expect(page.getByText(/Total leads/i).first()).toBeVisible();
  });

  test("inquiry can be submitted and lead opened", async ({ page }) => {
    const stamp = Date.now();
    await page.goto("/inquiry");
    await page.getByLabel(/full name/i).fill(`E2E Traveler ${stamp}`);
    await page.getByLabel(/^email/i).fill(`e2e.${stamp}@example.com`);
    await page.getByLabel(/phone/i).fill("+1-555-444-5555");
    await page.locator('select[name="preferredDestination"]').selectOption("Greece");
    await page.locator('input[name="travelStartDate"]').fill("2026-11-01");
    await page.locator('input[name="travelEndDate"]').fill("2026-11-08");
    await page.locator('input[name="travelerCount"]').fill("2");
    await page.locator('input[name="estimatedBudget"]').fill("7000");
    await page.locator('select[name="tripType"]').selectOption("ROMANTIC");
    await page.locator('select[name="preferredContactMethod"]').selectOption("EMAIL");
    await page.locator('select[name="marketingSource"]').selectOption("INSTAGRAM");
    await page.locator('input[name="interests"]').first().check();
    await page.locator('input[name="consent"]').check();
    await page.getByRole("button", { name: /submit inquiry/i }).click();

    await expect(page.getByRole("heading", { name: /inquiry received/i })).toBeVisible({
      timeout: 15000,
    });
    const leadLink = page.getByRole("link", { name: /view lead profile/i });
    await expect(leadLink).toBeVisible();
    await leadLink.click();
    await expect(
      page.getByRole("heading", { level: 1, name: new RegExp(`E2E Traveler ${stamp}`, "i") }),
    ).toBeVisible();
  });

  test("campaigns and reports pages load", async ({ page }) => {
    await page.goto("/campaigns");
    await expect(page.getByRole("heading", { name: "Campaign Performance" })).toBeVisible();
    await page.goto("/reports");
    await expect(page.getByRole("heading", { name: /executive reports/i })).toBeVisible();
  });

  test("copilot fallback returns a draft on Maya lead if present", async ({ page }) => {
    await page.goto("/leads?search=Maya+Patel");
    const mayaLink = page.getByRole("link", { name: /Maya Patel/i }).first();
    await expect(mayaLink).toBeVisible({ timeout: 10000 });
    await mayaLink.click();
    await expect(page.getByRole("heading", { name: /AI Copilot/i })).toBeVisible();
    await page.getByRole("button", { name: "Generate draft" }).click();
    await expect(page.getByText(/Draft for employee review/i).first()).toBeVisible({
      timeout: 15000,
    });
    const draft = page.getByPlaceholder(/Generated draft will appear here/i);
    await expect(draft).toContainText(/Maya/i, { timeout: 15000 });
  });
});
