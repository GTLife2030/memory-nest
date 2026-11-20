import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "min-target inline-flex items-center justify-center gap-2 rounded-pill px-6 font-sans font-medium transition-[background-color,box-shadow,transform] duration-200 ease-out active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-terracotta-dark text-white shadow-soft hover:bg-ink",
        secondary: "border border-taupe bg-linen text-ink hover:bg-sand",
        ghost: "text-terracotta-dark underline-offset-4 hover:bg-sand hover:underline",
        danger: "border border-error bg-linen text-error hover:bg-sand",
      },
      size: {
        md: "text-base",
        lg: "px-8 py-3 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...(asChild ? {} : { type: type ?? "button" })}
      {...props}
    />
  );
}
