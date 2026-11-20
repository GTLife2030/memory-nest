import { cn } from "@/lib/cn";

type ProgressGentleProps = {
  done: number;
  total: number;
  /** Full sentence, e.g. "3 van de 8 verhalen staan in het boek". Shown and read aloud. */
  label: string;
  className?: string;
};

/**
 * Quiet progress: where you are, never how far behind. No streaks, no percentages, no colour
 * change when "late". Safe for the limited-time persona.
 */
export function ProgressGentle({ done, total, label, className }: ProgressGentleProps) {
  const safeTotal = Math.max(total, 1);
  const value = Math.min(Math.max(done, 0), safeTotal);
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-valuenow={value}
        aria-valuetext={label}
        aria-label={label}
        className="flex gap-1.5"
      >
        {Array.from({ length: safeTotal }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={cn("rounded-pill h-2 flex-1", index < value ? "bg-taupe-dark" : "bg-sand")}
          />
        ))}
      </div>
      <p className="text-taupe-dark text-sm">{label}</p>
    </div>
  );
}
