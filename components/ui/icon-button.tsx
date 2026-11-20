import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type IconButtonProps = Omit<ComponentProps<"button">, "aria-label" | "children"> & {
  /** Required: an icon-only button has no visible text, so this is its accessible name. */
  label: string;
  children: ReactNode;
};

export function IconButton({ label, className, children, type, ...props }: IconButtonProps) {
  return (
    <button
      type={type ?? "button"}
      aria-label={label}
      title={label}
      className={cn(
        "min-target rounded-pill text-taupe-dark hover:bg-sand hover:text-ink inline-flex items-center justify-center transition-colors duration-200 ease-out disabled:opacity-60",
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="inline-flex">
        {children}
      </span>
    </button>
  );
}
