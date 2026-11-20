import type { WhatsappAdapter } from "./types";

export const createMockWhatsapp = (): WhatsappAdapter => {
  let sent = 0;
  return {
    async sendTemplate() {
      sent += 1;
      return { messageId: `demo-wa-${sent}`, costCents: 0 };
    },
  };
};
