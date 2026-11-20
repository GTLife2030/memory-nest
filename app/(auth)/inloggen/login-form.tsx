"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui";
import { requestMagicLink, type SignInState } from "./actions";

const initial: SignInState = { error: null, email: "" };

export function LoginForm({ next }: { next: string }) {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState(requestMagicLink, initial);

  return (
    <form action={action} noValidate className="mt-8 flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-lg font-medium">
          {t("emailLabel")}
        </label>
        <p id="email-hint" className="text-taupe-dark">
          {t("emailHint")}
        </p>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={state.email}
          aria-describedby={state.error ? "email-hint email-error" : "email-hint"}
          aria-invalid={state.error === "invalidEmail" ? true : undefined}
          className="min-target rounded-card border border-taupe bg-white px-4 py-3 text-lg text-ink"
        />
        <p id="email-error" role="alert" className="min-h-[1.6em] font-medium text-error">
          {state.error ? t(`errors.${state.error}`) : null}
        </p>
      </div>
      <Button type="submit" size="lg" aria-disabled={pending} disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
