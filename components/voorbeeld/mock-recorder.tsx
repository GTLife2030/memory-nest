"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { RecordButton, Waveform, type RecordState } from "@/components/ui";
import { formatClock, waveLevels } from "@/lib/voorbeeld/data";

type MockRecorderProps = {
  /** Reports the elapsed seconds whenever they change, so the flow knows something was recorded. */
  onElapsed?: (seconds: number) => void;
};

/**
 * Looks and behaves like the recorder, without touching the microphone: the clock runs while
 * "recording" and stops on pause. There is no maximum and no countdown.
 */
export function MockRecorder({ onElapsed }: MockRecorderProps) {
  const t = useTranslations("voorbeeld.recorder");
  const [state, setState] = useState<RecordState>("idle");
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (state !== "recording") return;
    const timer = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [state]);

  useEffect(() => {
    onElapsed?.(seconds);
  }, [seconds, onElapsed]);

  const toggle = () => setState((current) => (current === "recording" ? "paused" : "recording"));
  const bars = Math.min(8 + seconds * 2, 40);

  return (
    <div className="rounded-card bg-linen shadow-soft flex flex-col items-center gap-6 p-8">
      <RecordButton
        state={state}
        onToggle={toggle}
        labels={{ idle: t("idle"), recording: t("recording"), paused: t("paused") }}
        elapsed={state === "idle" ? "" : formatClock(seconds)}
      />
      {state !== "idle" ? (
        <Waveform levels={waveLevels(3, bars)} label={t("waveform")} className="max-w-sm" />
      ) : null}
    </div>
  );
}
