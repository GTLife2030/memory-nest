import { getTranslations } from "next-intl/server";
import { Search } from "@/components/voorbeeld/search";

export default async function MockSearchPage({
  searchParams,
}: PageProps<"/voorbeeld/nest/zoeken">) {
  const [t, params] = await Promise.all([getTranslations("voorbeeld.nest.search"), searchParams]);
  const query = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl">{t("heading")}</h1>
      <Search initialQuery={query} />
    </div>
  );
}
