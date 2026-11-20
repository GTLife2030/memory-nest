"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { themes } from "@/lib/voorbeeld/data";
import { CheckChips, RadioCards } from "./choice";
import { FlowFrame, useFlow } from "./flow";

const input = "min-target rounded-card border border-taupe bg-white px-4 py-3 text-lg text-ink";

export function OnboardingFlow({ initialStep }: { initialStep: number }) {
  const t = useTranslations("voorbeeld.onboarding");
  const common = useTranslations("voorbeeld");
  const flow = useFlow(7, initialStep);
  const [who, setWho] = useState("parent");
  const [name, setName] = useState("Oma Truus");
  const [relation, setRelation] = useState("oma");
  const [chosen, setChosen] = useState<string[]>(["Jeugd", "Familie"]);
  const [rhythm, setRhythm] = useState("weekly");
  const [channel, setChannel] = useState("phone");
  const [cover, setCover] = useState("linnen");

  const options = (group: string, keys: string[]) =>
    keys.map((key) => ({
      value: key,
      label: t(`${group}.${key}` as never),
      hint: t(`${group}.${key}Hint` as never),
    }));
  const whoOptions = options("who", ["baby", "self", "parent", "later"]);
  const rhythmOptions = options("rhythm", ["weekly", "biweekly", "monthly"]);
  const channelOptions = options("channel", ["app", "email", "whatsapp", "phone"]);
  const coverOptions = options("cover", ["linnen", "zand", "eerste_jaar"]);
  const labelOf = (list: { value: string; label: string }[], value: string) =>
    list.find((option) => option.value === value)?.label ?? "";

  const headings = [
    t("who.heading"),
    t("name.heading"),
    t("themes.heading"),
    t("rhythm.heading"),
    t("channel.heading"),
    t("cover.heading"),
    t("ready.heading"),
  ];
  const next = <Button onClick={flow.next}>{common("next")}</Button>;

  return (
    <FlowFrame
      flowTitle={t("title")}
      heading={headings[flow.step - 1] ?? ""}
      step={flow.step}
      total={flow.total}
      onBack={flow.back}
      actions={
        flow.step < 7 ? (
          next
        ) : (
          <Button asChild size="lg">
            <Link href="/voorbeeld/vraag">{t("ready.cta")}</Link>
          </Button>
        )
      }
    >
      {flow.step === 1 ? (
        <RadioCards
          name="who"
          legend={t("who.heading")}
          legendHidden
          hint={t("who.hint")}
          options={whoOptions}
          value={who}
          onChange={setWho}
        />
      ) : null}

      {flow.step === 2 ? (
        <>
          <div className="flex flex-col gap-2">
            <label htmlFor="teller-naam" className="text-lg font-medium">
              {t("name.nameLabel")}
            </label>
            <p id="teller-naam-hint" className="text-taupe-dark">
              {t("name.nameHint")}
            </p>
            <input
              id="teller-naam"
              aria-describedby="teller-naam-hint"
              autoComplete="off"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={input}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="teller-relatie" className="text-lg font-medium">
              {t("name.relationLabel")}
            </label>
            <p id="teller-relatie-hint" className="text-taupe-dark">
              {t("name.relationHint")}
            </p>
            <input
              id="teller-relatie"
              aria-describedby="teller-relatie-hint"
              autoComplete="off"
              value={relation}
              onChange={(event) => setRelation(event.target.value)}
              className={input}
            />
          </div>
        </>
      ) : null}

      {flow.step === 3 ? (
        <CheckChips
          name="themes"
          legend={t("themes.heading")}
          legendHidden
          hint={t("themes.hint")}
          options={themes.map((theme) => ({ value: theme, label: theme }))}
          values={chosen}
          onChange={setChosen}
        />
      ) : null}

      {flow.step === 4 ? (
        <RadioCards
          name="rhythm"
          legend={t("rhythm.heading")}
          legendHidden
          options={rhythmOptions}
          value={rhythm}
          onChange={setRhythm}
        />
      ) : null}

      {flow.step === 5 ? (
        <RadioCards
          name="channel"
          legend={t("channel.heading")}
          legendHidden
          options={channelOptions}
          value={channel}
          onChange={setChannel}
        />
      ) : null}

      {flow.step === 6 ? (
        <RadioCards
          name="cover"
          legend={t("cover.heading")}
          legendHidden
          hint={t("cover.hint")}
          options={coverOptions}
          value={cover}
          onChange={setCover}
        />
      ) : null}

      {flow.step === 7 ? (
        <>
          <p className="text-taupe-dark">{t("ready.body")}</p>
          <Card>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[auto_1fr]">
              {[
                [t("ready.forLabel"), labelOf(whoOptions, who)],
                [
                  t("ready.tellerLabel"),
                  name.trim()
                    ? `${name.trim()}${relation.trim() ? ` (${relation.trim()})` : ""}`
                    : t("ready.noName"),
                ],
                [t("ready.themesLabel"), chosen.length ? chosen.join(", ") : t("ready.noThemes")],
                [t("ready.rhythmLabel"), labelOf(rhythmOptions, rhythm)],
                [t("ready.channelLabel"), labelOf(channelOptions, channel)],
                [t("ready.coverLabel"), labelOf(coverOptions, cover)],
              ].map(([term, value]) => (
                <div key={term} className="contents">
                  <dt className="text-taupe-dark">{term}</dt>
                  <dd className="text-ink font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <p className="text-taupe-dark">{t("ready.elder")}</p>
        </>
      ) : null}
    </FlowFrame>
  );
}
