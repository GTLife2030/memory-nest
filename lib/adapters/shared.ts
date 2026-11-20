/** Context passed to every adapter call that may send family content to an AI service. */
export type AiContext = {
  familyId: string;
  storyId?: string;
  /** True when the content belongs to a vault story. Such content must never reach an AI service. */
  vault: boolean;
};

/** Every adapter result reports what the call cost, so cost per action can be logged. */
export type Costed<T> = T & { costCents: number };

export class VaultViolationError extends Error {
  constructor(adapter: string, method: string) {
    super(`Refused: ${adapter}.${method} was called with vault content`);
    this.name = "VaultViolationError";
  }
}

export const euro = (cents: number) => Math.round(cents * 100) / 100;
