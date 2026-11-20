import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui";
import { people, storiesAbout } from "@/lib/voorbeeld/data";

export default async function MockPeoplePage() {
  const t = await getTranslations("voorbeeld.nest.people");
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-4xl">{t("heading")}</h1>
        <p className="text-taupe-dark mt-2">{t("hint")}</p>
      </header>
      <ul className="grid gap-5 md:grid-cols-2">
        {people.map((person) => {
          const mentioned = storiesAbout(person.name);
          return (
            <li key={person.name}>
              <Card className="h-full">
                <h2 className="text-2xl">{person.name}</h2>
                <p className="text-taupe-dark mt-1">
                  {person.relation}
                  {person.born ? ` · ${t("born", { year: person.born })}` : ""}
                </p>
                <p className="text-taupe-dark mt-4 text-sm">
                  {t("mentions", { count: mentioned.length })}
                </p>
                <ul className="mt-2 flex flex-col gap-1">
                  {mentioned.map((story) => (
                    <li key={story.id}>
                      <Link
                        href={`/voorbeeld/nest/verhalen/${story.id}`}
                        className="text-terracotta-dark underline underline-offset-4"
                      >
                        {story.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
