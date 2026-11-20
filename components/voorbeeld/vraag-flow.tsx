"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button, Card, QuestionCard, Waveform } from "@/components/ui";
import { formatClock, questions, waveLevels } from "@/lib/voorbeeld/data";
import { FlowFrame, useFlow } from "./flow";
import { MockRecorder } from "./mock-recorder";

export function VraagFlow({ initialStep }: { initialStep: number }) {
  const t = useTranslations("voorbeeld.vraag");
  const flow = useFlow(4, initialStep);
  const [index, setIndex] = useState(0);
  const [typing, setTyping] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [tried, setTried] = useState(false);
  const [playing, setPlaying] = useState(false);
  const question = questions[index % questions.length] ?? "";
  const duration = formatClock(Math.max(seconds, 34));

  const headings = [
    t("ask.heading"),
    typing ? t("type.heading") : t("record.heading"),
    t("review.heading"),
    t("saved.heading"),
  ];

  return (
    <FlowFrame
      flowTitle={t("title")}
      heading={headings[flow.step - 1] ?? ""}
      step={flow.step}
      total={flow.total}
      onBack={flow.step < 4 ? flow.back : undefined}
      actions={
        flow.step === 2 ? (
          typing ? (
            <Button size="lg" onClick={() => flow.go(4)}>
              {t("type.finish")}
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={() => {
                if (seconds > 0) flow.next();
                else setTried(true);
              }}
            >
              {t("record.finish")}
            </Button>
          )
        ) : flow.step === 3 ? (
          <>
            <Button size="lg" onClick={flow.next}>
              {t("review.keep")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setSeconds(0);
                flow.go(2);
              }}
            >
              {t("review.again")}
            </Button>
          </>
        ) : flow.step === 4 ? (
          <Button asChild size="lg">
            <Link href="/voorbeeld/verhaal">{t("saved.next")}</Link>
          </Button>
        ) : null
      }
    >
      {flow.step === 1 ? (
        <>
          <p role="status" className="text-taupe-dark min-h-[1.6em]">
            {index > 0 ? t("ask.skipped") : ""}
          </p>
          <QuestionCard
            eyebrow={t("ask.eyebrow")}
            question={question}
            actions={
              <>
                <Button
                  size="lg"
                  onClick={() => {
                    setTyping(false);
                    flow.next();
                  }}
                >
                  {t("ask.tell")}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setTyping(true);
                    flow.next();
                  }}
                >
                  {t("ask.type")}
                </Button>
                <Button variant="ghost" onClick={() => setIndex(index + 1)}>
                  {t("ask.skip")}
                </Button>
              </>
            }
          />
        </>
      ) : null}

      {flow.step === 2 && !typing ? (
        <>
          <p className="font-book text-ink text-2xl italic">{question}</p>
          <p className="text-taupe-dark">{t("record.hint")}</p>
          <MockRecorder onElapsed={setSeconds} />
          <p role="alert" className="text-error min-h-[1.6em] font-medium">
            {tried && seconds === 0 ? t("record.needStart") : ""}
          </p>
        </>
      ) : null}

      {flow.step === 2 && typing ? (
        <>
          <p className="font-book text-ink text-2xl italic">{question}</p>
          <div className="flex flex-col gap-2">
            <label htmlFor="antwoord" className="text-lg font-medium">
              {t("type.label")}
            </label>
            <p id="antwoord-hint" className="text-taupe-dark">
              {t("type.hint")}
            </p>
            <textarea
              id="antwoord"
              aria-describedby="antwoord-hint"
              rows={8}
              className="rounded-card border-taupe font-book text-ink border bg-white p-4 text-xl"
            />
          </div>
        </>
      ) : null}

      {flow.step === 3 ? (
        <>
          <p className="text-lg">{t("review.body")}</p>
          <Card className="flex flex-col gap-4">
            <Waveform
              levels={waveLevels(3, 40)}
              label={t("review.length", { duration })}
              progress={playing ? 0.45 : 0}
            />
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant="secondary"
                aria-pressed={playing}
                onClick={() => setPlaying(!playing)}
              >
                {playing ? t("review.pause") : t("review.play")}
              </Button>
              <p className="text-taupe-dark">{t("review.length", { duration })}</p>
            </div>
          </Card>
        </>
      ) : null}

      {flow.step === 4 ? (
        <p className="text-lg">{typing ? t("saved.typedBody") : t("saved.body")}</p>
      ) : null}
    </FlowFrame>
  );
}
