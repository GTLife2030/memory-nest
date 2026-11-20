import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { VerhaalFlow } from "@/components/voorbeeld/verhaal-flow";
import { stepFrom } from "@/lib/voorbeeld/persona";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("voorbeeld.verhaal");
  return { title: t("title") };
}

export default async function Page({ searchParams }: PageProps<"/voorbeeld/verhaal">) {
  const { stap } = await searchParams;
  return <VerhaalFlow initialStep={stepFrom(stap)} />;
}
