import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FotoFlow } from "@/components/voorbeeld/foto-flow";
import { stepFrom } from "@/lib/voorbeeld/persona";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("voorbeeld.foto");
  return { title: t("title") };
}

export default async function Page({ searchParams }: PageProps<"/voorbeeld/foto">) {
  const { stap } = await searchParams;
  return <FotoFlow initialStep={stepFrom(stap)} />;
}
