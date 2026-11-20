import { expect, test } from "@playwright/test";
import { expectNoA11yViolations, expectNoHorizontalScroll, hasSupabase, setElderMode } from "./helpers";

// Every screen of phase 0, in normal and in elder mode.
const routes = [
  { name: "landing", path: "/" },
  { name: "sign in", path: "/inloggen" },
  { name: "link sent", path: "/inloggen/verstuurd?e=truus%40voorbeeld.nl" },
  { name: "design gallery", path: "/design" },
  { name: "offline", path: "/offline" },
  { name: "not found", path: "/deze-pagina-bestaat-niet" },
  ...(hasSupabase ? [] : [{ name: "demo nest", path: "/nest/demo" }]),
];

for (const elder of [false, true]) {
  test.describe(elder ? "elder mode" : "normal mode", () => {
    test.beforeEach(async ({ context, baseURL }) => {
      await setElderMode(context, baseURL!, elder);
    });

    for (const route of routes) {
      test(`${route.name} is accessible and fits the screen`, async ({ page }) => {
        await page.goto(route.path);
        await expect(page.locator("h1")).toHaveCount(1);
        await expect(page.locator("html")).toHaveAttribute("data-elder", String(elder));
        await expectNoA11yViolations(page);
        await expectNoHorizontalScroll(page);
      });
    }

    test("the gallery stays accessible with a dialog open", async ({ page }) => {
      await page.goto("/design");
      await page.getByRole("button", { name: "Open dialoog" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expectNoA11yViolations(page);
    });

    test("interactive targets are large enough", async ({ page }) => {
      await page.goto("/design");
      const minimum = elder ? 56 : 44;
      const sizes = await page.locator("main button, main a[class*='rounded-pill'], header button").evaluateAll((nodes) =>
        nodes.map((node) => ({ text: node.textContent?.trim().slice(0, 30), height: node.getBoundingClientRect().height })),
      );
      expect(sizes.length).toBeGreaterThan(8);
      for (const size of sizes) {
        expect(size.height, `"${size.text}" is ${size.height}px high`).toBeGreaterThanOrEqual(minimum - 0.5);
      }
    });
  });
}
