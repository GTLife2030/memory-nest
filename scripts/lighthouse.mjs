// Lighthouse accessibility gate (acceptance: score >= 95) for the public and demo screens.
// Usage: app running on :3100, then `node scripts/lighthouse.mjs`.
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";
import { chromium } from "@playwright/test";

const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
const paths = [
  "/",
  "/inloggen",
  "/design",
  ...(process.env.NEXT_PUBLIC_SUPABASE_URL ? [] : ["/nest/demo"]),
];
const MINIMUM = 95;

const chrome = await launch({
  chromePath: process.env.CHROME_PATH ?? chromium.executablePath(),
  chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
});
let failed = false;
try {
  for (const path of paths) {
    const result = await lighthouse(base + path, {
      port: chrome.port,
      onlyCategories: ["accessibility", "best-practices"],
      logLevel: "error",
    });
    if (result.lhr.runtimeError)
      throw new Error(
        `${path}: ${result.lhr.runtimeError.code} ${result.lhr.runtimeError.message}`,
      );
    const a11y = Math.round((result.lhr.categories.accessibility.score ?? 0) * 100);
    const best = Math.round((result.lhr.categories["best-practices"].score ?? 0) * 100);
    const failing = Object.values(result.lhr.audits)
      .filter(
        (audit) => audit.score !== null && audit.score < 1 && audit.scoreDisplayMode === "binary",
      )
      .map((audit) => audit.id);
    console.log(
      `${path.padEnd(14)} accessibility ${a11y}  best-practices ${best}  ${failing.length ? "failing: " + failing.join(", ") : ""}`,
    );
    if (a11y < MINIMUM) failed = true;
  }
} finally {
  await chrome.kill();
}
if (failed) {
  console.error(`Lighthouse accessibility below ${MINIMUM}`);
  process.exit(1);
}
