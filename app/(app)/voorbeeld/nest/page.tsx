import { cookies } from "next/headers";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { StoryList } from "@/components/voorbeeld/story-list";
import { Button, Card, ProgressGentle, QuestionCard } from "@/components/ui";
import { questions, stories } from "@/lib/voorbeeld/data";
import { PERSONA_COOKIE, resolvePersona } from "@/lib/voorbeeld/persona";

export default async function MockNestHome() {
  const [t, vraag, cookieStore] = await Promise.all([
    getTranslations("voorbeeld.nest"),
    getTranslations("voorbeeld.vraag"),
    cookies(),
  ]);
  const persona = resolvePersona(cookieStore.get(PERSONA_COOKIE)?.value);
  const waiting = stories.filter((story) => story.status === "needs_review");
  const recent = stories
    .filter((story) => story.status === "approved")
    .slice(-3)
    .reverse();
  const labels = {
    audio: t("stories.audio"),
    needsReview: t("stories.needsReview"),
    ai: t("stories.ai"),
  };
  const inBook = stories.filter(
    (story) => story.teller === "Oma Truus" && story.status === "approved",
  ).length;

  return (
    <div className="flex flex-col gap-12">
      <header>
        <p className="text-taupe-dark">{t("week.greeting", { name: persona.name })}</p>
        <h1 className="mt-1 text-4xl sm:text-5xl">{t("week.heading")}</h1>
      </header>

      <QuestionCard
        eyebrow={vraag("ask.eyebrow")}
        question={questions[0] ?? ""}
        actions={
          <Button asChild size="lg">
            <Link href="/voorbeeld/vraag">{vraag("ask.tell")}</Link>
          </Button>
        }
      />

      {waiting.length > 0 ? (
        <section aria-labelledby="wacht-op-jou">
          <h2 id="wacht-op-jou" className="text-3xl">
            {t("week.reviewHeading")}
          </h2>
          <Card className="border-warning mt-6 flex flex-wrap items-center justify-between gap-4 border-l-4">
            <div>
              <h3 className="text-xl">{waiting[0]?.title}</h3>
              <p className="text-taupe-dark mt-1">{t("week.reviewBody")}</p>
            </div>
            <Button asChild variant="secondary">
              <Link href="/voorbeeld/verhaal?stap=2">{t("week.reviewCta")}</Link>
            </Button>
          </Card>
        </section>
      ) : null}

      <section aria-labelledby="nieuw">
        <h2 id="nieuw" className="mb-6 text-3xl">
          {t("week.newHeading")}
        </h2>
        <StoryList items={recent} labels={labels} />
      </section>

      <ProgressGentle
        done={inBook}
        total={8}
        label={t("week.bookProgress", { done: inBook, total: 8 })}
        className="max-w-md"
      />
    </div>
  );
}
