import { getRequestConfig } from "next-intl/server";

export const locales = ["nl", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "nl";

// Dutch is the only shipped locale. `en` is prepared: its file is merged over Dutch so missing
// keys fall back instead of breaking. Locale switching arrives in phase 5.
export default getRequestConfig(async () => {
  const locale: Locale = defaultLocale;
  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages, timeZone: "Europe/Amsterdam" };
});
