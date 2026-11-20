import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { DemoStatus } from "./demo-status";
import { ElderToggle } from "./elder-toggle";
import { Logo } from "./logo";

export async function SiteHeader({
  homeHref = "/",
  actions,
}: {
  homeHref?: string;
  actions?: ReactNode;
}) {
  const t = await getTranslations("common");
  return (
    <header className="border-sand border-b">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={homeHref} className="rounded-pill">
            <Logo label={t("brand")} />
          </Link>
          <DemoStatus />
        </div>
        <nav aria-label={t("mainNav")} className="flex flex-wrap items-center gap-3">
          <ElderToggle />
          {actions}
        </nav>
      </div>
    </header>
  );
}
