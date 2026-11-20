import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/layout/site-header";
import { Button, EmptyState } from "@/components/ui";

export default async function NotFound() {
  const [t, common] = await Promise.all([getTranslations("errors.notFound"), getTranslations("common")]);
  return (
    <>
      <SiteHeader />
      <main id="inhoud" className="mx-auto w-full max-w-xl flex-1 px-5 py-16">
        <h1 className="sr-only">{t("title")}</h1>
        <EmptyState
          title={t("title")}
          body={t("body")}
          action={
            <Button asChild>
              <Link href="/">{common("home")}</Link>
            </Button>
          }
        />
      </main>
    </>
  );
}
