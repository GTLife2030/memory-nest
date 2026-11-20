"use client";

import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Button,
  Dialog,
  DialogClose,
  IconButton,
  RecordButton,
  useToast,
  Waveform,
  type RecordState,
} from "@/components/ui";

const levels = [
  0.2, 0.35, 0.6, 0.45, 0.8, 0.95, 0.7, 0.5, 0.3, 0.55, 0.75, 0.9, 0.65, 0.4, 0.25, 0.5, 0.7, 0.85,
  0.6, 0.35, 0.2, 0.3, 0.45, 0.25,
];

export function RecordDemo() {
  const t = useTranslations("design.record");
  const [state, setState] = useState<RecordState>("idle");
  const next: Record<RecordState, RecordState> = {
    idle: "recording",
    recording: "paused",
    paused: "recording",
  };
  return (
    <div className="flex flex-col items-center gap-8">
      <RecordButton
        state={state}
        onToggle={() => setState(next[state])}
        labels={{ idle: t("idle"), recording: t("recording"), paused: t("paused") }}
        elapsed={state === "idle" ? "" : "0:34"}
      />
      <Waveform levels={levels} label={t("waveform")} progress={0.4} className="max-w-md" />
    </div>
  );
}

export function FeedbackDemo() {
  const t = useTranslations("design.feedback");
  const common = useTranslations("common");
  const buttons = useTranslations("design.buttons");
  const toast = useToast();
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button
        variant="secondary"
        onClick={() => toast({ title: t("toastTitle"), body: t("toastBody"), tone: "success" })}
      >
        {t("toastButton")}
      </Button>
      <Dialog
        trigger={<Button variant="secondary">{t("dialogButton")}</Button>}
        title={t("dialogTitle")}
        description={t("dialogBody")}
        closeLabel={common("close")}
        footer={
          <>
            <DialogClose asChild>
              <Button variant="ghost">{t("dialogCancel")}</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button>{t("dialogConfirm")}</Button>
            </DialogClose>
          </>
        }
      />
      <IconButton label={buttons("icon")}>
        <Play className="size-6" />
      </IconButton>
    </div>
  );
}
