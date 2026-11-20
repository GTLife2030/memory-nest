"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button, Card, QuestionCard } from "@/components/ui";
import { giftQuestion } from "@/lib/voorbeeld/data";
import { FlowFrame, useFlow } from "./flow";

export function CadeauFlow({ initialStep }: { initialStep: number }) {
  const t = useTranslations("voorbeeld.cadeau");
  const flow = useFlow(3, initialStep);
  const headings = [t("welcome.heading"), t("what.heading"), t("first.heading")];
  const items = ["year", "calls", "book", "audio"] as const;

  return (
    <FlowFrame
      flowTitle={t("title")}
      heading={headings[flow.step - 1] ?? ""}
      step={flow.step}
      total={flow.total}
      onBack={flow.back}
      actions={
        flow.step === 1 ? (
          <Button size="lg" onClick={flow.next}>
            {t("welcome.cta")}
          </Button>
        ) : flow.step === 2 ? (
          <Button size="lg" onClick={flow.next}>
            {t("what.cta")}
          </Button>
        ) : null
      }
    >
      {flow.step === 1 ? (
        <>
          <p className="text-lg">{t("welcome.body")}</p>
          <figure className="paper rounded-card shadow-soft p-6">
            <blockquote className="font-book text-ink text-xl italic">
              {t("welcome.note")}
            </blockquote>
            <figcaption className="text-taupe-dark mt-3">{t("welcome.noteFrom")}</figcaption>
          </figure>
          <div className="flex flex-col gap-2">
            <label htmlFor="cadeaucode" className="text-lg font-medium">
              {t("welcome.codeLabel")}
            </label>
            <p id="cadeaucode-hint" className="text-taupe-dark">
              {t("welcome.codeHint")}
            </p>
            <input
              id="cadeaucode"
              aria-describedby="cadeaucode-hint"
              defaultValue="NEST-TRUUS-2026"
              autoComplete="off"
              className="min-target rounded-card border-taupe text-ink border bg-white px-4 py-3 text-lg tracking-widest uppercase"
            />
          </div>
        </>
      ) : null}

      {flow.step === 2 ? (
        <>
          <Card>
            <ul className="flex list-disc flex-col gap-3 pl-5 text-lg">
              {items.map((item) => (
                <li key={item}>{t(`what.items.${item}`)}</li>
              ))}
            </ul>
          </Card>
          <p className="text-taupe-dark">{t("what.how")}</p>
        </>
      ) : null}

      {flow.step === 3 ? (
        <>
          <p className="text-lg">{t("first.body")}</p>
          <QuestionCard
            eyebrow={t("title")}
            question={giftQuestion}
            askedBy={t("first.askedBy")}
            actions={
              <>
                <Button asChild size="lg">
                  <Link href="/voorbeeld/vraag?stap=2">{t("first.cta")}</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/voorbeeld">{t("first.later")}</Link>
                </Button>
              </>
            }
          />
        </>
      ) : null}
    </FlowFrame>
  );
}
