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

export function PhotoFrame({ children, caption, badge, tilt = "none", className }: PhotoFrameProps) {
  return (
    <figure
      className={cn(
        "inline-block bg-white p-3 pb-4 shadow-lift",
        tilt === "left" && "-rotate-1",
        tilt === "right" && "rotate-1",
        className,
      )}
    >
      <div className="relative overflow-hidden bg-sand">
        {children}
        {badge ? (
          <span className="absolute bottom-2 left-2 rounded-pill bg-ink px-3 py-0.5 text-sm text-white">
            {badge}
          </span>
        ) : null}
      </div>
      {caption ? (
        <figcaption className="pt-3 text-center font-book text-base text-taupe-dark italic">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
