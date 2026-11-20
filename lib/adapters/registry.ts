import "server-only";
import { serverEnv } from "@/lib/server/env";
import { logger } from "@/lib/server/logger";
import { VaultViolationError, type AiContext } from "./shared";
import type { EmailAdapter } from "./email/types";
import { createMockEmail } from "./email/mock";
import type { LlmAdapter } from "./llm/types";
import { createMockLlm } from "./llm/mock";
import type { PaymentsAdapter } from "./payments/types";
import { createMockPayments } from "./payments/mock";
import type { PrintAdapter } from "./print/types";
import { createMockPrint } from "./print/mock";
import type { StorageAdapter } from "./storage/types";
import { createMockStorage } from "./storage/mock";
import type { SttAdapter } from "./stt/types";
import { createMockStt } from "./stt/mock";
import type { TelephonyAdapter } from "./telephony/types";
import { createMockTelephony } from "./telephony/mock";
import type { VideoAdapter } from "./video/types";
import { createMockVideo } from "./video/mock";
import type { VoiceAdapter } from "./voice/types";
import { createMockVoice } from "./voice/mock";
import type { WhatsappAdapter } from "./whatsapp/types";
import { createMockWhatsapp } from "./whatsapp/mock";

export type Adapters = {
  llm: LlmAdapter;
  voice: VoiceAdapter;
  stt: SttAdapter;
  storage: StorageAdapter;
  video: VideoAdapter;
  print: PrintAdapter;
  payments: PaymentsAdapter;
  email: EmailAdapter;
  whatsapp: WhatsappAdapter;
  telephony: TelephonyAdapter;
};
export type AdapterName = keyof Adapters;

type Definition<T> = {
  /** All of these must be set for the real implementation to be used. */
  envKeys: string[];
  /** Sends family content to an AI service, so every call is checked against the vault rule. */
  ai: boolean;
  createMock: () => T;
  /** Added in the phase that needs the service. Until then the mock is used even with keys set. */
  createReal?: () => T;
};

export const definitions: { [K in AdapterName]: Definition<Adapters[K]> } = {
  llm: { envKeys: ["ANTHROPIC_API_KEY"], ai: true, createMock: createMockLlm },
  voice: {
    envKeys: ["ELEVENLABS_API_KEY", "ELEVENLABS_AGENT_ID"],
    ai: true,
    createMock: createMockVoice,
  },
  stt: { envKeys: ["ELEVENLABS_API_KEY"], ai: true, createMock: createMockStt },
  storage: {
    envKeys: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    ai: false,
    createMock: createMockStorage,
  },
  video: { envKeys: ["MUX_TOKEN_ID", "MUX_TOKEN_SECRET"], ai: false, createMock: createMockVideo },
  print: { envKeys: ["PEECHO_API_KEY"], ai: false, createMock: createMockPrint },
  payments: { envKeys: ["MOLLIE_API_KEY"], ai: false, createMock: createMockPayments },
  email: { envKeys: ["POSTMARK_TOKEN"], ai: false, createMock: createMockEmail },
  whatsapp: { envKeys: ["WHATSAPP_TOKEN"], ai: false, createMock: createMockWhatsapp },
  telephony: {
    envKeys: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"],
    ai: true,
    createMock: createMockTelephony,
  },
};

type Env = (name: string) => string | undefined;

export function isMocked(name: AdapterName, env: Env = serverEnv.get): boolean {
  const definition = definitions[name];
  return !definition.createReal || !definition.envKeys.every((key) => Boolean(env(key)));
}

/** Names of the services currently running as a mock; drives the "demo-modus" badge. */
export function mockedAdapters(env: Env = serverEnv.get): AdapterName[] {
  return (Object.keys(definitions) as AdapterName[]).filter((name) => isMocked(name, env));
}

const isAiContext = (value: unknown): value is AiContext =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as AiContext).vault === "boolean" &&
  typeof (value as AiContext).familyId === "string";

/**
 * Wraps an adapter so that every call is logged with its cost and, for AI adapters, refused when
 * the content comes from a vault story. This is the application half of the vault rule; the
 * database half is the guard_vault triggers.
 */
export function instrument<T extends object>(
  name: AdapterName,
  adapter: T,
  ai: boolean,
  mocked: boolean,
): T {
  return new Proxy(adapter, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== "function") return value;
      return async (...args: unknown[]) => {
        const method = String(property);
        if (ai) {
          const ctx = args[0];
          if (!isAiContext(ctx)) {
            throw new Error(`${name}.${method} must be called with an AiContext as first argument`);
          }
          if (ctx.vault) {
            logger.warn("adapter.vault_refused", {
              adapter: name,
              method,
              family_id: ctx.familyId,
            });
            throw new VaultViolationError(name, method);
          }
        }
        const started = Date.now();
        const result: unknown = await value.apply(target, args);
        const costCents =
          typeof result === "object" && result !== null && "costCents" in result
            ? Number((result as { costCents: number }).costCents)
            : 0;
        logger.info("adapter.call", {
          adapter: name,
          method,
          mocked,
          cost_cents: costCents,
          duration_ms: Date.now() - started,
          family_id: isAiContext(args[0]) ? args[0].familyId : undefined,
        });
        return result;
      };
    },
  });
}

const cache = new Map<AdapterName, unknown>();

/** The one way application code obtains an external service. */
export function getAdapter<K extends AdapterName>(name: K): Adapters[K] {
  const cached = cache.get(name);
  if (cached) return cached as Adapters[K];
  const definition = definitions[name];
  const mocked = isMocked(name);
  const raw = mocked || !definition.createReal ? definition.createMock() : definition.createReal();
  const adapter = instrument(name, raw, definition.ai, mocked);
  cache.set(name, adapter);
  return adapter;
}
