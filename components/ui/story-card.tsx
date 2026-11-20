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
  className,
}: StoryCardProps) {
  return (
    <article
      className={cn(
        "group relative flex gap-5 rounded-card bg-linen p-6 shadow-soft transition-shadow duration-200 ease-out focus-within:shadow-lift hover:shadow-lift",
        className,
      )}
    >
      {photo ? <div className="hidden w-28 shrink-0 sm:block">{photo}</div> : null}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-taupe-dark">{meta}</p>
        <h3 className="mt-1 text-2xl">
          <a href={href} className="after:absolute after:inset-0 after:rounded-card">
            {title}
          </a>
        </h3>
        <p className="mt-2 line-clamp-3 font-book text-lg text-ink">{excerpt}</p>
        {statusLabel || aiLabel || hasAudioLabel ? (
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            {[statusLabel, aiLabel, hasAudioLabel].filter(Boolean).map((label) => (
              <li key={label} className="rounded-pill border border-taupe px-3 py-0.5 text-taupe-dark">
                {label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
