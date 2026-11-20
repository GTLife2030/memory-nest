import { SiteHeader } from "@/components/layout/site-header";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main id="inhoud" className="mx-auto w-full max-w-xl flex-1 px-5 py-16">
        {children}
      </main>
    </>
  );
}
