import type { VoiceAdapter } from "./types";

export const createMockVoice = (): VoiceAdapter => ({
  async createBrowserSession(_ctx, brief) {
    const name = brief.formOfAddress === "u" ? "u" : "je";
    return {
      sessionId: `demo-gesprek-${brief.theme}`,
      signedUrl: null,
      openingLine: `Ik ben Nestje, een digitale interviewer van Memory Nest. Fijn dat ${name} er bent, ${brief.storytellerName}. Zullen we het vandaag over ${brief.theme} hebben?`,
      costCents: 0,
    };
  },
});
