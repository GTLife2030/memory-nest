import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/layout/site-header";
import { Button, Card } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing");
  return {
    title: { absolute: t("title") },
    description: t("description"),
    robots: { index: true, follow: true },
  };
}

export default async function LandingPage() {
  const [t, common] = await Promise.all([getTranslations("marketing"), getTranslations("common")]);
  const pillars = ["tell", "keep", "pass"] as const;

  return (
    <>
      <SiteHeader
        actions={
          <Button asChild variant="ghost">
            <Link href="/inloggen">{common("signIn")}</Link>
          </Button>
        }
      />
      <main id="inhoud" className="flex-1">
        <section className="paper border-sand border-b">
          <div className="mx-auto max-w-5xl px-5 py-20 sm:py-28">
            <p className="text-taupe-dark text-sm font-medium tracking-widest uppercase">
              {common("tagline")}
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl sm:text-6xl">{t("heading")}</h1>
            <p className="text-taupe-dark mt-6 text-xl">{t("lead")}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/inloggen">{t("cta")}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/inloggen">{t("secondaryCta")}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section aria-labelledby="zo-werkt-het" className="mx-auto max-w-5xl px-5 py-20">
          <h2 id="zo-werkt-het" className="text-3xl">
            {t("pillars.heading")}
          </h2>
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {pillars.map((key) => (
              <li key={key}>
                <Card className="h-full">
                  <h3 className="text-2xl">{t(`pillars.${key}.title`)}</h3>
                  <p className="text-taupe-dark mt-3">{t(`pillars.${key}.body`)}</p>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="wat-we-niet-doen" className="bg-sand">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <h2 id="wat-we-niet-doen" className="text-3xl">
              {t("trust.heading")}
            </h2>
            <p className="text-ink mt-4 text-lg">{t("trust.body")}</p>
          </div>
        </section>
      </main>
      <footer className="text-taupe-dark mx-auto w-full max-w-5xl px-5 py-8 text-sm">
        {t("footer")}
      </footer>
    </>
  );
}
