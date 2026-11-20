"use client";

import { Mic, Pause } from "lucide-react";
import { cn } from "@/lib/cn";

export type RecordState = "idle" | "recording" | "paused";

type RecordButtonProps = {
  state: RecordState;
  onToggle: () => void;
  /** Visible text under the button for each state; the button is never icon-only. */
  labels: Record<RecordState, string>;
  /** Elapsed time, already formatted (e.g. "0:34"). Announced politely while recording. */
  elapsed?: string;
  disabled?: boolean;
  className?: string;
};

/** The one big button. No timer pressure, no countdown: recording has no time-out. */
export function RecordButton({ state, onToggle, labels, elapsed, disabled, className }: RecordButtonProps) {
  const recording = state === "recording";
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={recording}
        className={cn(
          "relative flex size-28 items-center justify-center rounded-pill text-white shadow-lift transition-colors duration-200 ease-out disabled:opacity-60",
          recording ? "bg-ink" : "bg-terracotta-dark hover:bg-ink",
        )}
      >
        {recording ? (
          <span aria-hidden="true" className="absolute inset-0 animate-ring rounded-pill bg-terracotta" />
        ) : null}
        <span aria-hidden="true" className="relative">
          {recording ? <Pause className="size-10" /> : <Mic className="size-10" />}
        </span>
        <span className="sr-only">{labels[state]}</span>
      </button>
      <p aria-hidden="true" className="text-lg font-medium text-ink">
        {labels[state]}
      </p>
      <p role="timer" aria-live="off" className="min-h-[1.6em] text-taupe-dark tabular-nums">
        {elapsed}
      </p>
    </div>
  );
}
