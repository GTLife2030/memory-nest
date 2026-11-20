import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/eb-garamond/wght.css";
import "@fontsource-variable/eb-garamond/wght-italic.css";
import "./globals.css";
import { ServiceWorker } from "@/components/layout/service-worker";
import { ToastProvider } from "@/components/ui";
import { ELDER_COOKIE } from "@/lib/elder";
import { publicEnv } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
    title: { default: t("brand"), template: `%s · ${t("brand")}` },
    description: t("tagline"),
    applicationName: t("brand"),
    appleWebApp: { capable: true, title: t("brand"), statusBarStyle: "default" },
    // Family nests are private; nothing here belongs in a search index except the landing page.
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#F7F1E8",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, cookieStore, t] = await Promise.all([getLocale(), cookies(), getTranslations("common")]);
  const elder = cookieStore.get(ELDER_COOKIE)?.value === "1";

  return (
    <html lang={locale} data-elder={elder ? "true" : "false"}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#inhoud"
          className="sr-only rounded-pill bg-ink px-5 py-3 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider>
          <ToastProvider closeLabel={t("close")} regionLabel={t("notifications")}>
            {children}
          </ToastProvider>
        </NextIntlClientProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
