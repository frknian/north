import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // The first-run guide dialog would otherwise cover the page.
  await page.addInitScript(() => window.localStorage.setItem("planorth_tour_completed_v2", "1"));
});

test("landing page explains the product and links to login", async ({ page }) => {
  await page.goto("/welcome");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Daha az karar");
  await expect(page.getByRole("link", { name: /Hemen başla/ }).first()).toHaveAttribute("href", "/login");
});

test("support page shows FAQ and the contact form", async ({ page }) => {
  await page.goto("/support");
  await page.getByText("Verilerimi nasıl indirebilirim?").click();
  await expect(page.getByText("JSON kopyasını indirebilir")).toBeVisible();
  await expect(page.getByRole("button", { name: "Gönder" })).toBeDisabled();
});

test("robots and sitemap are served", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain("Sitemap:");
  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain("/welcome");
});

test("a pasted text outline becomes a roadmap preview", async ({ page }) => {
  await page.goto("/roadmap");
  await page.getByRole("tab", { name: /Dosya veya metin/ }).click();
  await page.getByPlaceholder(/Hafta 1: Temeller/).fill("# Plan\nHafta 1: Temeller\n- Pazartesi: Oku (45 dk)\nHafta 2: Pratik\n- Cuma: Uygula (60 dk)");
  await page.getByRole("button", { name: "Oku ve önizle" }).click();
  await expect(page.getByRole("heading", { name: "Plan" })).toBeVisible();
  await expect(page.getByText("Hafta 2 · Pratik")).toBeVisible();
  await page.getByRole("button", { name: /Bu planı kullan/ }).click();
  await expect(page.getByText("0 / 2 görev")).toBeVisible();
});

test("main screen keeps working on the current viewport", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#north-content")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
