import AxeBuilder from "@axe-core/playwright";
import { devices, expect, test, type Page } from "@playwright/test";

/** WCAG 2.1 AA automated audit (axe-core) of the pages applicants and officers use most, at phone size. */
test.use({ ...devices["Pixel 5"], headless: true });

async function loginAs(page: Page, role: string, email?: string) {
  await page.context().clearCookies();
  await page.goto("/");
  await page.getByLabel("Desk / role").selectOption(role);
  if (email) await page.getByLabel("Account").selectOption(email);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForLoadState("networkidle");
}

async function audit(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
}

test("login page", async ({ page }) => {
  await page.goto("/");
  await audit(page);
});

for (const path of ["/applicant", "/applicant/schemes", "/applicant/apply/PRE_MATRIC", "/applicant/applications/NFST-2026-0001", "/applicant/whatsapp"]) {
  test(`applicant ${path}`, async ({ page }) => {
    await loginAs(page, "APPLICANT", "applicant@mota.demo");
    await page.goto(path);
    await audit(page);
  });
}

test("institution offline batch", async ({ page }) => {
  await loginAs(page, "INO", "ino@mota.demo");
  await page.goto("/ino/offline");
  await audit(page);
});

for (const path of ["/officer", "/officer/NFST-2026-0002", "/tower"]) {
  test(`officer ${path}`, async ({ page }) => {
    await loginAs(page, "MOTA");
    await page.goto(path);
    await audit(page);
  });
}
