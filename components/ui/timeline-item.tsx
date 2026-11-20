import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type TimelineItemProps = {
  /** Already formatted with its precision: "14 maart 2026", "1953", "jaren vijftig". */
  dateLabel: string;
  /** Machine-readable date when known to the day/month/year. */
  dateTime?: string;
  title: string;
  href?: string;
  children?: ReactNode;
  className?: string;
};

/** One moment on the timeline. Use inside an <ol>. */
export function TimelineItem({
  dateLabel,
  dateTime,
  title,
  href,
  children,
  className,
}: TimelineItemProps) {
  return (
    <li className={cn("border-sand relative border-l-2 pb-8 pl-8 last:pb-0", className)}>
      <span
        aria-hidden="true"
        className="rounded-pill border-terracotta-dark bg-cream absolute top-1.5 -left-[9px] size-4 border-2"
      />
      <time
        dateTime={dateTime}
        className="text-taupe-dark text-sm font-medium tracking-wide uppercase"
      >
        {dateLabel}
      </time>
      <h3 className="mt-1 text-xl">
        {href ? (
          <a href={href} className="underline-offset-4 hover:underline">
            {title}
          </a>
        ) : (
          title
        )}
      </h3>
      {children ? <div className="text-ink mt-2">{children}</div> : null}
    </li>
  );
}
