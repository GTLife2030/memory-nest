import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockEmail } from "@/lib/adapters/email/mock";
import { createMockLlm } from "@/lib/adapters/llm/mock";
import {
  definitions,
  getAdapter,
  instrument,
  isMocked,
  mockedAdapters,
  type AdapterName,
} from "@/lib/adapters/registry";
import { VaultViolationError, type AiContext } from "@/lib/adapters/shared";
import { createMockStt } from "@/lib/adapters/stt/mock";

const ctx: AiContext = { familyId: "fam-1", storyId: "story-1", vault: false };
const names = Object.keys(definitions) as AdapterName[];

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

describe("adapter registry", () => {
  it("covers the ten external services", () => {
    expect(names.sort()).toEqual(
      [
        "email",
        "llm",
        "payments",
        "print",
        "storage",
        "stt",
        "telephony",
        "video",
        "voice",
        "whatsapp",
      ].sort(),
    );
  });

  it("falls back to every mock when no keys are set", () => {
    expect(mockedAdapters(() => undefined).sort()).toEqual(names.sort());
  });

  it("stays mocked when keys are set but the real implementation does not exist yet", () => {
    for (const name of names) {
      expect(
        definitions[name].createReal,
        `${name} has no real implementation in phase 0`,
      ).toBeUndefined();
      expect(isMocked(name, () => "some-key")).toBe(true);
    }
  });

  it("uses the real implementation only when it exists and all of its keys are present", () => {
    const original = definitions.email.createReal;
    definitions.email.createReal = createMockEmail;
    try {
      expect(isMocked("email", () => undefined)).toBe(true);
      expect(isMocked("email", (key) => (key === "POSTMARK_TOKEN" ? "token" : undefined))).toBe(
        false,
      );
      expect(isMocked("voice", (key) => (key === "ELEVENLABS_API_KEY" ? "k" : undefined))).toBe(
        true,
      );
    } finally {
      definitions.email.createReal = original;
    }
  });

  it("marks exactly the adapters that send content to AI services", () => {
    expect(names.filter((name) => definitions[name].ai).sort()).toEqual([
      "llm",
      "stt",
      "telephony",
      "voice",
    ]);
  });
});

describe("vault rule in the adapter layer", () => {
  it.each(["llm", "stt", "voice", "telephony"] as const)(
    "%s refuses vault content",
    async (name) => {
      const adapter = getAdapter(name) as unknown as Record<
        string,
        (...args: unknown[]) => Promise<unknown>
      >;
      const inner = definitions[name].createMock() as unknown as Record<string, unknown>;
      for (const method of Object.keys(inner)) {
        if (method === "getCall") continue; // takes a call id, no content
        await expect(adapter[method]!({ ...ctx, vault: true }, {})).rejects.toBeInstanceOf(
          VaultViolationError,
        );
      }
    },
  );

  it("never reaches the underlying service for vault content", async () => {
    const editStory = vi.fn<(...args: unknown[]) => Promise<object>>(async () => ({}));
    const guarded = instrument("llm", { editStory }, true, true);
    await expect(guarded.editStory({ ...ctx, vault: true })).rejects.toThrow(/vault/);
    expect(editStory).not.toHaveBeenCalled();
  });

  it("refuses AI calls that do not say whether the content is vault", async () => {
    const editStory = vi.fn<(...args: unknown[]) => Promise<object>>(async () => ({}));
    const guarded = instrument("llm", { editStory }, true, true);
    await expect(guarded.editStory({ segments: [] })).rejects.toThrow(/AiContext/);
    expect(editStory).not.toHaveBeenCalled();
  });
});

describe("cost logging", () => {
  it("logs one structured line per call with its cost and no content", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const guarded = instrument(
      "stt",
      {
        transcribe: async (context: AiContext) => ({
          text: `geheim verhaal ${context.familyId}`,
          costCents: 7,
        }),
      },
      true,
      false,
    );
    await guarded.transcribe(ctx);
    const line = JSON.parse(String(log.mock.calls.at(-1)?.[0]));
    expect(line).toMatchObject({
      event: "adapter.call",
      adapter: "stt",
      method: "transcribe",
      cost_cents: 7,
      mocked: false,
      family_id: "fam-1",
    });
    expect(JSON.stringify(line)).not.toContain("geheim");
  });
});

describe("mocks return realistic Dutch data that obeys the contracts", () => {
  it("editor mock: every paragraph cites at least one existing source segment", async () => {
    const { segments } = await createMockStt().transcribe(ctx, { audioUrl: "x" });
    const story = await createMockLlm().editStory(ctx, { segments, tellerName: "Truus" });
    const ids = new Set(segments.map((segment) => segment.id));
    expect(story.paragraphs.length).toBeGreaterThan(0);
    for (const paragraph of story.paragraphs) {
      expect(paragraph.source_segments.length).toBeGreaterThan(0);
      for (const id of paragraph.source_segments) expect(ids.has(id)).toBe(true);
    }
    expect(story.title.split(/\s+/).length).toBeLessThanOrEqual(8);
    expect(story.follow_up_questions).toHaveLength(2);
    const told = segments.map((segment) => segment.text).join(" ");
    for (const paragraph of story.paragraphs) {
      for (const sentence of paragraph.text.split(/(?<=\.)\s+/)) expect(told).toContain(sentence);
    }
  });

  it("interviewer mock discloses that Nestje is an AI in its first sentence", async () => {
    const session = await getAdapter("voice").createBrowserSession(ctx, {
      storytellerName: "Truus",
      children: "Marieke",
      theme: "jeugd",
      memorySummary: "",
      formOfAddress: "u",
      maxMinutes: 20,
    });
    expect(
      session.openingLine.startsWith("Ik ben Nestje, een digitale interviewer van Memory Nest."),
    ).toBe(true);
  });

  it("payment mock succeeds and print mock reports an order status", async () => {
    const payments = getAdapter("payments");
    const payment = await payments.createPayment({
      amountCents: 14900,
      description: "Levensverhaal-cadeau",
      redirectUrl: "/klaar",
      metadata: {},
    });
    expect(await payments.getPayment(payment.id)).toMatchObject({
      status: "paid",
      amountCents: 14900,
    });
    const order = await getAdapter("print").createOrder({
      bookId: "0d9f2c1e-aaaa",
      pdfUrl: "x",
      template: "linnen",
      pageCount: 64,
      copies: 1,
      address: {
        name: "M. de Wit",
        street: "Heuvel 1",
        postalCode: "5038 CP",
        city: "Tilburg",
        country: "NL",
      },
    });
    expect(order.status).toBe("created");
  });
});
