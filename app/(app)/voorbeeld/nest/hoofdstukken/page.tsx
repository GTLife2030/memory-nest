import { getTranslations } from "next-intl/server";
import { ChapterOrder } from "@/components/voorbeeld/chapter-order";

export default async function MockChaptersPage() {
  const t = await getTranslations("voorbeeld.nest.chapters");
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-4xl">{t("heading")}</h1>
        <p className="text-taupe-dark mt-2">{t("hint")}</p>
      </header>
      <ChapterOrder />
    </div>
  );
}
