---
name: add-adapter
description: Add or implement an external-service adapter (interface, mock, real) behind the Memory Nest adapter registry. Use when integrating any third-party API.
---

# Add or implement an adapter

Every external service is reached through `getAdapter(name)` from `lib/adapters/registry.ts`.

1. Ask the founder before adding a paid service. Record the choice in `docs/adr/`.
2. `lib/adapters/<name>/types.ts`: the interface. Methods that send family content to an AI
   service take `ctx: AiContext` as first argument. Methods with a cost return `Costed<…>`.
3. `lib/adapters/<name>/mock.ts`: deterministic, realistic Dutch data, zero cost, no network.
4. `lib/adapters/<name>/real.ts`: the real client. Read keys through `serverEnv.get(…)`, set
   timeouts, verify webhook signatures, send the minimum data (never e-mail addresses or phone
   numbers to an LLM), compute `costCents`.
5. Register it in `definitions` in `registry.ts`: `envKeys`, `ai`, `createMock`, `createReal`.
   Add the keys to `.env.example` and a Dutch service name to `demo.services` in `messages/nl.json`.
6. Tests in `tests/unit/`: mock contract, vault refusal for AI adapters, real adapter against
   recorded responses. Both mock and real must work (definition of done).
7. Update `docs/PRIVACY.md` (processor, region, retention, DPA status).
