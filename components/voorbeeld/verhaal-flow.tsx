"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { stories } from "@/lib/voorbeeld/data";
import { RadioCards } from "./choice";
import { FlowFrame, useFlow } from "./flow";
import { StoryParagraphs } from "./story-paragraphs";

const story = stories[0]!;
const processSteps = ["transcribe", "clean", "write", "extract"] as const;

export function VerhaalFlow({ initialStep }: { initialStep: number }) {
  const t = useTranslations("voorbeeld.verhaal");
  const flow = useFlow(5, initialStep);
  const [progress, setProgress] = useState(initialStep > 1 ? processSteps.length : 0);
  const [body, setBody] = useState(
    story.paragraphs.map((paragraph) => paragraph.text).join("\n\n"),
  );
  const [visibility, setVisibility] = useState("family");
  const followUps = t.raw("followUps") as string[];

  // The four processing steps tick by on their own, as they would while the visitor waits.
  useEffect(() => {
    if (flow.step !== 1 || progress >= processSteps.length) return;
    const timer = window.setTimeout(() => setProgress((current) => current + 1), 900);
    return () => window.clearTimeout(timer);
  }, [flow.step, progress]);

  const headings = [
    t("processing.heading"),
    t("review.heading"),
    t("edit.heading"),
    t("share.heading"),
    t("approved.heading"),
  ];
  const chips = (label: string, values: string[]) => (
    <div>
      <dt className="text-taupe-dark text-sm">{label}</dt>
      <dd className="mt-1 flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="rounded-pill border-taupe text-ink border px-3 py-0.5 text-sm"
          >
            {value}
          </span>
        ))}
      </dd>
    </div>
  );

  return (
    <FlowFrame
      flowTitle={t("title")}
      heading={headings[flow.step - 1] ?? ""}
      step={flow.step}
      total={flow.total}
      onBack={flow.step > 1 && flow.step < 5 ? flow.back : undefined}
      actions={
        flow.step === 1 ? (
          <Button size="lg" onClick={flow.next} disabled={progress < processSteps.length}>
            {t("processing.cta")}
          </Button>
        ) : flow.step === 2 ? (
          <>
            <Button size="lg" onClick={() => flow.go(4)}>
              {t("review.approve")}
            </Button>
            <Button variant="secondary" onClick={() => flow.go(3)}>
              {t("review.edit")}
            </Button>
          </>
        ) : flow.step === 3 ? (
          <Button size="lg" onClick={() => flow.go(2)}>
            {t("edit.save")}
          </Button>
        ) : flow.step === 4 ? (
          <Button size="lg" onClick={flow.next}>
            {t("share.cta")}
          </Button>
        ) : (
          <Button asChild size="lg">
            <Link href={`/voorbeeld/nest/verhalen/${story.id}`}>{t("approved.toNest")}</Link>
          </Button>
        )
      }
    >
      {flow.step === 1 ? (
        <>
          <p className="text-taupe-dark">{t("processing.body")}</p>
          <ol aria-live="polite" className="flex flex-col gap-3">
            {processSteps.map((key, index) => {
              const state = index < progress ? "done" : index === progress ? "busy" : "waiting";
              return (
                <li
                  key={key}
                  className="rounded-card bg-linen shadow-soft flex items-center justify-between gap-4 px-5 py-4"
                >
                  <span className="text-lg">{t(`processing.steps.${key}`)}</span>
                  <span className={state === "done" ? "text-ink font-medium" : "text-taupe-dark"}>
                    {t(`processing.${state}`)}
                  </span>
                </li>
              );
            })}
          </ol>
        </>
      ) : null}

      {flow.step === 2 ? (
        <>
          <Card className="flex flex-col gap-3">
            <p className="rounded-pill bg-ink inline-flex w-fit px-3 py-0.5 text-sm text-white">
              {t("review.aiBadge")}
            </p>
            <p className="text-taupe-dark">{t("review.aiNote")}</p>
          </Card>
          <article>
            <h2 className="text-2xl">{story.title}</h2>
            <p className="text-taupe-dark mt-2 mb-3">{t("review.tapHint")}</p>
            <StoryParagraphs
              paragraphs={story.paragraphs}
              sourceHeading={t("review.sourceHeading")}
            />
          </article>
          <Card>
            <h2 className="font-sans text-lg font-medium">{t("review.found")}</h2>
            <dl className="mt-4 flex flex-col gap-4">
              {chips(t("review.people"), [...story.people, "Mevrouw Smulders"])}
              {chips(t("review.places"), story.places)}
              {chips(t("review.when"), ["jaren vijftig"])}
            </dl>
          </Card>
          <Card className="border-warning border-l-4">
            <h2 className="font-sans text-lg font-medium">{t("review.flagHeading")}</h2>
            <p className="mt-2">{t("review.flag")}</p>
          </Card>
        </>
      ) : null}

      {flow.step === 3 ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="verhaaltekst" className="text-lg font-medium">
            {t("edit.label")}
          </label>
          <p id="verhaaltekst-hint" className="text-taupe-dark">
            {t("edit.hint")}
          </p>
          <textarea
            id="verhaaltekst"
            aria-describedby="verhaaltekst-hint"
            rows={12}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="rounded-card border-taupe font-book text-ink border bg-white p-4 text-xl leading-relaxed"
          />
        </div>
      ) : null}

      {flow.step === 4 ? (
        <>
          <RadioCards
            name="visibility"
            legend={t("share.heading")}
            legendHidden
            options={[
              { value: "private", label: t("share.private"), hint: t("share.privateHint") },
              { value: "family", label: t("share.family"), hint: t("share.familyHint") },
            ]}
            value={visibility}
            onChange={setVisibility}
          />
          <Card>
            <h2 className="font-sans text-lg font-medium">{t("share.vault")}</h2>
            <p className="text-taupe-dark mt-2">{t("share.vaultHint")}</p>
          </Card>
        </>
      ) : null}

      {flow.step === 5 ? (
        <>
          <p className="text-lg">{t("approved.body")}</p>
          <Card>
            <h2 className="font-sans text-lg font-medium">{t("approved.followHeading")}</h2>
            <ul className="mt-4 flex flex-col gap-4">
              {followUps.map((question) => (
                <li key={question} className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-book text-xl italic">{question}</span>
                  <Button asChild variant="secondary">
                    <Link href="/voorbeeld/vraag?stap=2">{t("approved.followTell")}</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : null}
    </FlowFrame>
  );
}
