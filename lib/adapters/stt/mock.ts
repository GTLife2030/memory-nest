import type { SttAdapter } from "./types";

const lines = [
  "Mijn vader had een bakkerij aan de Heuvel in Tilburg.",
  "Om vier uur 's ochtends stond hij al op, en dan rook het hele huis naar vers brood.",
  "Ik mocht op zaterdag de krentenbollen tellen, daar was ik heel precies in.",
  "Hij zei altijd: maak je niet druk om dingen die je morgen vergeten bent.",
];

export const createMockStt = (): SttAdapter => ({
  async transcribe() {
    const segments = lines.map((text, index) => ({
      id: `seg-${index + 1}`,
      speaker: "teller" as const,
      text,
      startMs: index * 6000,
      endMs: index * 6000 + 5500,
    }));
    return { text: lines.join(" "), segments, language: "nl", provider: "mock", costCents: 0 };
  },
});
