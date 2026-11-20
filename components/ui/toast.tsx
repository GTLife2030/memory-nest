"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { createContext, use, useCallback, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconButton } from "./icon-button";

export type ToastTone = "neutral" | "success" | "error";
type ToastMessage = { id: number; title: string; body?: string; tone: ToastTone };
type ShowToast = (message: Omit<ToastMessage, "id" | "tone"> & { tone?: ToastTone }) => void;

const ToastContext = createContext<ShowToast | null>(null);

export function useToast(): ShowToast {
  const show = use(ToastContext);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>");
  return show;
}

const tones: Record<ToastTone, string> = {
  neutral: "border-taupe",
  success: "border-success",
  error: "border-error",
};

type ToastProviderProps = {
  children: ReactNode;
  closeLabel: string;
  /** Accessible name of the notification region, e.g. "Meldingen". */
  regionLabel: string;
};

/** Messages stay for eight seconds and pause on hover or focus, so nobody has to read fast. */
export function ToastProvider({ children, closeLabel, regionLabel }: ToastProviderProps) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const show = useCallback<ShowToast>((message) => {
    setMessages((current) => [...current, { tone: "neutral", ...message, id: Date.now() + current.length }]);
  }, []);
  const remove = useCallback((id: number) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);
  const value = useMemo(() => show, [show]);

  return (
    <ToastContext value={value}>
      <ToastPrimitive.Provider duration={8000} label={regionLabel} swipeDirection="right">
        {children}
        {messages.map((message) => (
          <ToastPrimitive.Root
            key={message.id}
            onOpenChange={(open) => {
              if (!open) remove(message.id);
            }}
            className={cn(
              "flex animate-rise items-start gap-3 rounded-card border-l-4 bg-linen p-5 shadow-lift",
              tones[message.tone],
            )}
          >
            <div className="min-w-0 flex-1">
              <ToastPrimitive.Title className="font-medium text-ink">{message.title}</ToastPrimitive.Title>
              {message.body ? (
                <ToastPrimitive.Description className="mt-1 text-taupe-dark">
                  {message.body}
                </ToastPrimitive.Description>
              ) : null}
            </div>
            <ToastPrimitive.Close asChild>
              <IconButton label={closeLabel} className="-mt-2 -mr-2">
                <X className="size-5" />
              </IconButton>
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport label={`${regionLabel} ({hotkey})`} className="fixed right-4 bottom-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-3 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext>
  );
}
