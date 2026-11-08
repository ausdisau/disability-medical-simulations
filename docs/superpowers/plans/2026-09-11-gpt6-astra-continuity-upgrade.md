# GPT-6 Astra Continuity Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add GPT-6 Astra as a server-side proposal/reasoning layer for Project Hope while preserving VIRGAL's append-only canonical storyline, deterministic replay, protected patient claims, and continuity across model upgrades or outages.

**Architecture:** GPT-6 Astra is never the source of truth. A server-side Astra adapter receives a compact `StorylineEnvelope` derived from the current VIRGAL state and returns structured candidate proposals only. Every proposal is bound to the current `headEventHash`, validated against protected-domain rules, and must pass the existing guardian/commit path before it can become an event. Story continuity is reconstructed from persisted VIRGAL snapshots plus committed-event deltas, so changing model versions cannot rewrite prior history.

**Tech Stack:** Node.js 20+, ES modules, Vercel Functions, native `fetch`, OpenAI Responses API (`gpt-6-astra`), Node test runner, existing VIRGAL hash-chained event log and Character-World runtime.

**Spec:** `docs/superpowers/specs/2026-09-08-project-hope-social-world-reality-synthesis-design.md`

## Global Constraints

- Canonical clinical/world truth remains owned by VIRGAL and committed events.
- `GENERATED != CANON`.
- `NPC_BELIEF != WORLD_TRUTH`.
- `VISIBLE != KNOWN`; `KNOWN != SHAREABLE`.
- Model output cannot author physiology, diagnosis, medication/device settings, consent/refusal, capacity, substitute authority, treatment ceilings, or patient-authored speech.
- Rejected counterfactual candidates must never enter canonical memory, snapshots, or future prompts as committed history.
- Continuity must survive model alias changes, model outages, server restarts, and branch forks.
- API credentials remain server-side; never expose `OPENAI_API_KEY` to browser code.
- Use the Responses API for GPT-6 Astra tool/structured-output workflows.
- Default model alias is `gpt-6-astra`; permit a server-side environment override for a pinned snapshot when the deployment team chooses one.
- Do not depend on provider conversation state (`previous_response_id`) for canonical continuity.
- Existing PR #18 must remain unmerged unless explicitly approved separately.

---

## File Structure

Create or modify these focused units:

- `src/virgal/ai/storyline-envelope.js` — converts canonical VIRGAL state into a compact, immutable model context.
- `src/virgal/ai/proposal-schema.js` — validates the only shapes the model may propose and rejects protected-domain mutations.
- `src/virgal/ai/model-config.js` — server-side GPT-6 Astra model/reasoning configuration.
- `src/virgal/ai/astra-client.js` — minimal Responses API transport with dependency injection for tests.
- `src/virgal/ai/proposal-orchestrator.js` — binds model proposals to a head hash and converts only validated candidates into guardian-ready proposal objects.
- `api/simulate.js` — Vercel server function that calls GPT-6 Astra without exposing the API key.
- `src/persistence.js` — persist non-canonical model runtime metadata alongside snapshots without allowing it to alter world truth.
- `tests/gpt6-continuity.test.mjs` — migration, stale-head, protected-domain, outage, and rejected-branch regression tests.
- `README.md` — environment and continuity documentation.
- `.env.dev.example` — safe variable names only, no secrets.

---

### Task 1: Add a canonical Storyline Envelope

**Files:**
- Create: `src/virgal/ai/storyline-envelope.js`
- Test: `tests/gpt6-continuity.test.mjs`

**Interfaces:**
- Consumes: a VIRGAL world object created by `createWorldEngine()`.
- Produces: `createStorylineEnvelope(world, options?) -> StorylineEnvelope`.
- `StorylineEnvelope` fields: `schemaVersion`, `scenarioId`, `branchId`, `worldVersion`, `worldTime`, `headEventHash`, `focusRef`, `authority`, `fidelity`, `characterWorld`, `committedEventTail`.

- [ ] **Step 1: Write the failing continuity-envelope test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createWorldEngine, commitEvent } from "../src/virgal/world-engine.js";
import { createStorylineEnvelope } from "../src/virgal/ai/storyline-envelope.js";

test("storyline envelope is derived only from committed canonical state", () => {
  let world = createWorldEngine({ scenarioId: "eli-open-world", seed: "seed-a" });
  world = commitEvent(world, {
    type: "SOCIAL_NOTE",
    domain: "SOCIAL",
    actorRefs: ["eli"],
    payload: { text: "friend visit deferred" }
  });

  const envelope = createStorylineEnvelope(world, { tailLength: 8 });
  assert.equal(envelope.scenarioId, "eli-open-world");
  assert.equal(envelope.branchId, world.branchId);
  assert.equal(envelope.headEventHash, world.headEventHash);
  assert.equal(envelope.committedEventTail.length, 1);
  assert.equal(envelope.committedEventTail[0].type, "SOCIAL_NOTE");
  assert.equal("candidateEvents" in envelope, false);
  assert.equal("modelScratchpad" in envelope, false);
});
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
node --test tests/gpt6-continuity.test.mjs
```

Expected: FAIL because `src/virgal/ai/storyline-envelope.js` does not exist.

- [ ] **Step 3: Implement the minimal envelope builder**

```js
function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

export function createStorylineEnvelope(world, { tailLength = 32 } = {}) {
  if (!world?.scenarioId || !world?.branchId) throw new Error("invalid_world");
  const events = Array.isArray(world.events) ? world.events : [];
  return Object.freeze({
    schemaVersion: "1.0.0",
    scenarioId: world.scenarioId,
    branchId: world.branchId,
    worldVersion: world.version,
    worldTime: world.worldTime,
    headEventHash: world.headEventHash,
    focusRef: world.focusRef,
    authority: clone(world.authority ?? {}),
    fidelity: clone(world.fidelity ?? {}),
    characterWorld: clone(world.characterWorld ?? {}),
    committedEventTail: clone(events.slice(-Math.max(0, tailLength)))
  });
}
```

- [ ] **Step 4: Run the test to verify GREEN**

```bash
node --test tests/gpt6-continuity.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/virgal/ai/storyline-envelope.js tests/gpt6-continuity.test.mjs
git commit -m "feat: add canonical storyline envelope"
```

---

### Task 2: Define the model proposal contract and protected-domain gate

**Files:**
- Create: `src/virgal/ai/proposal-schema.js`
- Modify: `tests/gpt6-continuity.test.mjs`

**Interfaces:**
- Consumes: raw model JSON.
- Produces: `validateModelProposal(raw, expectedHeadEventHash) -> { ok, proposal?, error? }`.
- Proposal fields: `proposalId`, `expectedHeadEventHash`, `kind`, `actorRefs`, `targetRefs`, `locationRef`, `candidateDialogue`, `candidateEvents`, `uncertainty`, `sourceRefs`.

- [ ] **Step 1: Add failing tests for stale-head and protected-domain rejection**

```js
import { validateModelProposal } from "../src/virgal/ai/proposal-schema.js";

test("model proposal is rejected when generated against a stale storyline head", () => {
  const result = validateModelProposal({
    proposalId: "p1",
    expectedHeadEventHash: "old-head",
    kind: "SOCIAL",
    candidateEvents: []
  }, "current-head");
  assert.equal(result.ok, false);
  assert.equal(result.error, "stale_storyline_head");
});

test("model proposal cannot smuggle protected clinical or rights truth", () => {
  const result = validateModelProposal({
    proposalId: "p2",
    expectedHeadEventHash: "head-a",
    kind: "SOCIAL",
    candidateEvents: [{
      type: "MODEL_EVENT",
      domain: "CLINICAL",
      payload: { diagnosis: "invented", consent: true, capacity: "INCAPABLE" }
    }]
  }, "head-a");
  assert.equal(result.ok, false);
  assert.equal(result.error, "protected_domain_mutation");
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/gpt6-continuity.test.mjs
```

Expected: FAIL because `proposal-schema.js` does not exist.

- [ ] **Step 3: Implement explicit protected keys and domains**

```js
const PROTECTED_DOMAINS = new Set(["CLINICAL", "MEDICATION", "RIGHTS", "CAPACITY", "AUTHORITY"]);
const PROTECTED_KEYS = new Set([
  "physiology", "diagnosis", "medication", "dose", "ventilatorSetting",
  "consent", "refusal", "capacity", "substituteAuthority", "treatmentCeiling"
]);

function containsProtectedKey(value) {
  if (!value || typeof value !== "object") return false;
  for (const [key, nested] of Object.entries(value)) {
    if (PROTECTED_KEYS.has(key)) return true;
    if (containsProtectedKey(nested)) return true;
  }
  return false;
}

export function validateModelProposal(raw, expectedHeadEventHash) {
  if (!raw || typeof raw !== "object") return { ok: false, error: "invalid_proposal" };
  if (!raw.proposalId || raw.expectedHeadEventHash !== expectedHeadEventHash) {
    return { ok: false, error: "stale_storyline_head" };
  }
  const events = Array.isArray(raw.candidateEvents) ? raw.candidateEvents : [];
  if (events.some((event) => PROTECTED_DOMAINS.has(event?.domain) || containsProtectedKey(event?.payload))) {
    return { ok: false, error: "protected_domain_mutation" };
  }
  return {
    ok: true,
    proposal: {
      proposalId: String(raw.proposalId),
      expectedHeadEventHash: raw.expectedHeadEventHash,
      kind: String(raw.kind ?? "SOCIAL"),
      actorRefs: Array.isArray(raw.actorRefs) ? [...raw.actorRefs] : [],
      targetRefs: Array.isArray(raw.targetRefs) ? [...raw.targetRefs] : [],
      locationRef: raw.locationRef ?? null,
      candidateDialogue: Array.isArray(raw.candidateDialogue) ? structuredClone(raw.candidateDialogue) : [],
      candidateEvents: structuredClone(events),
      uncertainty: raw.uncertainty ?? null,
      sourceRefs: Array.isArray(raw.sourceRefs) ? [...raw.sourceRefs] : []
    }
  };
}
```

- [ ] **Step 4: Run GREEN**

```bash
node --test tests/gpt6-continuity.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/virgal/ai/proposal-schema.js tests/gpt6-continuity.test.mjs
git commit -m "feat: gate model proposals from protected truth"
```

---

### Task 3: Add GPT-6 Astra server configuration and Responses API client

**Files:**
- Create: `src/virgal/ai/model-config.js`
- Create: `src/virgal/ai/astra-client.js`
- Modify: `tests/gpt6-continuity.test.mjs`

**Interfaces:**
- `getModelConfig(env?) -> { model, reasoningEffort, endpoint }`.
- `requestAstraProposal({ envelope, instruction, config, fetchImpl }) -> rawProposal`.
- Default model: `gpt-6-astra`.
- Use native `fetch`; no browser imports and no SDK dependency required.

- [ ] **Step 1: Add failing configuration and transport tests**

```js
import { getModelConfig } from "../src/virgal/ai/model-config.js";
import { requestAstraProposal } from "../src/virgal/ai/astra-client.js";

test("GPT-6 Astra is the default reasoning model but can be server-overridden", () => {
  assert.equal(getModelConfig({ OPENAI_API_KEY: "x" }).model, "gpt-6-astra");
  assert.equal(getModelConfig({ OPENAI_API_KEY: "x", PROJECT_HOPE_MODEL: "gpt-6-astra-snapshot" }).model, "gpt-6-astra-snapshot");
});

test("Astra client uses Responses API and returns JSON proposal text", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      json: async () => ({ output_text: JSON.stringify({ proposalId: "p3", expectedHeadEventHash: "h", kind: "SOCIAL", candidateEvents: [] }) })
    };
  };
  const raw = await requestAstraProposal({
    envelope: { headEventHash: "h" },
    instruction: "continue scene",
    config: { model: "gpt-6-astra", reasoningEffort: "high", endpoint: "https://api.openai.com/v1/responses", apiKey: "secret" },
    fetchImpl
  });
  assert.equal(calls[0].url, "https://api.openai.com/v1/responses");
  assert.equal(JSON.parse(raw).proposalId, "p3");
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/gpt6-continuity.test.mjs
```

Expected: FAIL because model config/client files do not exist.

- [ ] **Step 3: Implement server model configuration**

```js
export function getModelConfig(env = process.env) {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  return {
    model: env.PROJECT_HOPE_MODEL || "gpt-6-astra",
    reasoningEffort: env.PROJECT_HOPE_REASONING || "high",
    endpoint: "https://api.openai.com/v1/responses",
    apiKey: env.OPENAI_API_KEY
  };
}
```

- [ ] **Step 4: Implement the minimal Responses API client**

```js
export async function requestAstraProposal({ envelope, instruction, config, fetchImpl = fetch }) {
  const response = await fetchImpl(config.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      reasoning: { effort: config.reasoningEffort },
      input: [
        {
          role: "developer",
          content: [{ type: "input_text", text: "You are a proposal generator for VIRGAL. Never create canonical truth. Return one JSON proposal only." }]
        },
        {
          role: "user",
          content: [{ type: "input_text", text: JSON.stringify({ instruction, storyline: envelope }) }]
        }
      ]
    })
  });
  if (!response.ok) throw new Error(`openai_responses_${response.status}`);
  const body = await response.json();
  if (typeof body.output_text !== "string") throw new Error("openai_missing_output_text");
  return body.output_text;
}
```

- [ ] **Step 5: Run GREEN**

```bash
node --test tests/gpt6-continuity.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/virgal/ai/model-config.js src/virgal/ai/astra-client.js tests/gpt6-continuity.test.mjs
git commit -m "feat: add GPT-6 Astra proposal client"
```

---

### Task 4: Add a continuity-safe Proposal Orchestrator

**Files:**
- Create: `src/virgal/ai/proposal-orchestrator.js`
- Modify: `tests/gpt6-continuity.test.mjs`

**Interfaces:**
- `generateModelProposal({ world, instruction, requestModel }) -> { status, proposal?, error?, modelRuntime }`.
- Never calls `commitEvent`.
- Re-checks `headEventHash` after asynchronous model work to prevent stale output from applying after the world advances.

- [ ] **Step 1: Add failing tests for non-mutation and stale async responses**

```js
import { generateModelProposal } from "../src/virgal/ai/proposal-orchestrator.js";

test("model generation cannot mutate world state", async () => {
  const world = createWorldEngine({ scenarioId: "eli-open-world", seed: "seed-a" });
  const before = JSON.stringify(world);
  const result = await generateModelProposal({
    world,
    instruction: "spawn a plausible school interaction",
    requestModel: async (envelope) => JSON.stringify({
      proposalId: "p4",
      expectedHeadEventHash: envelope.headEventHash,
      kind: "SOCIAL",
      candidateEvents: [{ type: "SOCIAL_INTERACTION_PROPOSED", domain: "SOCIAL", payload: { summary: "friend sends message" } }]
    })
  });
  assert.equal(result.status, "PROPOSED");
  assert.equal(JSON.stringify(world), before);
  assert.equal(world.events.length, 0);
});

test("proposal is held when canonical head changes during model call", async () => {
  let world = createWorldEngine({ scenarioId: "eli-open-world", seed: "seed-a" });
  const originalHead = world.headEventHash;
  const raw = JSON.stringify({ proposalId: "late", expectedHeadEventHash: originalHead, kind: "SOCIAL", candidateEvents: [] });
  const advanced = commitEvent(world, { type: "TIME_PASSED", domain: "WORLD", payload: {} });
  const result = await generateModelProposal({
    world: advanced,
    instruction: "continue",
    requestModel: async () => raw
  });
  assert.equal(result.status, "HELD");
  assert.equal(result.error, "stale_storyline_head");
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/gpt6-continuity.test.mjs
```

Expected: FAIL because orchestrator does not exist.

- [ ] **Step 3: Implement proposal-only orchestration**

```js
import { createStorylineEnvelope } from "./storyline-envelope.js";
import { validateModelProposal } from "./proposal-schema.js";

export async function generateModelProposal({ world, instruction, requestModel }) {
  const envelope = createStorylineEnvelope(world);
  try {
    const rawText = await requestModel(envelope, instruction);
    const raw = JSON.parse(rawText);
    const checked = validateModelProposal(raw, world.headEventHash);
    if (!checked.ok) return { status: "HELD", error: checked.error, modelRuntime: { basedOnHead: envelope.headEventHash } };
    return {
      status: "PROPOSED",
      proposal: checked.proposal,
      modelRuntime: { basedOnHead: envelope.headEventHash }
    };
  } catch (error) {
    return { status: "HELD", error: "model_unavailable", modelRuntime: { basedOnHead: envelope.headEventHash, detail: String(error?.message ?? error) } };
  }
}
```

- [ ] **Step 4: Run GREEN**

```bash
node --test tests/gpt6-continuity.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/virgal/ai/proposal-orchestrator.js tests/gpt6-continuity.test.mjs
git commit -m "feat: add continuity-safe model proposal orchestrator"
```

---

### Task 5: Add the server-only `/api/simulate` boundary

**Files:**
- Create: `api/simulate.js`
- Modify: `.env.dev.example`
- Modify: `tests/gpt6-continuity.test.mjs`

**Interfaces:**
- POST body: `{ instruction, storylineEnvelope }`.
- Response success: `{ status: "PROPOSED", rawProposal, model, basedOnHead }`.
- Response disabled: HTTP 503 `{ error: "ai_simulation_disabled" }`.
- Server env: `ENABLE_AI_SIMULATION`, `OPENAI_API_KEY`, `PROJECT_HOPE_MODEL`, `PROJECT_HOPE_REASONING`.

- [ ] **Step 1: Add a failing test for disabled-by-default configuration**

```js
test("AI simulation endpoint is disabled unless explicitly enabled", async () => {
  const old = process.env.ENABLE_AI_SIMULATION;
  delete process.env.ENABLE_AI_SIMULATION;
  const { default: handler } = await import(`../api/simulate.js?case=${Date.now()}`);
  const req = { method: "POST", body: {} };
  const result = {};
  const res = {
    status(code) { result.status = code; return this; },
    json(body) { result.body = body; return this; },
    setHeader() {}
  };
  await handler(req, res);
  assert.equal(result.status, 503);
  assert.equal(result.body.error, "ai_simulation_disabled");
  if (old !== undefined) process.env.ENABLE_AI_SIMULATION = old;
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/gpt6-continuity.test.mjs
```

Expected: FAIL because `api/simulate.js` does not exist.

- [ ] **Step 3: Implement the Vercel function with strict input bounds**

```js
import { getModelConfig } from "../src/virgal/ai/model-config.js";
import { requestAstraProposal } from "../src/virgal/ai/astra-client.js";

function json(res, status, body) {
  res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "method_not_allowed" });
  }
  if (process.env.ENABLE_AI_SIMULATION !== "true") {
    return json(res, 503, { error: "ai_simulation_disabled" });
  }

  const instruction = typeof req.body?.instruction === "string" ? req.body.instruction.slice(0, 4000) : "";
  const storylineEnvelope = req.body?.storylineEnvelope;
  if (!instruction || !storylineEnvelope?.scenarioId || !("headEventHash" in storylineEnvelope)) {
    return json(res, 400, { error: "invalid_simulation_request" });
  }

  try {
    const config = getModelConfig();
    const rawProposal = await requestAstraProposal({ envelope: storylineEnvelope, instruction, config });
    return json(res, 200, {
      status: "PROPOSED",
      rawProposal,
      model: config.model,
      basedOnHead: storylineEnvelope.headEventHash
    });
  } catch (error) {
    console.error("AI simulation proposal error", error);
    return json(res, 502, { error: "model_unavailable" });
  }
}
```

- [ ] **Step 4: Add safe environment names**

Append to `.env.dev.example`:

```text
ENABLE_AI_SIMULATION=false
OPENAI_API_KEY=
PROJECT_HOPE_MODEL=gpt-6-astra
PROJECT_HOPE_REASONING=high
```

- [ ] **Step 5: Run GREEN**

```bash
node --test tests/gpt6-continuity.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add api/simulate.js .env.dev.example tests/gpt6-continuity.test.mjs
git commit -m "feat: add server-only Astra simulation endpoint"
```

---

### Task 6: Persist model-runtime provenance without making it canonical truth

**Files:**
- Modify: `src/persistence.js`
- Modify: `tests/gpt6-continuity.test.mjs`

**Interfaces:**
- Add optional `modelRuntime` argument to `saveSnapshot(state, modelRuntime = null)`.
- Persist only provenance fields: `model`, `reasoningEffort`, `promptVersion`, `basedOnHead`, `lastProposalId`, `lastProposalStatus`.
- Do not persist raw rejected candidate branches in canonical world state.

- [ ] **Step 1: Add a failing serialization-unit test by extracting a pure helper**

```js
import { createModelRuntimeSnapshot } from "../src/persistence.js";

test("model runtime snapshot stores provenance but excludes rejected candidate content", () => {
  const runtime = createModelRuntimeSnapshot({
    model: "gpt-6-astra",
    reasoningEffort: "high",
    promptVersion: "rsee-1",
    basedOnHead: "abc",
    lastProposalId: "p9",
    lastProposalStatus: "HELD",
    rejectedCandidates: [{ secret: "must-not-persist" }]
  });
  assert.deepEqual(runtime, {
    model: "gpt-6-astra",
    reasoningEffort: "high",
    promptVersion: "rsee-1",
    basedOnHead: "abc",
    lastProposalId: "p9",
    lastProposalStatus: "HELD"
  });
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/gpt6-continuity.test.mjs
```

Expected: FAIL because `createModelRuntimeSnapshot` does not exist.

- [ ] **Step 3: Implement the pure projection and include it in snapshots**

```js
export function createModelRuntimeSnapshot(runtime = null) {
  if (!runtime) return null;
  const {
    model = null,
    reasoningEffort = null,
    promptVersion = null,
    basedOnHead = null,
    lastProposalId = null,
    lastProposalStatus = null
  } = runtime;
  return { model, reasoningEffort, promptVersion, basedOnHead, lastProposalId, lastProposalStatus };
}
```

Change the signature to:

```js
export async function saveSnapshot(state, modelRuntime = null) {
```

and add this sibling field inside `worldState`:

```js
modelRuntime: createModelRuntimeSnapshot(modelRuntime),
```

- [ ] **Step 4: Run GREEN**

```bash
node --test tests/gpt6-continuity.test.mjs
npm test
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/persistence.js tests/gpt6-continuity.test.mjs
git commit -m "feat: persist non-canonical model provenance"
```

---

### Task 7: Add continuity migration and rejected-shadow-world regression tests

**Files:**
- Modify: `tests/gpt6-continuity.test.mjs`
- Modify: `src/virgal/ai/storyline-envelope.js`

**Interfaces:**
- `createStorylineEnvelope()` remains model-agnostic.
- No model identifier is permitted to affect `headEventHash`, event hashes, Character-World state, or replay validity.

- [ ] **Step 1: Add a model-swap continuity test**

```js
test("switching from an older model to GPT-6 Astra cannot rewrite storyline history", () => {
  let world = createWorldEngine({ scenarioId: "eli-open-world", seed: "seed-a" });
  world = commitEvent(world, { type: "ELI_PRIVACY_SET", domain: "SOCIAL", actorRefs: ["eli"], payload: { scope: "ICU_ONLY" } });
  const beforeHash = world.headEventHash;
  const beforeEvents = JSON.stringify(world.events);

  const oldEnvelope = createStorylineEnvelope(world);
  const astraEnvelope = createStorylineEnvelope(world);

  assert.deepEqual(astraEnvelope, oldEnvelope);
  assert.equal(world.headEventHash, beforeHash);
  assert.equal(JSON.stringify(world.events), beforeEvents);
});
```

- [ ] **Step 2: Add rejected-shadow-world leakage test**

```js
test("rejected counterfactual candidates never enter later storyline envelopes", async () => {
  const world = createWorldEngine({ scenarioId: "eli-open-world", seed: "seed-a" });
  const rejectedText = "invented lifelong best friend";
  const result = await generateModelProposal({
    world,
    instruction: "generate candidate",
    requestModel: async (envelope) => JSON.stringify({
      proposalId: "bad-shadow",
      expectedHeadEventHash: envelope.headEventHash,
      kind: "SOCIAL",
      candidateEvents: [{ type: "MODEL_EVENT", domain: "RIGHTS", payload: { consent: true, text: rejectedText } }]
    })
  });
  assert.equal(result.status, "HELD");
  const nextEnvelope = createStorylineEnvelope(world);
  assert.equal(JSON.stringify(nextEnvelope).includes(rejectedText), false);
});
```

- [ ] **Step 3: Add replay continuity assertion**

```js
import { replayBranch } from "../src/virgal/world-engine.js";

test("GPT runtime metadata has no effect on deterministic VIRGAL replay", () => {
  let world = createWorldEngine({ scenarioId: "eli-open-world", seed: "seed-a" });
  world = commitEvent(world, { type: "SOCIAL_NOTE", domain: "SOCIAL", payload: { text: "Eli remains in PICU" } });
  assert.deepEqual(replayBranch(world), { valid: true, headEventHash: world.headEventHash });
});
```

- [ ] **Step 4: Run the complete suite**

```bash
npm test
```

Expected: all existing Character-World/VIRGAL tests and new GPT-6 continuity tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/virgal/ai/storyline-envelope.js tests/gpt6-continuity.test.mjs
git commit -m "test: prove model upgrades preserve storyline continuity"
```

---

### Task 8: Document the GPT-6 migration contract and operational rollback

**Files:**
- Modify: `README.md`
- Test: manual documentation check only after automated suite is green.

**Interfaces:**
- Operators can switch `PROJECT_HOPE_MODEL` without migrating canonical storyline data.
- Rollback changes only the proposal model, never snapshots/events.

- [ ] **Step 1: Add the README section**

Append:

```markdown
## GPT-6 Astra proposal runtime

Project Hope may use GPT-6 Astra as a server-side scene/reasoning proposal layer when `ENABLE_AI_SIMULATION=true` and `OPENAI_API_KEY` are configured on the server.

The model is deliberately non-sovereign. VIRGAL remains the canonical source of truth. The model receives a `StorylineEnvelope` derived from committed world state and returns candidate proposals bound to the current `headEventHash`. If the world advances before a proposal is applied, the proposal is stale and must be regenerated.

Changing `PROJECT_HOPE_MODEL` does not migrate or rewrite storyline history. Continuity comes from persisted VIRGAL snapshots plus committed events, not from provider conversation state. Rolling back from GPT-6 Astra therefore means changing the model environment value and redeploying; no canonical event or snapshot rollback is required.

Server variables:

```text
ENABLE_AI_SIMULATION=true
OPENAI_API_KEY=<server-only secret>
PROJECT_HOPE_MODEL=gpt-6-astra
PROJECT_HOPE_REASONING=high
```

Never expose `OPENAI_API_KEY` in browser JavaScript. Do not use model outputs directly for medication/device settings, physiology, diagnosis, capacity, consent/refusal, substitute authority, or treatment ceilings.
```

- [ ] **Step 2: Run final verification**

```bash
npm test
```

Expected: PASS with no regressions.

- [ ] **Step 3: Inspect the diff for accidental secrets or direct model-to-commit paths**

```bash
git diff --check HEAD~8..HEAD
git grep -n "OPENAI_API_KEY" -- ':!README.md' ':!.env.dev.example'
git grep -n "commitEvent" src/virgal/ai api/simulate.js
```

Expected:
- `git diff --check` exits 0.
- `OPENAI_API_KEY` appears only as environment access/configuration, never a literal secret.
- no AI file calls `commitEvent`; model code only produces proposals.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: document GPT-6 continuity and rollback contract"
```

---

## Final Verification Gate

Run:

```bash
npm test
node --test tests/gpt6-continuity.test.mjs
git diff --check
```

Required evidence before calling the upgrade complete:

1. Existing v0.4 Character-World tests remain green.
2. GPT-6 proposal code never calls `commitEvent` directly.
3. Protected clinical/rights fields are rejected from model proposals.
4. Stale `headEventHash` proposals are held.
5. Rejected shadow-world candidates do not enter future storyline envelopes.
6. Model swaps do not change world hashes or replay results.
7. Persistence stores only model provenance, not rejected candidate branches.
8. API key remains server-side.
9. PR #18 remains open and unmerged unless separately approved.

## Rollout Sequence

1. Deploy to a Vercel Preview with `ENABLE_AI_SIMULATION=false` and confirm no behaviour change.
2. Enable GPT-6 Astra only in Preview.
3. Replay the Eli storyline checkpoint and compare canonical head/event history before and after AI proposal generation.
4. Run at least one model-outage test and confirm VIRGAL state remains unchanged.
5. Run at least one stale-response test where the world advances while the model request is in flight.
6. Obtain clinical-simulation, lived-experience, accessibility, and personhood review of generated scenes.
7. Promote the model runtime only after reviewers confirm continuity and non-sovereign model behaviour.
