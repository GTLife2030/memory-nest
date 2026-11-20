"use client";

import { useTranslations } from "next-intl";
import { Button, EmptyState } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors.generic");
  return (
    <main id="inhoud" className="mx-auto w-full max-w-xl flex-1 px-5 py-16">
      <h1 className="sr-only">{t("title")}</h1>
      <EmptyState title={t("title")} body={t("body")} action={<Button onClick={reset}>{t("retry")}</Button>} />
    </main>
  );
}
