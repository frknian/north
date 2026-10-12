import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // The first-run guide dialog would otherwise cover the page.
  await page.addInitScript(() => window.localStorage.setItem("planorth_tour_completed_v3", "1"));
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

test("weekly plan: a task can be created from the dialog and the replan dialog opens", async ({ page }) => {
  await page.goto("/week");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Haftalık Plan");
  await page.getByRole("button", { name: /Görev Ekle/ }).first().click();
  await page.getByPlaceholder(/.+/).first().waitFor();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Yeni Görev Ekle");
  await dialog.locator("input").first().fill("E2E test görevi");
  await dialog.getByRole("button", { name: /Kaydet|Ekle|Oluştur/ }).last().click();
  await expect(page.getByText("E2E test görevi").first()).toBeVisible();
  await page.getByRole("button", { name: /Haftayı Planla/ }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("settings are grouped and switch sections", async ({ page }) => {
  await page.goto("/profile");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ayarlar");
  for (const name of ["Profil ve hedef", "Hesap ve güvenlik", "Bildirimler", "Koç hafızası ve sohbet", "Kullanım hakların", "Veri ve gizlilik", "Uygulamayı yükle", "Destek"]) {
    await expect(page.getByRole("button", { name })).toBeVisible();
  }
  await page.getByRole("button", { name: "Bildirimler" }).click();
  await expect(page.getByText("Günlük hatırlatıcı")).toBeVisible();
  await page.getByRole("button", { name: "Uygulamayı yükle" }).click();
  await expect(page.getByRole("heading", { name: /Uygulamayı yükle/ })).toBeVisible();
});

test("friends page explains that an account is needed in local mode", async ({ page }) => {
  await page.goto("/friends");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Arkadaşlar");
  await expect(page.getByText("Giriş gerekiyor")).toBeVisible();
});

test("calendar renders with its export action", async ({ page }) => {
  await page.goto("/calendar");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Takvim");
  await expect(page.getByRole("button", { name: /Takvime aktar/ })).toBeVisible();
  await page.getByRole("button", { name: /Blok Ekle|Görev Planla/ }).first().isVisible();
});

test("free focus session screen loads its timer", async ({ page }) => {
  await page.goto("/focus/free");
  await expect(page.locator("main.focus-stitch")).toBeVisible();
  await expect(page.getByText(/\d{1,2}:\d{2}/).first()).toBeVisible();
});

test("resources hub shows its tabs", async ({ page }) => {
  await page.goto("/resources");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kaynaklar");
  await expect(page.getByRole("button", { name: /Kitaplık/ }).first()).toBeVisible();
});

test("first-run tour introduces the current features", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.removeItem("planorth_tour_completed_v3"));
  await page.goto("/");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Planorth'a Hoş Geldin!");
  const next = dialog.getByRole("button", { name: /Sonraki/ });
  for (let i = 0; i < 3; i++) await next.click();
  await expect(dialog).toContainText("Koç yol haritanı yazsın");
  for (let i = 0; i < 7; i++) await next.click();
  await expect(dialog).toContainText("arkadaşlarınla birlikte çalış");
  await next.click();
  await expect(dialog).toContainText("Hesabını, verilerini ve bildirimlerini yönet");
  await dialog.getByRole("button", { name: /Anladım, Başla/ }).click();
  await expect(dialog).toBeHidden();
});

test("together page asks for an account in local mode", async ({ page }) => {
  await page.goto("/together");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Birlikte odak");
  await expect(page.getByText("Giriş gerekiyor")).toBeVisible();
});

test("landing page lists the shared focus feature", async ({ page }) => {
  await page.goto("/welcome");
  await expect(page.getByRole("heading", { name: "Arkadaşlar ve birlikte odak" })).toBeVisible();
});
