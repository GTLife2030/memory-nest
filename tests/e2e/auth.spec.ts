import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { hasSupabase } from "./helpers";

/**
 * Acceptance A1: sign in with a magic link and land in your own nest; another family's nest
 * stays closed. Runs only against a real Supabase project (CI, or locally with .env.local).
 * The link is generated through the admin API so no mailbox is needed.
 */
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
test.skip(
  !hasSupabase || !serviceKey,
  "needs NEXT_PUBLIC_SUPABASE_URL, anon key and SUPABASE_SERVICE_ROLE_KEY",
);
test.describe.configure({ mode: "serial" });

const stamp = Date.now();
const emails = { truus: `e2e-truus-${stamp}@example.test`, eva: `e2e-eva-${stamp}@example.test` };
const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey!, {
    auth: { persistSession: false },
  });

async function magicLinkPath(email: string): Promise<string> {
  const { data, error } = await admin().auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties) throw new Error(`could not create link: ${error?.message}`);
  return `/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink&next=/nest`;
}

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

let truusNest = "";

test("requesting a link shows the check-your-mail screen", async ({ page }) => {
  await page.goto("/inloggen");
  await page.getByLabel("E-mailadres").fill(emails.truus);
  await page.getByRole("button", { name: "Stuur mij een inloglink" }).click();
  await expect(page.getByRole("heading", { name: "Kijk in je mail" })).toBeVisible();
  await expect(page.getByText(emails.truus)).toBeVisible();
});

test("an invalid address gets a kind, specific message", async ({ page }) => {
  await page.goto("/inloggen");
  await page.getByLabel("E-mailadres").fill("truus-zonder-apenstaartje");
  await page.getByRole("button", { name: "Stuur mij een inloglink" }).click();
  await expect(page.getByRole("alert")).toContainText("Dit lijkt geen e-mailadres");
});

test("the magic link signs in and opens a first, empty nest", async ({ page }) => {
  await page.goto(await magicLinkPath(emails.truus));
  await expect(page).toHaveURL(/\/nest\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Het nest van Ons nest");
  await expect(page.getByText("Jouw rol: Beheerder")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hier komen jullie verhalen" })).toBeVisible();
  truusNest = new URL(page.url()).pathname;

  await page.goto("/nest");
  await expect(page, "a second visit reuses the same nest").toHaveURL(new RegExp(`${truusNest}$`));
});

test("a used or broken link asks for a new one", async ({ page }) => {
  await page.goto("/auth/confirm?token_hash=not-a-real-token&type=magiclink");
  await expect(page).toHaveURL(/\/inloggen\?fout=link$/);
  await expect(page.getByRole("alert")).toContainText("Deze inloglink werkt niet meer");
});

test("someone from another family cannot open this nest", async ({ page }) => {
  await page.goto(await magicLinkPath(emails.eva));
  await expect(page).toHaveURL(/\/nest\/[0-9a-f-]{36}$/);
  expect(new URL(page.url()).pathname).not.toBe(truusNest);

  const response = await page.goto(truusNest);
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Deze pagina bestaat niet" })).toBeVisible();
});

test("signed out, the nest is closed again", async ({ page }) => {
  await page.goto(await magicLinkPath(emails.truus));
  await page.getByRole("button", { name: "Uitloggen" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto(truusNest);
  await expect(page).toHaveURL(/\/inloggen\?next=/);
});
