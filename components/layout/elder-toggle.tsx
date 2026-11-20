import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { setElderMode } from "@/app/actions/elder";
import { Button } from "@/components/ui";
import { ELDER_COOKIE } from "@/lib/elder";

/** A plain, always-visible button (no hidden gesture) to switch large type on or off. */
export async function ElderToggle() {
  const [t, cookieStore] = await Promise.all([getTranslations("elder"), cookies()]);
  const enabled = cookieStore.get(ELDER_COOKIE)?.value === "1";
  return (
    <form action={setElderMode}>
      <input type="hidden" name="enabled" value={enabled ? "0" : "1"} />
      <Button type="submit" variant="secondary" aria-pressed={enabled} title={t("hint")}>
        {enabled ? t("off") : t("on")}
      </Button>
    </form>
  );
}
