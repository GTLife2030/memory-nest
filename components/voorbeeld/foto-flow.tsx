"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button, Card, PhotoFrame } from "@/components/ui";
import { photos } from "@/lib/voorbeeld/data";
import { FlowFrame, useFlow } from "./flow";
import { MockRecorder } from "./mock-recorder";
import { PlaceholderPhoto } from "./placeholder-photo";

export function FotoFlow({ initialStep }: { initialStep: number }) {
  const t = useTranslations("voorbeeld.foto");
  const vraag = useTranslations("voorbeeld.vraag");
  const common = useTranslations("voorbeeld");
  const flow = useFlow(3, initialStep);
  const [photoId, setPhotoId] = useState<string>(photos[0].id);
  const [seconds, setSeconds] = useState(0);
  const [tried, setTried] = useState(false);
  const photo = photos.find((candidate) => candidate.id === photoId) ?? photos[0];
  const headings = [t("pick.heading"), t("suggest.heading"), t("tell.heading")];

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
            {common("next")}
          </Button>
        ) : flow.step === 2 ? (
          <Button size="lg" onClick={flow.next}>
            {t("suggest.cta")}
          </Button>
        ) : seconds > 0 ? (
          <Button asChild size="lg">
            <Link href="/voorbeeld/vraag?stap=4">{vraag("record.finish")}</Link>
          </Button>
        ) : (
          <Button size="lg" onClick={() => setTried(true)}>
            {vraag("record.finish")}
          </Button>
        )
      }
    >
      {flow.step === 1 ? (
        <>
          <p className="text-taupe-dark">{t("pick.hint")}</p>
          <fieldset>
            <legend className="sr-only">{t("pick.legend")}</legend>
            <div className="grid gap-5 sm:grid-cols-3">
              {photos.map((option) => (
                <label
                  key={option.id}
                  className="rounded-card has-[:checked]:border-terracotta-dark has-[:checked]:bg-sand has-[:focus-visible]:outline-terracotta-dark cursor-pointer border-2 border-transparent p-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-3"
                >
                  <input
                    type="radio"
                    name="photo"
                    value={option.id}
                    checked={photoId === option.id}
                    onChange={() => setPhotoId(option.id)}
                    className="sr-only"
                  />
                  <PhotoFrame className="w-full p-2 pb-3">
                    <PlaceholderPhoto scene={option.id} label="" />
                  </PhotoFrame>
                  <span className="text-ink mt-2 block text-center">{option.caption}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </>
      ) : null}

      {flow.step === 2 ? (
        <div className="grid gap-6 sm:grid-cols-[14rem_1fr]">
          <PhotoFrame className="w-full self-start">
            <PlaceholderPhoto scene={photo.id} label={photo.caption} />
          </PhotoFrame>
          <Card className="flex flex-col gap-4">
            <p className="rounded-pill border-taupe text-taupe-dark inline-flex w-fit border px-3 py-0.5 text-sm">
              {t("suggest.label")}
            </p>
            <dl className="flex flex-col gap-3">
              <div>
                <dt className="text-taupe-dark text-sm">{t("suggest.descriptionLabel")}</dt>
                <dd className="text-lg">{photo.description}</dd>
              </div>
              <div>
                <dt className="text-taupe-dark text-sm">{t("suggest.decadeLabel")}</dt>
                <dd className="text-lg">{photo.decade}</dd>
              </div>
            </dl>
            <p className="text-taupe-dark text-sm">{t("suggest.note")}</p>
          </Card>
        </div>
      ) : null}

      {flow.step === 3 ? (
        <>
          <div className="flex flex-wrap items-center gap-6">
            <PhotoFrame className="w-40 p-2 pb-3">
              <PlaceholderPhoto scene={photo.id} label={photo.caption} />
            </PhotoFrame>
            <p className="font-book text-ink flex-1 text-2xl italic">{photo.question}</p>
          </div>
          <MockRecorder onElapsed={setSeconds} />
          <p role="alert" className="text-error min-h-[1.6em] font-medium">
            {tried && seconds === 0 ? vraag("record.needStart") : ""}
          </p>
        </>
      ) : null}
    </FlowFrame>
  );
}
