"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button, Waveform } from "@/components/ui";
import { formatClock, waveLevels, type MockParagraph } from "@/lib/voorbeeld/data";

type StoryParagraphsProps = {
  paragraphs: MockParagraph[];
  /** Heading of the panel that shows the original fragment. */
  sourceHeading: string;
};

/**
 * A story whose paragraphs can be tapped to reveal what was literally said: the proof that
 * nothing was added. Each paragraph is a real button that discloses its own source panel.
 */
export function StoryParagraphs({ paragraphs, sourceHeading }: StoryParagraphsProps) {
  const t = useTranslations("voorbeeld");
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-2">
      {paragraphs.map((paragraph, index) => {
        const expanded = open === index;
        const time = t("verhaal.review.sourceTime", {
          start: formatClock(paragraph.startS),
          end: formatClock(paragraph.endS),
        });
        return (
          <div key={paragraph.startS}>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={`bron-${index}`}
              onClick={() => setOpen(expanded ? null : index)}
              className="rounded-card font-book text-ink hover:bg-sand aria-expanded:bg-sand w-full p-3 text-left text-xl leading-relaxed transition-colors duration-200 ease-out"
            >
              {paragraph.text}
            </button>
            <div
              id={`bron-${index}`}
              hidden={!expanded}
              className="rounded-card border-taupe bg-linen mx-3 mb-4 border p-5"
            >
              <p className="text-ink font-medium">{sourceHeading}</p>
              <p className="text-taupe-dark text-sm">{time}</p>
              <Waveform
                levels={waveLevels(index + 2, 36)}
                label={time}
                progress={0.3}
                className="mt-3"
              />
              <p className="text-taupe-dark mt-3 italic">{paragraph.spoken}</p>
              <Button variant="ghost" className="mt-2" onClick={() => setOpen(null)}>
                {t("verhaal.review.sourceClose")}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
