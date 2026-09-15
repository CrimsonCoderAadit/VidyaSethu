import { expect, test, type Page } from "@playwright/test";

/**
 * A fast, on-screen smoke test of the whole Vidya Setu portal.
 *
 * Run it headed and watch: `npm run test:e2e`
 *
 * It logs in as every desk in turn (Applicant, Institution Officer, State/UT
 * Officer, MoTA Officer, Selection Committee, Finance, Administrator,
 * Auditor) and performs the real action each desk exists for, so you can see
 * how a file moves from one role to the next — with just enough of a pause
 * to follow along, not a slow-motion demo.
 */

const PAUSE = 150;

async function beat(page: Page, ms = PAUSE) {
  await page.waitForTimeout(ms);
}

/** Sign in as a given role. Signs out first if a session is already active. */
async function loginAs(page: Page, role: string, email?: string) {
  await page.goto("/");
  const goDashboard = page.getByRole("link", { name: "Go to dashboard" });
  if (await goDashboard.isVisible().catch(() => false)) {
    await goDashboard.click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL("**/");
  }
  await page.getByLabel("Desk / role").selectOption(role);
  if (email) await page.getByLabel("Account").selectOption(email);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForLoadState("networkidle");
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/");
}

test("Vidya Setu — full portal walkthrough, every desk", async ({ page }) => {
  test.setTimeout(2 * 60 * 1000);

  await test.step("Login page — role and account selection", async () => {
    await page.goto("/");
    await expect(page.getByText("Vidya Setu", { exact: true }).first()).toBeVisible();
    await page.getByLabel("Desk / role").selectOption("MOTA");
    await beat(page);
    await page.getByLabel("Desk / role").selectOption("APPLICANT");
    await beat(page);
  });

  await test.step("Applicant — dashboard, eligibility pre-check, scheme form, application tracker", async () => {
    await loginAs(page, "APPLICANT", "applicant@mota.demo");
    await expect(page.getByRole("heading", { name: "Your files", exact: true })).toBeVisible();
    await beat(page);

    await page.getByRole("link", { name: "Eligibility pre-check" }).click();
    await expect(page.getByRole("heading", { name: "Ask the rules before you file" })).toBeVisible();
    // Toggle one field and watch the eligibility panel react live.
    await page.getByLabel(/Scheduled Tribe status/).selectOption("true");
    await expect(page.getByRole("heading", { name: "Eligibility" })).toBeVisible();
    await beat(page);

    await page.getByRole("link", { name: "Apply for a scheme" }).click();
    await expect(page.getByRole("heading", { name: "Choose a scheme, not a score" })).toBeVisible();
    await beat(page);
    await page.getByRole("link", { name: "Open NFST form" }).click();
    await expect(page.getByRole("heading", { name: "National Fellowship for ST Students" })).toBeVisible();
    await expect(page.getByText("Documents required by this scheme version")).toBeVisible();
    await beat(page);

    // View an already-processed application to see the full status tracker.
    await page.getByRole("link", { name: "My applications" }).click();
    await page.getByRole("link", { name: /NFST-2026-0001/ }).click();
    await expect(page.getByRole("heading", { name: "NFST" })).toBeVisible();
    await beat(page);

    await logout(page);
  });

  await test.step("Institution Nodal Officer — verify and forward to MoTA", async () => {
    await loginAs(page, "INO", "ino@mota.demo");
    await expect(page.getByRole("heading", { name: "Institution verification" })).toBeVisible();
    const firstCard = page.locator("article").first();
    if (await firstCard.count()) {
      await firstCard.scrollIntoViewIfNeeded();
      await beat(page);
      await firstCard.getByRole("button", { name: "Verify and forward" }).click();
      await page.waitForLoadState("networkidle");
      await beat(page);
    }
    await logout(page);
  });

  await test.step("State / UT Nodal Officer — verify and recommend for DBT", async () => {
    await loginAs(page, "STATE", "state@mota.demo");
    await expect(page.getByRole("heading", { name: /State \/ UT queue/ })).toBeVisible();
    const firstCard = page.locator("article").first();
    if (await firstCard.count()) {
      await firstCard.scrollIntoViewIfNeeded();
      await beat(page);
      await firstCard.getByRole("button", { name: "Recommend for DBT" }).click();
      await page.waitForLoadState("networkidle");
      await beat(page);
    }
    await logout(page);
  });

  await test.step("MoTA Verification Officer — review queue, case decision, selection, policy, control tower", async () => {
    await loginAs(page, "MOTA", "officer@mota.demo");
    await expect(page.getByRole("heading", { name: "Which file needs a person?" })).toBeVisible();
    await beat(page);

    // Open the clean L0 case and approve it.
    await page.getByRole("link", { name: /NFST-2026-0001/ }).click();
    await expect(page.getByRole("heading", { name: "Meena Xaxa" })).toBeVisible();
    await page
      .getByRole("heading", { name: "Authorised decision" })
      .locator("..")
      .getByPlaceholder("Officer note (mandatory for the audit trail)")
      .fill("Evidence verified, eligibility clean. Sanctioning.");
    await beat(page);
    await page.getByRole("button", { name: "Approve" }).click();
    await page.waitForLoadState("networkidle");
    await beat(page);

    // Open a name-mismatch case and raise a deficiency instead.
    await page.getByRole("link", { name: "Review queue" }).click();
    await page.getByRole("link", { name: /NFST-2026-0003/ }).click();
    await expect(page.getByRole("heading", { name: "Somai Paharia" })).toBeVisible();
    await page
      .getByRole("heading", { name: "Raise deficiency" })
      .locator("..")
      .getByPlaceholder(/What is missing/)
      .fill("Name on the income certificate does not match the application. Please re-upload.");
    await beat(page);
    await page.getByRole("button", { name: "Issue deficiency" }).click();
    await page.waitForLoadState("networkidle");
    await beat(page);

    await page.getByRole("link", { name: "Selection runs" }).click();
    await expect(page.getByRole("heading", { name: "Scheme-specific selection" })).toBeVisible();
    await page.getByRole("button", { name: "Run NFST selection" }).click();
    await page.waitForLoadState("networkidle");
    await beat(page);

    await page.getByRole("link", { name: "Policy studio" }).click();
    await expect(page.getByRole("heading", { name: "Policy studio" })).toBeVisible();
    await page.locator('a[href^="/policy/"]').first().click();
    await beat(page);

    await page.getByRole("link", { name: "Control tower" }).click();
    await expect(page.getByRole("heading", { name: "Operations control tower" })).toBeVisible();
    await beat(page);

    await logout(page);
  });

  await test.step("Selection Committee — score a NOS dossier", async () => {
    await loginAs(page, "COMMITTEE", "committee@mota.demo");
    await expect(page.getByRole("heading", { name: "NOS dossiers" })).toBeVisible();
    const firstCard = page.locator("article").first();
    if (await firstCard.count()) {
      await firstCard.scrollIntoViewIfNeeded();
      await firstCard.getByPlaceholder("Score").fill("82");
      await firstCard.getByPlaceholder("Interview assessment").fill("Strong proposal, clear methodology. Recommended.");
      await beat(page);
      await firstCard.getByRole("button", { name: "Record assessment" }).click();
      await page.waitForLoadState("networkidle");
      await beat(page);
    }
    await logout(page);
  });

  await test.step("Finance Officer — sanctions & payments", async () => {
    await loginAs(page, "FINANCE", "finance@mota.demo");
    await expect(page.getByRole("heading", { name: "Sanctions & payments" })).toBeVisible();
    await beat(page);
    const ackButton = page.getByRole("button", { name: "Mark PFMS/Mission acknowledgement" }).first();
    if (await ackButton.count()) {
      await ackButton.click();
      await page.waitForLoadState("networkidle");
      await beat(page);
    }
    await logout(page);
  });

  await test.step("System Administrator — the only thing admin can do: create an account", async () => {
    await loginAs(page, "ADMIN", "admin@mota.demo");
    await expect(page.getByRole("heading", { name: "Manage accounts" })).toBeVisible();

    const stamp = Date.now().toString(36);
    await page.getByLabel("Full name").fill("Demo Walkthrough Officer");
    await page.getByLabel("Email").fill(`walkthrough.${stamp}@mota.demo`);
    await page.getByLabel("Role").selectOption("AUDITOR");
    await beat(page);
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(`walkthrough.${stamp}@mota.demo`)).toBeVisible();
    await beat(page);

    await logout(page);
  });

  await test.step("Auditor — read-only audit trail and control tower", async () => {
    await loginAs(page, "AUDITOR", "auditor@mota.demo");
    await expect(page.getByRole("heading", { name: "Audit trail" })).toBeVisible();
    await beat(page);
    await page.getByRole("link", { name: "Control tower" }).click();
    await expect(page.getByRole("heading", { name: "Operations control tower" })).toBeVisible();
    await beat(page);
    await logout(page);
  });

  await test.step("Reset demo data for the next run", async () => {
    await page.goto("/");
    await page.getByRole("button", { name: "Reset demo data" }).click();
    await page.waitForLoadState("networkidle");
  });
});
