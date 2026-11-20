import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations("common");
  return {
    name: t("brand"),
    short_name: t("brand"),
    description: t("tagline"),
    lang: "nl",
    start_url: "/nest",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F7F1E8",
    theme_color: "#F7F1E8",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
