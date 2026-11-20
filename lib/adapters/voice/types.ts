import type { AiContext, Costed } from "../shared";

export type InterviewBrief = {
  storytellerName: string;
  children: string;
  theme: string;
  memorySummary: string;
  formOfAddress: "u" | "je";
  maxMinutes: number;
};

export interface VoiceAdapter {
  /** Starts a browser (WebRTC) conversation with Nestje. `signedUrl` is null in demo mode. */
  createBrowserSession(
    ctx: AiContext,
    brief: InterviewBrief,
  ): Promise<Costed<{ sessionId: string; signedUrl: string | null; openingLine: string }>>;
}
