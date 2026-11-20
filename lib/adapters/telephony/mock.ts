import type { TelephonyAdapter } from "./types";

export const createMockTelephony = (): TelephonyAdapter => ({
  async scheduleCall(_ctx, { at }) {
    return { callId: `demo-oproep-${at.getTime()}`, status: "scheduled", costCents: 0 };
  },
  async getCall(callId) {
    return { callId, status: "completed", durationS: 20 * 60 };
  },
});
