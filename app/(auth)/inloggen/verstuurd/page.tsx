import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { Button, Card } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.sent");
  return { title: t("title") };
}

export default async function LinkSentPage({ searchParams }: PageProps<"/inloggen/verstuurd">) {
  const [t, params] = await Promise.all([getTranslations("auth.sent"), searchParams]);
  // Only echo the address back when it really is one; it is rendered as text either way.
  const email = z.email().max(254).safeParse(params.e);

  return (
    <Card className="p-8">
      <h1 className="text-3xl">{t("heading")}</h1>
      <p className="mt-4 text-lg">{email.success ? t("body", { email: email.data }) : t("bodyNoEmail")}</p>
      <p className="mt-4 text-taupe-dark">{t("spam")}</p>
      <Button asChild variant="secondary" className="mt-8">
        <Link href="/inloggen">{t("again")}</Link>
      </Button>
    </Card>
  );
}
