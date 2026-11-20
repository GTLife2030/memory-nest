import type { AiContext, Costed } from "../shared";
import type { InterviewBrief } from "../voice/types";

export type CallStatus = "scheduled" | "ringing" | "in_progress" | "completed" | "missed" | "failed";

export interface TelephonyAdapter {
  scheduleCall(
    ctx: AiContext,
    input: { phoneE164: string; at: Date; brief: InterviewBrief },
  ): Promise<Costed<{ callId: string; status: CallStatus }>>;
  getCall(callId: string): Promise<{ callId: string; status: CallStatus; durationS: number }>;
}
