import { getTranslations } from "next-intl/server";
import { DemoBadge } from "@/components/ui";
import { mockedAdapters } from "@/lib/adapters/registry";

/** Shows the "demo-modus" badge whenever at least one external service is simulated. */
export async function DemoStatus({ className }: { className?: string }) {
  const mocked = mockedAdapters();
  if (mocked.length === 0) return null;
  const t = await getTranslations("demo");
  const services = mocked.map((name) => t(`services.${name}`)).join(", ");
  return <DemoBadge label={t("badge")} detail={t("detail", { services })} className={className} />;
}
