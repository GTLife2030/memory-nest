import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { NestNav } from "@/components/voorbeeld/nest-nav";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("voorbeeld.nest");
  return { title: t("title") };
}

export default async function MockNestLayout({ children }: LayoutProps<"/voorbeeld/nest">) {
  const [t, common] = await Promise.all([
    getTranslations("voorbeeld.nest"),
    getTranslations("voorbeeld"),
  ]);
  const items = [
    { href: "/voorbeeld/nest", label: t("nav.week") },
    { href: "/voorbeeld/nest/verhalen", label: t("nav.stories") },
    { href: "/voorbeeld/nest/tijdlijn", label: t("nav.timeline") },
    { href: "/voorbeeld/nest/personen", label: t("nav.people") },
    { href: "/voorbeeld/nest/hoofdstukken", label: t("nav.chapters") },
    { href: "/voorbeeld/nest/zoeken", label: t("nav.search") },
  ];
  return (
    <div className="flex flex-col gap-8">
      <p className="text-taupe-dark text-sm font-medium tracking-wide uppercase">{t("title")}</p>
      <NestNav items={items} label={t("nav.label")} />
      {children}
      <p>
        <Link href="/voorbeeld" className="text-terracotta-dark underline underline-offset-4">
          {common("backToMap")}
        </Link>
      </p>
    </div>
  );
}
