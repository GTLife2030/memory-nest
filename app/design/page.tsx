import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import {
  Button,
  Card,
  EmptyState,
  PhotoFrame,
  ProgressGentle,
  QuestionCard,
  StoryCard,
  TimelineItem,
} from "@/components/ui";
import { colors } from "@/lib/design/tokens";
import { FeedbackDemo, RecordDemo } from "./interactive";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("design");
  return { title: t("title") };
}

const swatches: { name: keyof typeof colors; className: string }[] = [
  { name: "cream", className: "bg-cream" },
  { name: "sand", className: "bg-sand" },
  { name: "linen", className: "bg-linen" },
  { name: "taupe", className: "bg-taupe" },
  { name: "taupeDark", className: "bg-taupe-dark" },
  { name: "terracotta", className: "bg-terracotta" },
  { name: "terracottaDark", className: "bg-terracotta-dark" },
  { name: "rose", className: "bg-rose" },
  { name: "ink", className: "bg-ink" },
  { name: "success", className: "bg-success" },
  { name: "warning", className: "bg-warning" },
  { name: "error", className: "bg-error" },
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-sand border-t py-12">
      <h2 id={id} className="text-3xl">
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

/** Living style guide: every component in every state. The a11y tests run against this page. */
export default async function DesignPage() {
  const t = await getTranslations("design");
  return (
    <>
      <SiteHeader />
      <main id="inhoud" className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
        <h1 className="text-4xl sm:text-5xl">{t("heading")}</h1>
        <p className="text-taupe-dark mt-4 mb-12 text-xl">{t("lead")}</p>

        <Section id="kleuren" title={t("sections.colors")}>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {swatches.map(({ name, className }) => (
              <li key={name} className="rounded-card bg-linen shadow-soft overflow-hidden">
                <div className={`h-20 ${className}`} />
                <p className="px-3 pt-2 text-sm font-medium">{name}</p>
                <p className="text-taupe-dark px-3 pb-3 text-sm">{colors[name]}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="letters" title={t("sections.type")}>
          <div className="flex flex-col gap-8">
            <div>
              <p className="text-taupe-dark text-sm">{t("type.headingLabel")}</p>
              <p className="font-heading text-4xl">{t("type.heading")}</p>
            </div>
            <div>
              <p className="text-taupe-dark text-sm">{t("type.bodyLabel")}</p>
              <p>{t("type.body")}</p>
            </div>
            <div>
              <p className="text-taupe-dark text-sm">{t("type.bookLabel")}</p>
              <p className="font-book text-xl">{t("type.book")}</p>
            </div>
          </div>
        </Section>

        <Section id="knoppen" title={t("sections.buttons")}>
          <div className="flex flex-wrap items-center gap-4">
            <Button>{t("buttons.primary")}</Button>
            <Button variant="secondary">{t("buttons.secondary")}</Button>
            <Button variant="ghost">{t("buttons.ghost")}</Button>
            <Button variant="danger">{t("buttons.danger")}</Button>
            <Button disabled>{t("buttons.disabled")}</Button>
            <Button size="lg">{t("buttons.large")}</Button>
          </div>
        </Section>

        <Section id="kaarten" title={t("sections.cards")}>
          <div className="flex flex-col gap-5">
            <Card>
              <p>{t("card.plain")}</p>
            </Card>
            <StoryCard
              title={t("story.title")}
              href="#kaarten"
              meta={t("story.meta")}
              excerpt={t("story.excerpt")}
              hasAudioLabel={t("record.waveform")}
              photo={
                <PhotoFrame className="p-1.5 pb-2">
                  <SepiaPlaceholder label={t("photo.alt")} />
                </PhotoFrame>
              }
            />
            <StoryCard
              title={t("story.draftTitle")}
              href="#kaarten"
              meta={t("story.draftMeta")}
              excerpt={t("story.excerpt")}
              statusLabel={t("story.draftStatus")}
              aiLabel={t("photo.badge")}
            />
          </div>
        </Section>

        <Section id="vraagkaart" title={t("sections.question")}>
          <QuestionCard
            eyebrow={t("sections.question")}
            question={t("question.text")}
            askedBy={t("question.askedBy")}
            actions={
              <>
                <Button size="lg">{t("buttons.primary")}</Button>
                <Button variant="secondary">{t("buttons.secondary")}</Button>
                <Button variant="ghost">{t("buttons.ghost")}</Button>
              </>
            }
          />
        </Section>

        <Section id="opnemen" title={t("sections.record")}>
          <RecordDemo />
        </Section>

        <Section id="foto" title={t("sections.photo")}>
          <div className="flex flex-wrap gap-10">
            <PhotoFrame caption={t("photo.caption")} tilt="left" className="w-64">
              <SepiaPlaceholder label={t("photo.alt")} />
            </PhotoFrame>
            <PhotoFrame
              caption={t("photo.caption")}
              badge={t("photo.badge")}
              tilt="right"
              className="w-64"
            >
              <SepiaPlaceholder label={t("photo.alt")} />
            </PhotoFrame>
          </div>
        </Section>

        <Section id="tijdlijn" title={t("sections.timeline")}>
          <ol className="ml-2">
            <TimelineItem
              dateLabel={t("timeline.one.date")}
              dateTime="1946"
              title={t("timeline.one.title")}
            />
            <TimelineItem
              dateLabel={t("timeline.two.date")}
              title={t("timeline.two.title")}
              href="#tijdlijn"
            >
              <p>{t("timeline.two.body")}</p>
            </TimelineItem>
            <TimelineItem
              dateLabel={t("timeline.three.date")}
              dateTime="2026-03-14"
              title={t("timeline.three.title")}
            />
          </ol>
        </Section>

        <Section id="voortgang" title={t("sections.progress")}>
          <ProgressGentle done={3} total={8} label={t("progress.label")} className="max-w-md" />
        </Section>

        <Section id="meldingen" title={t("sections.feedback")}>
          <FeedbackDemo />
        </Section>

        <Section id="leeg" title={t("sections.empty")}>
          <Card>
            <EmptyState
              title={t("empty.title")}
              body={t("empty.body")}
              action={<Button>{t("empty.action")}</Button>}
            />
          </Card>
        </Section>
      </main>
    </>
  );
}

/** Stand-in for a scanned photo until real media exists. */
function SepiaPlaceholder({ label }: { label: string }) {
  return (
    <svg role="img" aria-label={label} viewBox="0 0 4 3" className="block w-full">
      <defs>
        <linearGradient id="sepia" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d8c4a4" />
          <stop offset="1" stopColor="#8b7d6b" />
        </linearGradient>
      </defs>
      <rect width="4" height="3" fill="url(#sepia)" />
      <rect x="0.7" y="1.1" width="2.6" height="1.9" fill="#5e5346" opacity="0.55" />
      <rect x="1" y="1.5" width="0.9" height="0.8" fill="#eadfcf" opacity="0.7" />
      <rect x="2.3" y="1.9" width="0.6" height="1.1" fill="#2e2a26" opacity="0.6" />
    </svg>
  );
}
