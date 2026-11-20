import { cn } from "@/lib/cn";

type DemoBadgeProps = {
  label: string;
  /** Explains which services are simulated; exposed as a tooltip and to screen readers. */
  detail: string;
  className?: string;
};

/** Small, honest marker that one or more external services are simulated. */
export function DemoBadge({ label, detail, className }: DemoBadgeProps) {
  return (
    <span
      title={detail}
      data-testid="demo-badge"
      className={cn(
        "inline-flex items-center gap-2 rounded-pill border border-taupe bg-linen px-3 py-0.5 text-sm text-taupe-dark",
        className,
      )}
    >
      <span aria-hidden="true" className="size-2 rounded-pill bg-warning" />
      {label}
      <span className="sr-only">{detail}</span>
    </span>
  );
}
