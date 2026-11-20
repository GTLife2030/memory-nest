import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  title: string;
  body: string;
  /** Decorative illustration; hidden from assistive technology. */
  illustration?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, body, illustration, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      {illustration ? (
        <div aria-hidden="true" className="mb-6 text-taupe">
          {illustration}
        </div>
      ) : null}
      <h2 className="text-2xl">{title}</h2>
      <p className="mt-3 text-taupe-dark">{body}</p>
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  );
}
