import type { AiContext, Costed } from "../shared";
import type { TranscriptSegment } from "../llm/types";

export type Transcription = {
  text: string;
  segments: TranscriptSegment[];
  language: string;
  provider: string;
};

export interface SttAdapter {
  /** `keyterms` carries family and place names to improve recognition (never e-mails or phone numbers). */
  transcribe(
    ctx: AiContext,
    input: { audioUrl: string; keyterms?: string[] },
  ): Promise<Costed<Transcription>>;
}
