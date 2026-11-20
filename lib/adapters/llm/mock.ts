import type { LlmAdapter } from "./types";

/** Deterministic Dutch output that obeys the editor contract: every paragraph cites its sources. */
export const createMockLlm = (): LlmAdapter => ({
  async editStory(_ctx, { segments }) {
    const told = segments.filter((segment) => segment.speaker === "teller");
    const paragraphs = [];
    for (let i = 0; i < told.length; i += 2) {
      const pair = told.slice(i, i + 2);
      paragraphs.push({
        text: pair.map((segment) => segment.text.trim()).join(" "),
        source_segments: pair.map((segment) => segment.id),
      });
    }
    const firstWords = told[0]?.text.split(/\s+/).slice(0, 6).join(" ") ?? "Een herinnering";
    return {
      title: firstWords.replace(/[.,;:!?]+$/, ""),
      paragraphs,
      people: [{ name: "Henk", relation: "echtgenoot", is_living_guess: null }],
      places: [{ name: "Tilburg" }],
      dates: [{ label: "jeugd", date: "1955-01-01", precision: "decade" }],
      themes: ["jeugd", "familie"],
      sensitive_flags: [],
      follow_up_questions: [
        "Hoe rook het 's ochtends vroeg in de bakkerij?",
        "Wie stond er naast u achter de toonbank?",
      ],
      confidence_notes: "Demo-modus: dit verhaal is niet door een taalmodel bewerkt.",
      costCents: 0,
    };
  },
  async followUps() {
    return {
      questions: ["Wat zei uw vader toen precies?", "Wie was er die dag nog meer bij?"],
      costCents: 0,
    };
  },
  async describePhoto() {
    return {
      description:
        "Een zwart-witfoto van een winkelpand met een etalage, twee mensen staan voor de deur.",
      decadeGuess: "vermoedelijk jaren vijftig",
      question: "Vertel eens over de dag dat deze foto is gemaakt.",
      costCents: 0,
    };
  },
});
