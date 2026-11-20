import AxeBuilder from "@axe-core/playwright";
import { expect, type BrowserContext, type Page } from "@playwright/test";

/** True when the app under test talks to a real Supabase project. */
export const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export async function setElderMode(context: BrowserContext, baseURL: string, enabled: boolean) {
  await context.addCookies([{ name: "mn_elder", value: enabled ? "1" : "0", url: baseURL }]);
}

/** WCAG 2.2 AA via axe. Fails with a readable list of what is wrong and where. */
export async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
    .analyze();
  const summary = results.violations.map(
    (violation) => `${violation.id} (${violation.impact}): ${violation.help}\n  ${violation.nodes.map((node) => node.target.join(" ")).join("\n  ")}`,
  );
  expect(summary, summary.join("\n\n")).toEqual([]);
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "page scrolls horizontally").toBeLessThanOrEqual(0);
}
