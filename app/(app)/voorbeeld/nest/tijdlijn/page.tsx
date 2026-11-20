import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TimelineItem } from "@/components/ui";
import { cn } from "@/lib/cn";
import { stories, type MockStory } from "@/lib/voorbeeld/data";
import {
  byDate,
  dateTimeAttr,
  decadeLabel,
  decadeOf,
  monthLabel,
  whenLabel,
} from "@/lib/voorbeeld/dates";

const zooms = ["decade", "year", "month"] as const;
type Zoom = (typeof zooms)[number];

function groupKey(story: MockStory, zoom: Zoom): string {
  if (zoom === "decade") return decadeLabel(decadeOf(story.date));
  if (zoom === "year") return story.date.slice(0, 4);
  return monthLabel(story.date);
}

/** Timeline with three zoom levels. Month view only holds moments known to the month or day. */
export default async function MockTimelinePage({
  searchParams,
}: PageProps<"/voorbeeld/nest/tijdlijn">) {
  const [t, params] = await Promise.all([getTranslations("voorbeeld.nest.timeline"), searchParams]);
  const zoom: Zoom = zooms.find((candidate) => candidate === params.zoom) ?? "decade";
  const visible = [...stories]
    .sort(byDate)
    .filter((story) => zoom !== "month" || story.precision === "day" || story.precision === "month")
    .filter((story) => zoom !== "year" || story.precision !== "decade");
  const groups = new Map<string, MockStory[]>();
  for (const story of visible) {
    const key = groupKey(story, zoom);
    groups.set(key, [...(groups.get(key) ?? []), story]);
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl">{t("heading")}</h1>
      <nav aria-label={t("zoomLegend")}>
        <ul className="flex flex-wrap gap-2">
          {zooms.map((option) => (
            <li key={option}>
              <Link
                href={`/voorbeeld/nest/tijdlijn?zoom=${option}`}
                aria-current={zoom === option ? "true" : undefined}
                className={cn(
                  "min-target rounded-pill inline-flex items-center border px-4 text-sm",
                  zoom === option
                    ? "border-terracotta-dark bg-sand text-ink"
                    : "border-taupe text-ink hover:bg-sand",
                )}
              >
                {t(option)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {groups.size === 0 ? <p className="text-taupe-dark">{t("empty")}</p> : null}
      {[...groups.entries()].map(([label, items]) => (
        <section key={label} aria-label={label}>
          <h2 className="text-2xl first-letter:uppercase">{label}</h2>
          <ol className="mt-5 ml-2">
            {items.map((story) => (
              <TimelineItem
                key={story.id}
                dateLabel={whenLabel(story.date, story.precision)}
                dateTime={dateTimeAttr(story.date, story.precision)}
                title={story.title}
                href={`/voorbeeld/nest/verhalen/${story.id}`}
              >
                <p className="text-taupe-dark">{story.teller}</p>
              </TimelineItem>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
