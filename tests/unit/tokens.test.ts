import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrast } from "@/lib/design/contrast";
import { colors, textPairs } from "@/lib/design/tokens";

describe("design tokens", () => {
  it.each(textPairs)("%s on %s meets WCAG AA for body text (4.5:1)", (text, background) => {
    expect(contrast(colors[text], colors[background])).toBeGreaterThanOrEqual(4.5);
  });

  it("documents why taupe and terracotta are not text colours on cream", () => {
    expect(contrast(colors.taupe, colors.cream)).toBeLessThan(4.5);
    expect(contrast(colors.terracotta, colors.cream)).toBeLessThan(4.5);
    expect(contrast(colors.white, colors.terracotta)).toBeLessThan(4.5);
  });

  it("non-text marks (borders, timeline dots, waveform) reach 3:1 on cream and linen", () => {
    for (const mark of ["taupe", "terracottaDark", "taupeDark"] as const) {
      expect(contrast(colors[mark], colors.cream)).toBeGreaterThanOrEqual(3);
      expect(contrast(colors[mark], colors.linen)).toBeGreaterThanOrEqual(3);
    }
  });

  it("stays in sync with the CSS variables in app/globals.css", () => {
    const css = readFileSync("app/globals.css", "utf8").toLowerCase();
    const kebab = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    for (const [name, value] of Object.entries(colors)) {
      if (name === "white") continue;
      expect(css, name).toContain(`--color-${kebab(name)}: ${value.toLowerCase()};`);
    }
  });

  it("uses the base sizes from the brand brief: 18px, elder 21px with 56px targets", () => {
    const css = readFileSync("app/globals.css", "utf8");
    expect(css).toMatch(/:root \{\s*font-size: 18px;/);
    expect(css).toMatch(/:root\[data-elder="true"\] \{\s*font-size: 21px;/);
    expect(2.6667 * 21).toBeGreaterThanOrEqual(56);
    expect(2.75 * 18).toBeGreaterThanOrEqual(44);
  });
});
