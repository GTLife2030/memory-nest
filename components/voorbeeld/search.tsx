"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button, Card, Waveform } from "@/components/ui";
import { formatClock, stories, waveLevels } from "@/lib/voorbeeld/data";

const normalise = (value: string) =>
  value
    .toLocaleLowerCase("nl")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

/** Search that answers with the original passages and their recordings, never with a summary. */
export function Search({ initialQuery }: { initialQuery: string }) {
  const t = useTranslations("voorbeeld.nest.search");
  const review = useTranslations("voorbeeld");
  const [draft, setDraft] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const examples = t.raw("examples") as string[];

  const results = useMemo(() => {
    const needle = normalise(query.trim());
    if (!needle) return [];
    return stories.flatMap((story) =>
      story.paragraphs
        .map((paragraph, index) => ({ story, paragraph, index }))
        .filter(({ paragraph }) =>
          normalise(`${paragraph.text} ${paragraph.spoken}`).includes(needle),
        ),
    );
  }, [query]);

  return (
    <div className="flex flex-col gap-8">
      <form
        role="search"
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(draft);
        }}
      >
        <label htmlFor="zoekwoord" className="text-lg font-medium">
          {t("label")}
        </label>
        <p id="zoekwoord-hint" className="text-taupe-dark">
          {t("hint")}
        </p>
        <div className="flex flex-wrap gap-3">
          <input
            id="zoekwoord"
            type="search"
            aria-describedby="zoekwoord-hint"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-target rounded-card border-taupe text-ink min-w-0 flex-1 border bg-white px-4 py-3 text-lg"
          />
          <Button type="submit">{t("submit")}</Button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-taupe-dark">{t("tryLegend")}</p>
        {examples.map((example) => (
          <Button
            key={example}
            variant="secondary"
            onClick={() => {
              setDraft(example);
              setQuery(example);
            }}
          >
            {example}
          </Button>
        ))}
      </div>

      <section aria-live="polite" className="flex flex-col gap-5">
        {query.trim() ? (
          <h2 className="text-2xl">{t("resultsCount", { count: results.length })}</h2>
        ) : null}
        {query.trim() && results.length === 0 ? (
          <p className="text-taupe-dark">{t("noResults")}</p>
        ) : null}
        {results.map(({ story, paragraph, index }) => {
          const time = review("verhaal.review.sourceTime", {
            start: formatClock(paragraph.startS),
            end: formatClock(paragraph.endS),
          });
          return (
            <Card key={`${story.id}-${index}`} className="flex flex-col gap-3">
              <p className="font-book text-ink text-xl">{paragraph.text}</p>
              <Waveform levels={waveLevels(index + 4, 36)} label={time} />
              <p className="text-taupe-dark text-sm">{time}</p>
              <p>
                <Link
                  href={`/voorbeeld/nest/verhalen/${story.id}`}
                  className="text-terracotta-dark underline underline-offset-4"
                >
                  {t("from", { title: story.title, name: story.teller })}
                </Link>
              </p>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
