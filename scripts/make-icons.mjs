// Renders the PWA icons from the nest mark. Run with `node scripts/make-icons.mjs` after changing it.
import { chromium } from "@playwright/test";

const mark = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="512" height="512">
  <rect width="32" height="32" fill="#F7F1E8"/>
  <g transform="translate(16 16) scale(${pad}) translate(-16 -16)">
    <path d="M5 17c0 5.6 4.9 9 11 9s11-3.4 11-9" fill="none" stroke="#94503A" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="16" cy="13.5" rx="3.4" ry="4.3" fill="#94503A"/>
  </g></svg>`;

const browser = await chromium.launch();
for (const [file, size, pad] of [
  ["icon-192.png", 192, 0.85],
  ["icon-512.png", 512, 0.85],
  ["icon-maskable-512.png", 512, 0.6],
  ["apple-touch-icon.png", 180, 0.8],
]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>*{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${mark(pad)}`);
  await page.screenshot({ path: `public/icons/${file}` });
  await page.close();
}
await browser.close();
