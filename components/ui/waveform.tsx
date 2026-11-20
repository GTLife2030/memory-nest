import { cn } from "@/lib/cn";

type WaveformProps = {
  /** Amplitudes between 0 and 1. */
  levels: number[];
  /** Describes the audio for screen readers, e.g. "Geluidsfragment van 34 seconden". */
  label: string;
  /** Fraction (0–1) already played; those bars are drawn darker. */
  progress?: number;
  className?: string;
};

const BAR = 4;
const GAP = 3;
const HEIGHT = 48;

export function Waveform({ levels, label, progress = 0, className }: WaveformProps) {
  const width = levels.length * (BAR + GAP) - GAP;
  const playedUntil = Math.round(levels.length * Math.min(Math.max(progress, 0), 1));
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${Math.max(width, 1)} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={cn("h-12 w-full", className)}
    >
      {levels.map((level, index) => {
        const h = Math.max(3, Math.min(Math.max(level, 0), 1) * HEIGHT);
        return (
          <rect
            key={index}
            x={index * (BAR + GAP)}
            y={(HEIGHT - h) / 2}
            width={BAR}
            height={h}
            rx={2}
            className={index < playedUntil ? "fill-terracotta-dark" : "fill-taupe"}
          />
        );
      })}
    </svg>
  );
}
