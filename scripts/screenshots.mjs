// Captures the phase checkpoint screenshots into docs/screenshots/<phase>/.
// Usage: start the app (pnpm build && pnpm start -p 3100), then `node scripts/screenshots.mjs phase-0`.
import { chromium, devices } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const phase = process.argv[2] ?? "phase-0";
const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
const out = `docs/screenshots/${phase}`;
await mkdir(out, { recursive: true });

const sets = {
  "phase-0": [
    ["landing", "/"],
    ["inloggen", "/inloggen"],
    ["nest", "/nest/demo"],
    ["design", "/design"],
  ],
  "voorbeeld-1": [
    ["kaart", "/voorbeeld"],
    ["onboarding-1", "/voorbeeld/onboarding"],
    ["onboarding-7", "/voorbeeld/onboarding?stap=7"],
    ["cadeau-1", "/voorbeeld/cadeau"],
    ["vraag-1", "/voorbeeld/vraag"],
    ["vraag-2", "/voorbeeld/vraag?stap=2"],
    ["foto-2", "/voorbeeld/foto?stap=2"],
    ["verhaal-2", "/voorbeeld/verhaal?stap=2"],
    ["nest-week", "/voorbeeld/nest"],
    ["nest-tijdlijn", "/voorbeeld/nest/tijdlijn"],
    ["nest-hoofdstukken", "/voorbeeld/nest/hoofdstukken"],
    ["nest-zoeken", "/voorbeeld/nest/zoeken?q=bakkerij"],
  ],
};
const screens = sets[phase] ?? sets["phase-0"];
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
