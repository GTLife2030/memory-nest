import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui";
import { supabaseConfigured } from "@/lib/env";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const t = await getTranslations("common");
  return (
    <>
      <SiteHeader
        homeHref="/nest"
        actions={
          supabaseConfigured ? (
            <form action="/auth/uitloggen" method="post">
              <Button type="submit" variant="ghost">
                {t("signOut")}
              </Button>
            </form>
          ) : null
        }
      />
      <main id="inhoud" className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
        {children}
      </main>
    </>
  );
}
