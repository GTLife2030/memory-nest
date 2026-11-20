import type { EmailAdapter, EmailTemplate } from "./types";

export type SentEmail = { to: string; template: EmailTemplate; data: Record<string, string> };

/** Keeps sent mail in memory so tests and the demo can show what would have been sent. */
export const createMockEmail = (): EmailAdapter & { outbox: SentEmail[] } => {
  const outbox: SentEmail[] = [];
  return {
    outbox,
    async send(message) {
      outbox.push(message);
      return { messageId: `demo-mail-${outbox.length}` };
    },
  };
};
