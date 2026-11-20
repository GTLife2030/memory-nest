import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OnboardingFlow } from "@/components/voorbeeld/onboarding-flow";
import { stepFrom } from "@/lib/voorbeeld/persona";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("voorbeeld.onboarding");
  return { title: t("title") };
}

export default async function Page({ searchParams }: PageProps<"/voorbeeld/onboarding">) {
  const { stap } = await searchParams;
  return <OnboardingFlow initialStep={stepFrom(stap)} />;
}
