import { devices, expect, test, type Page } from "@playwright/test";

/**
 * Field realities for ST applicants and remote institutions, at phone size:
 * mobile layout, regional language, DigiLocker, OCR-failure recovery, WhatsApp bot,
 * offline nodal verification, and predictive fund runway.
 */
test.use({ ...devices["Pixel 5"], headless: true });

async function loginAs(page: Page, role: string, email?: string) {
  await page.context().clearCookies();
  await page.goto("/");
  await page.getByLabel("Desk / role").selectOption(role);
  if (email) await page.getByLabel("Account").selectOption(email);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForLoadState("networkidle");
}

test.beforeAll(async ({ request }) => {
  // Fresh seeded data for a deterministic run.
  await request.get("/");
});

test("phone layout: bottom tab bar, no sidebar, no horizontal scroll", async ({ page }) => {
  await loginAs(page, "APPLICANT", "applicant@mota.demo");
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(page.locator("aside")).toBeHidden();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.locator("html")).toHaveAttribute("data-lite", "");
});

test("regional language: Hindi UI and html lang", async ({ page }) => {
  await loginAs(page, "APPLICANT", "applicant@mota.demo");
  await page.getByRole("combobox", { name: "Language" }).first().selectOption("hi");
  await expect(page.getByRole("heading", { name: "आपके आवेदन", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await page.getByRole("combobox", { name: "Language" }).first().selectOption("en");
  await expect(page.getByRole("heading", { name: "Your files", exact: true })).toBeVisible();
});

test("DigiLocker + OCR failure: unreadable photo auto-returns to applicant, one-tap DigiLocker fixes it", async ({ page }) => {
  await loginAs(page, "APPLICANT", "applicant@mota.demo");
  await page.goto("/applicant/apply/PRE_MATRIC");
  await page.getByLabel(/^Full name/).fill("Meena Xaxa");
  await page.getByLabel(/^Date of birth/).fill("2011-02-03");
  await page.getByLabel(/^Gender/).selectOption("FEMALE");
  await page.getByLabel(/^Mobile/).fill("9876543210");
  await page.getByLabel(/^Scheduled Tribe status/).selectOption("true");
  await page.getByLabel(/^Domicile State/).selectOption("JH");
  await page.getByLabel(/^Family income/).fill("180000");
  await page.getByLabel(/^Class \*/).selectOption("IX");
  await page.getByLabel(/^Application type/).selectOption("FRESH");

  // Link DigiLocker (consent + OTP), then untick the income certificate and mark its photo crumpled.
  await page.getByRole("button", { name: "Connect DigiLocker" }).click();
  await page.getByRole("button", { name: "Allow" }).click();
  await expect(page.getByText("DigiLocker linked.")).toBeVisible();
  const incomeRow = page.locator("li", { hasText: "Income certificate" });
  await incomeRow.getByRole("checkbox").uncheck();
  await incomeRow.getByRole("combobox").selectOption("CRUMPLED");
  await page.getByRole("button", { name: "Submit application" }).click();

  await page.waitForURL(/\/applicant\/applications\//);
  await expect(page.getByRole("heading", { name: "Document recovery" })).toBeVisible();
  await page.getByRole("button", { name: "Fetch from DigiLocker" }).click();
  await expect(page.getByRole("heading", { name: "Document recovery" })).toBeHidden();
  await expect(page.getByText("DigiLocker · issuer-signed · trust A").first()).toBeVisible();
});

test("WhatsApp bot: status by registered mobile, privacy for others, webhook API", async ({ page, request }) => {
  await loginAs(page, "APPLICANT", "applicant@mota.demo");
  await page.goto("/applicant/whatsapp");
  await page.getByRole("button", { name: "LANG EN" }).click();
  await expect(page.getByText("Language set to English.")).toBeVisible();
  await page.getByPlaceholder("Message").fill("NFST-2026-0001");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/Stage: MoTA scrutiny/i).last()).toBeVisible();

  // Someone else's application ID from Meena's phone → privacy refusal.
  const other = await request.post("/api/whatsapp", { data: { from: "+91 98765 43210", text: "NFST-2026-0003" } });
  expect((await other.json()).reply).toContain("only sent to its registered mobile");
  // Twilio-style SMS → TwiML.
  const sms = await request.post("/api/whatsapp", { form: { From: "+919123456780", Body: "STATUS" } });
  expect(await sms.text()).toContain("<Response><Message>");
});

test("offline nodal verification: download, verify with no network, auto-sync on reconnect", async ({ page, context }) => {
  await loginAs(page, "INO", "ino@mota.demo");
  await page.goto("/ino/offline");
  await page.getByRole("button", { name: /Download batch|Refresh batch/ }).click();
  const card = page.locator("article").first();
  await expect(card).toBeVisible();

  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(page.getByText("Offline: decisions are saved on this device")).toBeVisible();
  await card.getByRole("button", { name: "Verify" }).click();
  await expect(card.getByText("Verified · pending sync")).toBeVisible();

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(page.getByText("Last sync")).toBeVisible();
  await expect(page.getByText("applied").first()).toBeVisible();
});

test("control tower: predictive fund runway", async ({ page }) => {
  await loginAs(page, "MOTA");
  await page.goto("/tower");
  await expect(page.getByRole("heading", { name: /Predictive fund runway/ })).toBeVisible();
  await expect(page.getByText("Shortfall").first()).toBeVisible();
  await expect(page.getByText("Runs out").first()).toBeVisible();
});
