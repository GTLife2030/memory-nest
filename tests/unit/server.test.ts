import { describe, expect, it } from "vitest";
import { buildCsp } from "@/lib/csp";
import { safeNextPath } from "@/lib/safe-redirect";
import { redact } from "@/lib/server/logger";
import { rateLimit, rateLimitSize, resetRateLimits } from "@/lib/server/rate-limit";

describe("safeNextPath", () => {
  it.each(["/nest", "/nest/abc?tab=tijdlijn"])("keeps same-site path %s", (path) => {
    expect(safeNextPath(path)).toBe(path);
  });
  it.each([
    null,
    "",
    "https://evil.example/nest",
    "//evil.example",
    "/\\evil.example",
    "nest",
    "javascript:alert(1)",
    "/\t/evil.example",
  ])("rejects %s", (value) => {
    expect(safeNextPath(value)).toBe("/nest");
  });
});

describe("safeNextPath result", () => {
  it("never resolves to another origin, whatever goes in", () => {
    for (const input of [
      "/.//evil.example",
      "/a/..//evil.example",
      "/././/evil.example",
      "/nest",
      "/x/../nest",
    ]) {
      expect(new URL(safeNextPath(input), "https://app.example/auth/confirm").origin).toBe(
        "https://app.example",
      );
    }
  });
});

describe("buildCsp", () => {
  const csp = buildCsp({ nonce: "abc123", supabaseUrl: "https://project.supabase.co", dev: false });
  it("requires the nonce for scripts and forbids inline and eval", () => {
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-(inline|eval)'/);
  });
  it("only lets the browser talk to this site and the Supabase project", () => {
    expect(csp).toContain(
      "connect-src 'self' https://project.supabase.co wss://project.supabase.co",
    );
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("upgrade-insecure-requests");
  });
  it("relaxes only what development needs", () => {
    const dev = buildCsp({ nonce: "n", dev: true });
    expect(dev).toContain("'unsafe-eval'");
    expect(dev).not.toContain("upgrade-insecure-requests");
  });
});

describe("rateLimit", () => {
  it("allows up to the limit inside a window and recovers afterwards", () => {
    resetRateLimits();
    const results = Array.from({ length: 5 }, () => rateLimit("mail:a@b.nl", 3, 1000, 0));
    expect(results).toEqual([true, true, true, false, false]);
    expect(rateLimit("mail:other@b.nl", 3, 1000, 0)).toBe(true);
    expect(rateLimit("mail:a@b.nl", 3, 1000, 1001)).toBe(true);
  });
  it("cannot be made to grow without bound by inventing keys", () => {
    resetRateLimits();
    for (let i = 0; i < 25_000; i += 1) rateLimit(`ip:spoof-${i}`, 10, 60_000, 0);
    expect(rateLimitSize()).toBeLessThanOrEqual(10_001);
  });
});

describe("logger redaction", () => {
  it("never writes contact details or story content", () => {
    const out = redact({
      email: "truus@voorbeeld.nl",
      phone_e164: "+31612345678",
      body_md: "verhaal",
      access_token: "x",
      cost_cents: 3,
      family_id: "f",
    });
    expect(out).toEqual({
      email: "[redacted]",
      phone_e164: "[redacted]",
      body_md: "[redacted]",
      access_token: "[redacted]",
      cost_cents: 3,
      family_id: "f",
    });
  });
});

describe("security review regressions", () => {
  it.each([
    "/.//evil.example/x",
    "/..//evil.example",
    "/%2e//evil.example",
    "/nest/../..//evil.example?a=1",
  ])("safeNextPath rejects the dot-segment redirect %s", (value) => {
    expect(safeNextPath(value)).toBe("/nest");
  });

  it("redacts inside nested objects and arrays too", () => {
    const out = redact({
      meta: { user: { email: "a@b.nl" }, items: [{ transcript: "x", ok: 1 }] },
    });
    expect(out).toEqual({
      meta: { user: { email: "[redacted]" }, items: [{ transcript: "[redacted]", ok: 1 }] },
    });
  });
});
