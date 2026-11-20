import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { setPersona } from "@/app/actions/persona";
import { Button } from "@/components/ui";
import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { personas } from "@/lib/voorbeeld/data";
import { PERSONA_COOKIE, resolvePersona } from "@/lib/voorbeeld/persona";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("voorbeeld");
  return {
    title: { default: t("title"), template: `%s · ${t("marker")}` },
    robots: { index: false, follow: false },
  };
}

/**
 * The clickable mock-up. Only for signed-in visitors when a database is configured; without one
 * (local development, CI) it is open, like the demo nest. Everything inside is simulated.
 */
export default async function VoorbeeldLayout({ children }: LayoutProps<"/voorbeeld">) {
  if (supabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect("/inloggen?next=/voorbeeld");
  }
  const [t, cookieStore] = await Promise.all([getTranslations("voorbeeld"), cookies()]);
  const persona = resolvePersona(cookieStore.get(PERSONA_COOKIE)?.value);

  return (
    <div className="flex flex-col gap-10">
      <aside
        aria-label={t("marker")}
        className="rounded-card border-taupe bg-linen flex flex-wrap items-end justify-between gap-4 border px-5 py-4"
      >
        <div>
          <p className="text-ink flex items-center gap-2 font-medium">
            <span aria-hidden="true" className="rounded-pill bg-warning size-2" />
            {t("marker")}
          </p>
          <p className="text-taupe-dark text-sm">{t("markerDetail")}</p>
          <p className="text-taupe-dark text-sm">{t("persona.current", { name: persona.name })}</p>
        </div>
        <form action={setPersona} className="flex flex-wrap items-end gap-3">
          <label className="text-taupe-dark flex flex-col gap-1 text-sm">
            {t("persona.legend")}
            <select
              name="persona"
              defaultValue={persona.id}
              className="min-target rounded-card border-taupe text-ink border bg-white px-3 text-base"
            >
              {personas.map((option) => (
                <option key={option.id} value={option.id}>
                  {t(`persona.${option.id}`)}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="secondary">
            {t("persona.apply")}
          </Button>
        </form>
      </aside>
      {children}
    </div>
  );
}
