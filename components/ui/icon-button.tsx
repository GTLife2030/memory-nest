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
        "min-target inline-flex items-center justify-center rounded-pill text-taupe-dark transition-colors duration-200 ease-out hover:bg-sand hover:text-ink disabled:opacity-60",
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
