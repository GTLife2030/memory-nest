import { cn } from "@/lib/cn";

/** Wordmark with a small nest mark. `label` is the brand name from the messages file. */
export function Logo({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-heading text-xl text-ink", className)}>
      <svg aria-hidden="true" viewBox="0 0 32 32" className="size-8 text-terracotta-dark">
        <path
          d="M4 17c0 6.1 5.4 10 12 10s12-3.9 12-10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M7.5 17.5c1.8 3.6 5 5.5 8.5 5.5s6.7-1.9 8.5-5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.55"
        />
        <ellipse cx="16" cy="13" rx="3.6" ry="4.6" fill="currentColor" />
      </svg>
      {label}
    </span>
  );
}
