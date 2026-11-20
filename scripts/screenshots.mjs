// Captures the phase checkpoint screenshots into docs/screenshots/<phase>/.
// Usage: start the app (pnpm build && pnpm start -p 3100), then `node scripts/screenshots.mjs phase-0`.
import { chromium, devices } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const phase = process.argv[2] ?? "phase-0";
const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
const out = `docs/screenshots/${phase}`;
await mkdir(out, { recursive: true });

const screens = [
  ["landing", "/"],
  ["inloggen", "/inloggen"],
  ["nest", "/nest/demo"],
  ["design", "/design"],
];
const variants = [
  ["desktop", { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }, false],
  ["telefoon", devices["Pixel 7"], false],
  ["telefoon-grote-letters", devices["Pixel 7"], true],
];

const browser = await chromium.launch();
for (const [variant, options, elder] of variants) {
  const context = await browser.newContext({ ...options, locale: "nl-NL" });
  await context.addCookies([{ name: "mn_elder", value: elder ? "1" : "0", url: base }]);
  const page = await context.newPage();
  for (const [name, path] of screens) {
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.screenshot({
      path: `${out}/${name}-${variant}.png`,
      fullPage: name !== "design" || variant === "desktop",
    });
  }
  await context.close();
}
await browser.close();
console.log(`Screenshots written to ${out}`);
