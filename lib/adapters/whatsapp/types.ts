import type { Costed } from "../shared";

export type WhatsappTemplate = "weekly_question" | "story_ready";

export interface WhatsappAdapter {
  /** Utility templates only; marketing templates are never sent. */
  sendTemplate(input: { toE164: string; template: WhatsappTemplate; variables: string[] }): Promise<Costed<{ messageId: string }>>;
}
