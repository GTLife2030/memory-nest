import { expect, test } from "@playwright/test";
import {
  expectNoA11yViolations,
  expectNoHorizontalScroll,
  hasSupabase,
  setElderMode,
} from "./helpers";

// Every screen of the clickable mock-up: each flow step has its own address (?stap=).
const steps = (flow: string, count: number) =>
  Array.from({ length: count }, (_, i) => ({
    name: `mock-up ${flow} step ${i + 1}`,
    path: `/voorbeeld/${flow}?stap=${i + 1}`,
  }));
const mockup = [
  { name: "mock-up map", path: "/voorbeeld" },
  ...steps("onboarding", 7),
  ...steps("cadeau", 3),
  ...steps("vraag", 4),
  ...steps("foto", 3),
  ...steps("verhaal", 5),
  { name: "mock-up nest home", path: "/voorbeeld/nest" },
  { name: "mock-up stories", path: "/voorbeeld/nest/verhalen" },
  { name: "mock-up story", path: "/voorbeeld/nest/verhalen/bakkerij" },
  { name: "mock-up timeline decades", path: "/voorbeeld/nest/tijdlijn" },
  { name: "mock-up timeline months", path: "/voorbeeld/nest/tijdlijn?zoom=month" },
  { name: "mock-up people", path: "/voorbeeld/nest/personen" },
  { name: "mock-up chapters", path: "/voorbeeld/nest/hoofdstukken" },
  { name: "mock-up search results", path: "/voorbeeld/nest/zoeken?q=bakkerij" },
];

// Every screen, in normal and in elder mode.
const routes = [
  { name: "landing", path: "/" },
  { name: "sign in", path: "/inloggen" },
  { name: "link sent", path: "/inloggen/verstuurd?e=truus%40voorbeeld.nl" },
  { name: "design gallery", path: "/design" },
  { name: "offline", path: "/offline" },
  { name: "not found", path: "/deze-pagina-bestaat-niet" },
  ...(hasSupabase ? [] : [{ name: "demo nest", path: "/nest/demo" }, ...mockup]),
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
      const sizes = await page
        .locator("main button, main a[class*='rounded-pill'], header button")
        .evaluateAll((nodes) =>
          nodes.map((node) => ({
            text: node.textContent?.trim().slice(0, 30),
            height: node.getBoundingClientRect().height,
          })),
        );
      expect(sizes.length).toBeGreaterThan(8);
      for (const size of sizes) {
        expect(size.height, `"${size.text}" is ${size.height}px high`).toBeGreaterThanOrEqual(
          minimum - 0.5,
        );
      }
    });
  });
}
