import type { MockStory, Precision } from "./data";

const decadeNames: Record<number, string> = {
  1940: "jaren veertig",
  1950: "jaren vijftig",
  1960: "jaren zestig",
  1970: "jaren zeventig",
  1980: "jaren tachtig",
  1990: "jaren negentig",
};

export const decadeOf = (date: string) => Math.floor(Number(date.slice(0, 4)) / 10) * 10;
export const decadeLabel = (decade: number) => decadeNames[decade] ?? `${decade}–${decade + 9}`;

const fmt = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("nl-NL", { ...options, timeZone: "UTC" });

/** A date said the way it is known: "12 mei 1978", "februari 1953", "1966" or "jaren vijftig". */
export function whenLabel(date: string, precision: Precision): string {
  const value = new Date(`${date}T00:00:00Z`);
  if (precision === "day")
    return fmt({ day: "numeric", month: "long", year: "numeric" }).format(value);
  if (precision === "month") return fmt({ month: "long", year: "numeric" }).format(value);
  if (precision === "year") return date.slice(0, 4);
  return decadeLabel(decadeOf(date));
}

export const monthLabel = (date: string) =>
  fmt({ month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00Z`));

/** Machine-readable value for <time>, only as precise as the date is known. */
export function dateTimeAttr(date: string, precision: Precision): string | undefined {
  if (precision === "day") return date;
  if (precision === "month") return date.slice(0, 7);
  if (precision === "year") return date.slice(0, 4);
  return undefined;
}

export const excerpt = (story: MockStory) =>
  story.paragraphs.map((paragraph) => paragraph.text).join(" ");
export const byDate = (a: MockStory, b: MockStory) => a.date.localeCompare(b.date);
