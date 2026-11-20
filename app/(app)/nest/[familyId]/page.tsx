import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Button, Card, EmptyState, QuestionCard, StoryCard, TimelineItem } from "@/components/ui";
import { demoFamily } from "@/lib/demo/de-wit";
import { getNest } from "@/lib/server/nest";

export async function generateMetadata({ params }: PageProps<"/nest/[familyId]">): Promise<Metadata> {
  const [{ familyId }, t] = await Promise.all([params, getTranslations("nest")]);
  const nest = await getNest(familyId);
  return { title: nest ? t("title", { family: nest.familyName }) : undefined };
}

export default async function NestHomePage({ params }: PageProps<"/nest/[familyId]">) {
  const { familyId } = await params;
  const nest = await getNest(familyId);
  if (!nest) notFound();
  const [t, format] = await Promise.all([getTranslations("nest"), getFormatter()]);

  return (
    <div className="flex flex-col gap-12">
      <header>
        <p className="text-taupe-dark">
          {nest.displayName ? t("greeting", { name: nest.displayName }) : t("greetingAnonymous")}
        </p>
        <h1 className="mt-1 text-4xl sm:text-5xl">{t("title", { family: nest.familyName })}</h1>
        <p className="mt-3 text-sm text-taupe-dark">{t("roleLabel", { role: t(`role.${nest.role}`) })}</p>
        {nest.demo ? (
          <p className="mt-4 inline-block rounded-card border border-taupe bg-linen px-4 py-2 text-taupe-dark">
            {t("demoNotice")}
          </p>
        ) : null}
      </header>

      {nest.demo ? (
        <>
          <section aria-labelledby="deze-week">
            <h2 id="deze-week" className="sr-only">
              {t("thisWeek")}
            </h2>
            <QuestionCard
              eyebrow={t("question.eyebrow")}
              question={demoFamily.question}
              actions={
                <>
                  <Button size="lg" disabled title={t("question.soon")}>
                    {t("question.tell")}
                  </Button>
                  <p className="basis-full text-sm text-taupe-dark">{t("question.soon")}</p>
                </>
              }
            />
          </section>

          <section aria-labelledby="verhalen">
            <h2 id="verhalen" className="text-3xl">
              {t("stories")}
            </h2>
            <ul className="mt-6 flex flex-col gap-5">
              {demoFamily.stories.map((story) => (
                <li key={story.id}>
                  <StoryCard
                    title={story.title}
                    href="#verhalen"
                    meta={`${story.teller} · ${story.when}`}
                    excerpt={story.excerpt}
                    statusLabel={story.status === "needs_review" ? t("story.needsReview") : undefined}
                    aiLabel={story.status === "needs_review" ? t("story.ai") : undefined}
                    hasAudioLabel={story.status === "approved" ? t("story.approvedAudio") : undefined}
                  />
                </li>
              ))}
            </ul>
          </section>

          <div className="grid gap-12 md:grid-cols-2">
            <section aria-labelledby="tijdlijn">
              <h2 id="tijdlijn" className="text-3xl">
                {t("timeline")}
              </h2>
              <ol className="mt-6 ml-2">
                {demoFamily.timeline.map((moment) => (
                  <TimelineItem
                    key={moment.dateTime}
                    dateLabel={moment.date}
                    dateTime={moment.dateTime}
                    title={moment.title}
                  />
                ))}
              </ol>
            </section>
            <section aria-labelledby="voor-later">
              <h2 id="voor-later" className="text-3xl">
                {t("capsule.heading")}
              </h2>
              <Card className="mt-6">
                <h3 className="text-xl">{demoFamily.capsule.title}</h3>
                <p className="mt-2 text-taupe-dark">
                  {t("capsule.sealed", {
                    date: format.dateTime(new Date(demoFamily.capsule.releaseDate), { dateStyle: "long" }),
                  })}
                </p>
              </Card>
            </section>
          </div>
        </>
      ) : (
        <Card>
          <EmptyState title={t("empty.title")} body={t("empty.body")} illustration={<EmptyNest />} />
        </Card>
      )}
    </div>
  );
}

function EmptyNest() {
  return (
    <svg viewBox="0 0 120 80" className="h-24 w-36" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M12 38c0 20 21 32 48 32s48-12 48-32" strokeWidth="3" />
      <path d="M22 42c6 12 20 19 38 19s32-7 38-19" strokeWidth="2" opacity="0.6" />
      <path d="M32 44c5 7 15 11 28 11s23-4 28-11" strokeWidth="2" opacity="0.35" />
    </svg>
  );
}
