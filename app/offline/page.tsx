import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("offline");
  return { title: t("title") };
}

/** Served by the service worker when a page cannot be loaded. */
export default async function OfflinePage() {
  const t = await getTranslations("offline");
  return (
    <main id="inhoud" className="mx-auto w-full max-w-xl flex-1 px-5 py-24">
      <h1 className="sr-only">{t("title")}</h1>
      <EmptyState title={t("heading")} body={t("body")} />
    </main>
  );
}
