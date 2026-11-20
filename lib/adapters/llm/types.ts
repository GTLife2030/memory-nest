import type { AiContext, Costed } from "../shared";

export type TranscriptSegment = {
  id: string;
  speaker: "teller" | "interviewer";
  text: string;
  startMs: number;
  endMs: number;
};

export type SensitiveFlagType = "gezondheid" | "conflict" | "derde_persoon" | "minderjarige";

/** Output contract of /prompts/editor.nl.md. */
export type EditedStory = {
  title: string;
  paragraphs: { text: string; source_segments: string[] }[];
  people: { name: string; relation: string; is_living_guess: boolean | null }[];
  places: { name: string }[];
  dates: { label: string; date: string; precision: "day" | "month" | "year" | "decade" }[];
  themes: string[];
  sensitive_flags: { type: SensitiveFlagType; paragraph_index: number; note: string }[];
  follow_up_questions: [string, string];
  confidence_notes: string;
};

export type PhotoDescription = {
  description: string;
  decadeGuess: string;
  question: string;
};

export interface LlmAdapter {
  editStory(
    ctx: AiContext,
    input: { segments: TranscriptSegment[]; tellerName: string },
  ): Promise<Costed<EditedStory>>;
  followUps(
    ctx: AiContext,
    input: { storyText: string },
  ): Promise<Costed<{ questions: [string, string] }>>;
  describePhoto(ctx: AiContext, input: { imageUrl: string }): Promise<Costed<PhotoDescription>>;
}
