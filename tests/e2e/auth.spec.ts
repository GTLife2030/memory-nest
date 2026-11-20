import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import { hasSupabase } from "./helpers";

/**
 * Acceptance A1 (adapted in ADR-010): sign in with e-mail address and password and land in your
 * own nest; another family's nest stays closed. Runs only against a real Supabase project (CI
 * secrets or .env.local). Test accounts are created through the admin API and removed afterwards.
 */
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
test.skip(
  !hasSupabase || !serviceKey,
  "needs NEXT_PUBLIC_SUPABASE_URL, anon key and SUPABASE_SERVICE_ROLE_KEY",
);
test.describe.configure({ mode: "serial" });

const stamp = Date.now();
const password = `Nest-${stamp}-Truus!`;
const emails = { truus: `e2e-truus-${stamp}@example.test`, eva: `e2e-eva-${stamp}@example.test` };
const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey!, {
    auth: { persistSession: false },
  });

test.beforeAll(async () => {
  for (const email of Object.values(emails)) {
    const { error } = await admin().auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw new Error(`could not create test user: ${error.message}`);
  }
});

test.afterAll(async () => {
  const client = admin();
  const { data } = await client.auth.admin.listUsers({ perPage: 200 });
  for (const user of data?.users ?? []) {
    if (Object.values(emails).includes(user.email ?? "")) {
      const { data: owned } = await client
        .from("memberships")
        .select("family_id")
        .eq("user_id", user.id);
      for (const row of owned ?? []) await client.from("families").delete().eq("id", row.family_id);
      await client.auth.admin.deleteUser(user.id);
    }
  }
});

async function signIn(page: Page, email: string, pass = password) {
  await page.goto("/inloggen");
  await page.getByLabel("E-mailadres").fill(email);
  await page.getByLabel("Wachtwoord").fill(pass);
  await page.getByRole("button", { name: "Inloggen", exact: true }).click();
}

let truusNest = "";

test("a wrong password and an unknown address get the same kind message", async ({ page }) => {
  await signIn(page, emails.truus, "niet-het-wachtwoord");
  const alert = page.getByRole("alert").filter({ hasText: "horen niet bij elkaar" });
  await expect(alert).toBeVisible();
  await signIn(page, `bestaat-niet-${stamp}@example.test`);
  await expect(alert).toBeVisible();
});

test("an invalid address or empty password is explained", async ({ page }) => {
  await signIn(page, "truus-zonder-apenstaartje");
  await expect(
    page.getByRole("alert").filter({ hasText: "Dit lijkt geen e-mailadres" }),
  ).toBeVisible();
  await signIn(page, emails.truus, "");
  await expect(
    page.getByRole("alert").filter({ hasText: "Vul ook je wachtwoord in" }),
  ).toBeVisible();
});

test("signing in opens a first, empty nest", async ({ page }) => {
  await signIn(page, emails.truus);
  await expect(page).toHaveURL(/\/nest\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Het nest van Ons nest");
  await expect(page.getByText("Jouw rol: Beheerder")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hier komen jullie verhalen" })).toBeVisible();
  truusNest = new URL(page.url()).pathname;

  await page.goto("/nest");
  await expect(page, "a second visit reuses the same nest").toHaveURL(new RegExp(`${truusNest}$`));
});

test("signed in, the mock-up is open and sign-in returns to where you were going", async ({
  page,
}) => {
  await page.goto("/voorbeeld/onboarding");
  await expect(page).toHaveURL(/\/inloggen\?next=/);
  await page.getByLabel("E-mailadres").fill(emails.truus);
  await page.getByLabel("Wachtwoord").fill(password);
  await page.getByRole("button", { name: "Inloggen", exact: true }).click();
  await expect(page).toHaveURL(/\/voorbeeld\/onboarding$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Voor wie is dit nest?");
});

test("someone from another family cannot open this nest", async ({ page }) => {
  await signIn(page, emails.eva);
  await expect(page).toHaveURL(/\/nest\/[0-9a-f-]{36}$/);
  expect(new URL(page.url()).pathname).not.toBe(truusNest);

  const response = await page.goto(truusNest);
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Deze pagina bestaat niet" })).toBeVisible();
});

test("signed out, the nest is closed again", async ({ page }) => {
  await signIn(page, emails.truus);
  await expect(page).toHaveURL(/\/nest\//);
  await page.getByRole("button", { name: "Uitloggen" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto(truusNest);
  await expect(page).toHaveURL(/\/inloggen\?next=/);
});
