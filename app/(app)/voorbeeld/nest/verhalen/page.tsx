import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { StoryList } from "@/components/voorbeeld/story-list";
import { stories } from "@/lib/voorbeeld/data";
import { byDate } from "@/lib/voorbeeld/dates";
import { cn } from "@/lib/cn";

export default async function MockStoriesPage({
  searchParams,
}: PageProps<"/voorbeeld/nest/verhalen">) {
  const [t, params] = await Promise.all([getTranslations("voorbeeld.nest.stories"), searchParams]);
  const tellers = [...new Set(stories.map((story) => story.teller))];
  const teller = tellers.find((name) => name === params.van);
  const items = stories.filter((story) => !teller || story.teller === teller).sort(byDate);
  const filters = [
    { href: "/voorbeeld/nest/verhalen", label: t("all"), current: !teller },
    ...tellers.map((name) => ({
      href: `/voorbeeld/nest/verhalen?van=${encodeURIComponent(name)}`,
      label: t("byTeller", { name }),
      current: teller === name,
    })),
  ];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-4xl">{t("heading")}</h1>
        <p className="text-taupe-dark mt-2">{t("count", { count: items.length })}</p>
      </header>
      <nav aria-label={t("filterLegend")}>
        <ul className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <li key={filter.href}>
              <Link
                href={filter.href}
                aria-current={filter.current ? "true" : undefined}
                className={cn(
                  "min-target rounded-pill inline-flex items-center border px-4 text-sm",
                  filter.current
                    ? "border-terracotta-dark bg-sand text-ink"
                    : "border-taupe text-ink hover:bg-sand",
                )}
              >
                {filter.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <StoryList
        headingLevel={2}
        items={items}
        labels={{ audio: t("audio"), needsReview: t("needsReview"), ai: t("ai") }}
      />
    </div>
  );
}
