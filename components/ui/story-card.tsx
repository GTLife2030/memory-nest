import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type StoryCardProps = {
  title: string;
  href: string;
  excerpt: string;
  /** Who told it and when it happened, already formatted, e.g. "Oma Truus · jaren vijftig". */
  meta: string;
  /** "Concept", "Nog nalezen"; omitted once approved. */
  statusLabel?: string;
  /** Shown until the teller approves an AI-edited story. */
  aiLabel?: string;
  hasAudioLabel?: string;
  photo?: ReactNode;
  /** Heading level of the title, so the card fits the outline of the page it is on. */
  headingLevel?: 2 | 3;
  className?: string;
};

export function StoryCard({
  title,
  href,
  excerpt,
  meta,
  statusLabel,
  aiLabel,
  hasAudioLabel,
  photo,
  headingLevel = 3,
  className,
}: StoryCardProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <article
      className={cn(
        "group rounded-card bg-linen shadow-soft focus-within:shadow-lift hover:shadow-lift relative flex gap-5 p-6 transition-shadow duration-200 ease-out",
        className,
      )}
    >
      {photo ? <div className="hidden w-28 shrink-0 sm:block">{photo}</div> : null}
      <div className="min-w-0 flex-1">
        <p className="text-taupe-dark text-sm">{meta}</p>
        <Heading className="mt-1 text-2xl">
          <a href={href} className="after:rounded-card after:absolute after:inset-0">
            {title}
          </a>
        </Heading>
        <p className="font-book text-ink mt-2 line-clamp-3 text-lg">{excerpt}</p>
        {statusLabel || aiLabel || hasAudioLabel ? (
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            {[statusLabel, aiLabel, hasAudioLabel].filter(Boolean).map((label) => (
              <li
                key={label}
                className="rounded-pill border-taupe text-taupe-dark border px-3 py-0.5"
              >
                {label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
