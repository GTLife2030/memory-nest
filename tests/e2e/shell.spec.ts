import { expect, test } from "@playwright/test";
import { hasSupabase } from "./helpers";

test("landing page carries the core promise in Dutch", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "nl");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Je hoeft niets te schrijven. Vertel het gewoon.",
  );
  await expect(page.getByRole("link", { name: "Begin je nest" })).toBeVisible();
});

test("the demo-modus badge names the simulated services", async ({ page }) => {
  await page.goto("/");
  const badge = page.getByTestId("demo-badge");
  await expect(badge).toContainText("demo-modus");
  await expect(badge).toContainText("verhaalredacteur");
  await expect(badge).toContainText("betalen");
});

test("elder mode enlarges type and survives navigation", async ({ page }) => {
  await page.goto("/");
  const rootSize = () => page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
  expect(await rootSize()).toBe("18px");

  await page.getByRole("button", { name: "Grote letters aan" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-elder", "true");
  expect(await rootSize()).toBe("21px");
  await expect(page.getByRole("button", { name: "Grote letters uit" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.goto("/design");
  expect(await rootSize()).toBe("21px");
});

test("keyboard: skip link comes first and the dialog traps and returns focus", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "hardware keyboard flow");
  await page.goto("/design");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Ga naar de inhoud" })).toBeFocused();

  const open = page.getByRole("button", { name: "Open dialoog" });
  await open.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Dit verhaal in de kluis leggen?" });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();
});

test("a toast is announced and can be dismissed", async ({ page }) => {
  await page.goto("/design");
  await page.getByRole("button", { name: "Laat een melding zien" }).click();
  const toast = page.getByRole("region", { name: /Meldingen/ }).getByRole("listitem");
  await expect(toast).toContainText("Je verhaal is bewaard");
  await toast.getByRole("button", { name: "Sluiten" }).click();
  await expect(toast).toBeHidden();
});

test("the record button moves through its states without a time limit", async ({ page }) => {
  await page.goto("/design");
  const record = page.getByRole("button", { name: "Tik om te vertellen" });
  await expect(record).toHaveAttribute("aria-pressed", "false");
  await record.click();
  await expect(page.getByRole("button", { name: /Ik luister/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: /Ik luister/ }).click();
  await expect(page.getByRole("button", { name: /Gepauzeerd/ })).toBeVisible();
});

test("security headers are set and scripts need a nonce", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  const csp = headers["content-security-policy"] ?? "";
  expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
  expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
  expect(csp).not.toMatch(/script-src[^;]*unsafe-eval/);
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["strict-transport-security"]).toContain("max-age=");
  expect(headers["x-powered-by"]).toBeUndefined();

  const second = await request.get("/");
  expect(second.headers()["content-security-policy"]).not.toBe(csp);
});

test("no console errors or CSP violations on any screen", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(message.text());
  });
  page.on("pageerror", (error) => problems.push(error.message));
  for (const path of ["/", "/inloggen", "/design", "/offline"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }
  expect(problems).toEqual([]);
});

test("the app is installable: manifest, icons and service worker", async ({ page, request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("/nest");
  for (const icon of manifest.icons) {
    expect((await request.get(icon.src)).status(), icon.src).toBe(200);
  }
  await page.goto("/");
  const active = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return Boolean(registration.active);
  });
  expect(active).toBe(true);
});

test("offline: a page that cannot load falls back to the offline screen", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // now controlled by the service worker
  await context.setOffline(true);
  await page.goto("/design").catch(() => undefined);
  await expect(page.getByRole("heading", { name: "Je bent even niet verbonden" })).toBeVisible();
  await context.setOffline(false);
});

test.describe("without a database", () => {
  test.skip(hasSupabase, "only applies when Supabase is not configured");

  test("sign-in explains itself and offers the demo nest", async ({ page }) => {
    await page.goto("/inloggen");
    await expect(page.getByRole("heading", { name: "Inloggen staat nog uit" })).toBeVisible();
    await page.getByRole("link", { name: "Bekijk het voorbeeldnest" }).click();
    await expect(page).toHaveURL(/\/nest\/demo$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Het nest van Familie de Wit");
    await expect(page.getByText("Dit is een voorbeeldnest.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "De bakkerij van mijn vader" })).toBeVisible();
    await expect(page.getByText("Verzegeld tot 14 maart 2044")).toBeVisible();
  });

  test("any other nest address is closed", async ({ page }) => {
    await page.goto("/nest/3f0e7a52-1c7b-4a9e-9d0a-2f1f6d1c0a11");
    await expect(page).toHaveURL(/\/inloggen$/);
    await page.goto("/nest");
    await expect(page).toHaveURL(/\/inloggen$/);
  });
});
