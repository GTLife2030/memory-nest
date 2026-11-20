export type EmailTemplate = "weekly_question" | "story_ready" | "invitation" | "capsule_released" | "legacy_check_in" | "gift_received";

export interface EmailAdapter {
  send(input: { to: string; template: EmailTemplate; data: Record<string, string> }): Promise<{ messageId: string }>;
}
