"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconButton } from "./icon-button";

type DialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  title: string;
  description: string;
  closeLabel: string;
  children?: ReactNode;
  /** Buttons, primary last. */
  footer?: ReactNode;
  className?: string;
};

/** Modal dialog with focus trap, Escape to close and a visible close button. */
export function Dialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  closeLabel,
  children,
  footer,
  className,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-ink/50" />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[min(92vw,34rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card bg-linen p-8 shadow-lift",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <DialogPrimitive.Title className="font-heading text-2xl">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <IconButton label={closeLabel} className="-mt-2 -mr-2">
                <X className="size-6" />
              </IconButton>
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="mt-3 text-taupe-dark">
            {description}
          </DialogPrimitive.Description>
          {children ? <div className="mt-6">{children}</div> : null}
          {footer ? <div className="mt-8 flex flex-wrap justify-end gap-3">{footer}</div> : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const DialogClose = DialogPrimitive.Close;
