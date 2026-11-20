"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button, ProgressGentle } from "@/components/ui";

/** Step state for a mock-up flow. `initial` comes from `?stap=` so every step has an address. */
export function useFlow(total: number, initial = 1) {
  const [step, setStep] = useState(Math.min(Math.max(initial, 1), total));
  const go = useCallback((next: number) => setStep(Math.min(Math.max(next, 1), total)), [total]);
  return { step, total, go, next: () => go(step + 1), back: () => go(step - 1) };
}

type FlowFrameProps = {
  /** Name of the flow, shown small above the step heading. */
  flowTitle: string;
  /** Heading of the current step: the page's single h1. */
  heading: string;
  step: number;
  total: number;
  onBack?: () => void;
  children: ReactNode;
  /** Primary and secondary actions of this step. */
  actions?: ReactNode;
};

/**
 * Shared frame of every mock-up flow: where you are, one heading, one set of actions.
 * Moving to another step moves keyboard and screen-reader focus to the new heading.
 */
export function FlowFrame({
  flowTitle,
  heading,
  step,
  total,
  onBack,
  children,
  actions,
}: FlowFrameProps) {
  const t = useTranslations("voorbeeld");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0 });
    const url = new URL(window.location.href);
    url.searchParams.set("stap", String(step));
    window.history.replaceState(null, "", url);
  }, [step]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-taupe-dark text-sm font-medium tracking-wide uppercase">{flowTitle}</p>
        <ProgressGentle done={step} total={total} label={t("stepOf", { step, total })} />
      </div>
      <h1 ref={headingRef} tabIndex={-1} className="text-3xl outline-none sm:text-4xl">
        {heading}
      </h1>
      <div className="flex flex-col gap-6">{children}</div>
      <div className="flex flex-wrap items-center gap-3">
        {actions}
        {onBack && step > 1 ? (
          <Button variant="ghost" onClick={onBack}>
            {t("back")}
          </Button>
        ) : null}
      </div>
      <p>
        <Link href="/voorbeeld" className="text-terracotta-dark underline underline-offset-4">
          {t("backToMap")}
        </Link>
      </p>
    </div>
  );
}
