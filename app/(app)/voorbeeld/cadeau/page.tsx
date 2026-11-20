import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CadeauFlow } from "@/components/voorbeeld/cadeau-flow";
import { stepFrom } from "@/lib/voorbeeld/persona";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("voorbeeld.cadeau");
  return { title: t("title") };
}

export default async function Page({ searchParams }: PageProps<"/voorbeeld/cadeau">) {
  const { stap } = await searchParams;
  return <CadeauFlow initialStep={stepFrom(stap)} />;
}
