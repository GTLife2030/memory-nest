import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import nl from "@/messages/nl.json";

type Tree = { [key: string]: string | Tree };
const flatten = (tree: Tree, prefix = ""): [string, string][] =>
  Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string"
      ? [[prefix + key, value] as [string, string]]
      : flatten(value, `${prefix}${key}.`),
  );

const dutch = flatten(nl);

describe("Dutch copy", () => {
  it("has no empty strings", () => {
    for (const [key, value] of dutch) expect(value.trim(), key).not.toBe("");
  });

  it("stays calm: no exclamation marks, no shouting", () => {
    for (const [key, value] of dutch) {
      expect(value, key).not.toContain("!");
      expect(value, key).not.toMatch(/\b[A-Z]{4,}\b/);
    }
  });

  it("avoids pressure and gamification wording", () => {
    const banned =
      /\b(streak|reeks|score|punten|level|mis het niet|nog maar|haast|laatste kans|upgrade)\b/i;
    for (const [key, value] of dutch) expect(value, key).not.toMatch(banned);
  });

  it("speaks about 'voor later', never about death, in the capsule copy", () => {
    for (const [key, value] of dutch.filter(([key]) => key.includes("capsule"))) {
      expect(value, key).not.toMatch(/dood|overlijd|sterf/i);
    }
  });

  it("uses typographic ellipsis and keeps ICU placeholders balanced", () => {
    for (const [key, value] of dutch) {
      expect(value, key).not.toContain("...");
      expect((value.match(/\{/g) ?? []).length, key).toBe((value.match(/\}/g) ?? []).length);
    }
  });
});

describe("English (prepared)", () => {
  it("only contains keys that exist in Dutch", () => {
    const known = new Set(dutch.map(([key]) => key));
    for (const [key] of flatten(en)) expect(known.has(key), key).toBe(true);
  });
});

describe("i18n lint rule", () => {
  it("rejects a hard-coded string in a component and accepts a translated one", async () => {
    const eslint = new ESLint();
    const [bad] = await eslint.lintText("export function A() { return <p>Welkom terug</p>; }\n", {
      filePath: "components/ui/a.tsx",
    });
    expect(bad?.messages.map((message) => message.ruleId)).toContain("react/jsx-no-literals");
    const [good] = await eslint.lintText(
      "export function A({ label }: { label: string }) { return <p>{label}</p>; }\n",
      { filePath: "components/ui/a.tsx" },
    );
    expect(good?.messages).toEqual([]);
  }, 30_000);

  it("rejects importing the service-role client from a component", async () => {
    const eslint = new ESLint();
    const [result] = await eslint.lintText(
      'import { createAdminClient } from "@/lib/supabase/admin";\nexport const x = createAdminClient;\n',
      { filePath: "components/ui/a.tsx" },
    );
    expect(result?.messages.map((message) => message.ruleId)).toContain("no-restricted-imports");
  }, 30_000);
});
