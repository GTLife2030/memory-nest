import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button, Card } from "@/components/ui";
import { supabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/safe-redirect";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("title") };
}

export default async function LoginPage({ searchParams }: PageProps<"/inloggen">) {
  const [t, params] = await Promise.all([getTranslations("auth"), searchParams]);
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  const linkFailed = params.fout === "link";

  if (!supabaseConfigured) {
    return (
      <Card className="p-8">
        <h1 className="text-3xl">{t("notConfigured.heading")}</h1>
        <p className="mt-4 text-taupe-dark">{t("notConfigured.body")}</p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/nest/demo">{t("notConfigured.cta")}</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <h1 className="text-3xl">{t("heading")}</h1>
      <p className="mt-4 text-taupe-dark">{t("lead")}</p>
      {linkFailed ? (
        <p role="alert" className="mt-6 rounded-card border border-error bg-cream p-4 font-medium text-error">
          {t("errors.linkExpired")}
        </p>
      ) : null}
      <LoginForm next={next} />
    </Card>
  );
}
