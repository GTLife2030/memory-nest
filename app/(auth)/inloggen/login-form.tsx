"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui";
import { signIn, type SignInState } from "./actions";

const initial: SignInState = { error: null, email: "" };
const input = "min-target rounded-card border border-taupe bg-white px-4 py-3 text-lg text-ink";

export function LoginForm({ next }: { next: string }) {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState(signIn, initial);
  const emailWrong = state.error === "invalidEmail";
  const passwordWrong = state.error === "missingPassword";

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
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={state.email}
          aria-describedby={state.error ? "email-hint login-error" : "email-hint"}
          aria-invalid={emailWrong ? true : undefined}
          className={input}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-lg font-medium">
          {t("passwordLabel")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-describedby={state.error ? "login-error" : undefined}
          aria-invalid={passwordWrong ? true : undefined}
          className={input}
        />
      </div>
      <p id="login-error" role="alert" className="text-error min-h-[1.6em] font-medium">
        {state.error ? t(`errors.${state.error}`) : null}
      </p>
      <Button type="submit" size="lg" aria-disabled={pending} disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
      <p className="text-taupe-dark">{t("forgot")}</p>
    </form>
  );
}
