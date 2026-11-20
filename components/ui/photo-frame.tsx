import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PhotoFrameProps = {
  /** The image element (or a placeholder). The frame only supplies the paper border. */
  children: ReactNode;
  caption?: string;
  /** Shown as a small label, e.g. "bewerkt met AI" for a restored copy. */
  badge?: string;
  tilt?: "none" | "left" | "right";
  className?: string;
};

export function PhotoFrame({
  children,
  caption,
  badge,
  tilt = "none",
  className,
}: PhotoFrameProps) {
  return (
    <figure
      className={cn(
        "shadow-lift inline-block bg-white p-3 pb-4",
        tilt === "left" && "-rotate-1",
        tilt === "right" && "rotate-1",
        className,
      )}
    >
      <div className="bg-sand relative overflow-hidden">
        {children}
        {badge ? (
          <span className="rounded-pill bg-ink absolute bottom-2 left-2 px-3 py-0.5 text-sm text-white">
            {badge}
          </span>
        ) : null}
      </div>
      {caption ? (
        <figcaption className="font-book text-taupe-dark pt-3 text-center text-base italic">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
