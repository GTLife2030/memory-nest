/** Mirror of the colour tokens in app/globals.css, for code that needs raw values (tests, PDFs). */
export const colors = {
  cream: "#F7F1E8",
  sand: "#EADFCF",
  linen: "#FBF8F3",
  taupe: "#8B7D6B",
  taupeDark: "#5E5346",
  terracotta: "#B8664A",
  terracottaDark: "#94503A",
  rose: "#D9A5A0",
  ink: "#2E2A26",
  success: "#5F7A5A",
  warning: "#B8893A",
  error: "#A3473B",
  white: "#FFFFFF",
} as const;

/**
 * The only text/background pairs components may use. `taupe` and `terracotta` are missing on
 * purpose: they do not reach 4.5:1 on cream and are for borders and decoration only.
 */
export const textPairs: [text: keyof typeof colors, background: keyof typeof colors][] = [
  ["ink", "cream"],
  ["ink", "linen"],
  ["ink", "sand"],
  ["taupeDark", "cream"],
  ["taupeDark", "linen"],
  ["taupeDark", "sand"],
  ["terracottaDark", "cream"],
  ["terracottaDark", "linen"],
  ["white", "terracottaDark"],
  ["white", "ink"],
  ["error", "linen"],
  ["error", "cream"],
];
