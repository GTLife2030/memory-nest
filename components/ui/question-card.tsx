import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type QuestionCardProps = {
  /** Small line above the question, e.g. "Vraag van deze week · Jeugd". */
  eyebrow: string;
  question: string;
  /** Who asked it, when a child wrote the question themselves. */
  askedBy?: string;
  /** The primary action first ("Vertel het"), then quieter ones ("Liever typen", "Overslaan"). */
  actions: ReactNode;
  className?: string;
};

export function QuestionCard({ eyebrow, question, askedBy, actions, className }: QuestionCardProps) {
  return (
    <section className={cn("paper rounded-card p-8 shadow-soft sm:p-10", className)}>
      <p className="text-sm font-medium tracking-wide text-taupe-dark uppercase">{eyebrow}</p>
      <h2 className="mt-3 text-3xl sm:text-4xl">{question}</h2>
      {askedBy ? <p className="mt-3 font-book text-lg text-taupe-dark italic">{askedBy}</p> : null}
      <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div>
    </section>
  );
}
