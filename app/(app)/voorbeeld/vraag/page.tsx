import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { VraagFlow } from "@/components/voorbeeld/vraag-flow";
import { stepFrom } from "@/lib/voorbeeld/persona";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("voorbeeld.vraag");
  return { title: t("title") };
}

export default async function Page({ searchParams }: PageProps<"/voorbeeld/vraag">) {
  const { stap } = await searchParams;
  return <VraagFlow initialStep={stepFrom(stap)} />;
}
