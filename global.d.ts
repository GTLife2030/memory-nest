import type messages from "./messages/nl.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: "nl" | "en";
    Messages: typeof messages;
  }
}
