import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { StoryParagraphs } from "@/components/voorbeeld/story-paragraphs";
import { chapters, stories } from "@/lib/voorbeeld/data";
import { dateTimeAttr, whenLabel } from "@/lib/voorbeeld/dates";

export async function generateMetadata({
  params,
}: PageProps<"/voorbeeld/nest/verhalen/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: stories.find((story) => story.id === id)?.title };
}

export default async function MockStoryPage({
  params,
}: PageProps<"/voorbeeld/nest/verhalen/[id]">) {
  const { id } = await params;
  const story = stories.find((candidate) => candidate.id === id);
  if (!story) notFound();
  const t = await getTranslations("voorbeeld.nest");
  const chapter = chapters.find((candidate) => candidate.id === story.chapterId);

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <p className="text-taupe-dark">
          {t("story.toldBy", { name: story.teller })} ·{" "}
          <time dateTime={dateTimeAttr(story.date, story.precision)}>
            {whenLabel(story.date, story.precision)}
          </time>
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl">{story.title}</h1>
        {chapter ? (
          <p className="text-taupe-dark mt-3 text-sm">
            {t("story.inChapter", { chapter: chapter.title })}
          </p>
        ) : null}
        {story.status === "needs_review" ? (
          <p className="rounded-pill bg-ink mt-4 inline-flex px-3 py-0.5 text-sm text-white">
            {t("stories.ai")}
          </p>
        ) : null}
      </header>
      <p className="text-taupe-dark">{t("story.tapHint")}</p>
      <StoryParagraphs paragraphs={story.paragraphs} sourceHeading={t("story.sourceHeading")} />
      <p>
        <Link
          href="/voorbeeld/nest/verhalen"
          className="text-terracotta-dark underline underline-offset-4"
        >
          {t("story.back")}
        </Link>
      </p>
    </article>
  );
}
