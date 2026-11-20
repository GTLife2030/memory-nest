import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui";

const groups = [
  {
    key: "start",
    flows: [
      { key: "onboarding", screens: 7 },
      { key: "cadeau", screens: 3 },
    ],
  },
  {
    key: "tell",
    flows: [
      { key: "vraag", screens: 4 },
      { key: "foto", screens: 3 },
      { key: "verhaal", screens: 5 },
    ],
  },
  { key: "nest", flows: [{ key: "nest", screens: 7 }] },
] as const;

const later = ["nestje", "boek", "betalen", "capsule", "nalatenschap", "familie"] as const;

/** Map of every flow in the mock-up. */
export default async function VoorbeeldMapPage() {
  const t = await getTranslations("voorbeeld.map");
  return (
    <div className="flex flex-col gap-12">
      <header>
        <h1 className="text-4xl sm:text-5xl">{t("heading")}</h1>
        <p className="text-taupe-dark mt-4 text-xl">{t("lead")}</p>
      </header>

      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`groep-${group.key}`}>
          <h2 id={`groep-${group.key}`} className="text-3xl">
            {t(`groups.${group.key}`)}
          </h2>
          <ul className="mt-6 grid gap-5 md:grid-cols-2">
            {group.flows.map((flow) => (
              <li key={flow.key}>
                <Card className="focus-within:shadow-lift hover:shadow-lift relative h-full transition-shadow duration-200 ease-out">
                  <h3 className="text-2xl">
                    <Link
                      href={`/voorbeeld/${flow.key}`}
                      className="after:rounded-card after:absolute after:inset-0"
                    >
                      {t(`flows.${flow.key}.title`)}
                    </Link>
                  </h3>
                  <p className="text-taupe-dark mt-2">{t(`flows.${flow.key}.body`)}</p>
                  <p className="text-taupe-dark mt-4 text-sm">
                    {t("minutes", { count: flow.screens })}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section aria-labelledby="groep-later">
        <h2 id="groep-later" className="text-3xl">
          {t("groups.later")}
        </h2>
        <ul className="mt-6 grid gap-5 md:grid-cols-2">
          {later.map((key) => (
            <li key={key} className="rounded-card border-taupe border border-dashed p-6">
              <h3 className="text-xl">{t(`flows.${key}.title`)}</h3>
              <p className="text-taupe-dark mt-2">{t(`flows.${key}.body`)}</p>
              <p className="text-taupe-dark mt-4 text-sm">{t("soon")}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
