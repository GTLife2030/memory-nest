import { StoryCard } from "@/components/ui";
import type { MockStory } from "@/lib/voorbeeld/data";
import { excerpt, whenLabel } from "@/lib/voorbeeld/dates";

type Labels = { audio: string; needsReview: string; ai: string };

export function StoryList({
  items,
  labels,
  headingLevel = 3,
}: {
  items: MockStory[];
  labels: Labels;
  headingLevel?: 2 | 3;
}) {
  return (
    <ul className="flex flex-col gap-5">
      {items.map((story) => (
        <li key={story.id}>
          <StoryCard
            headingLevel={headingLevel}
            title={story.title}
            href={`/voorbeeld/nest/verhalen/${story.id}`}
            meta={`${story.teller} · ${whenLabel(story.date, story.precision)}`}
            excerpt={excerpt(story)}
            statusLabel={story.status === "needs_review" ? labels.needsReview : undefined}
            aiLabel={story.status === "needs_review" ? labels.ai : undefined}
            hasAudioLabel={story.status === "approved" ? labels.audio : undefined}
          />
        </li>
      ))}
    </ul>
  );
}
