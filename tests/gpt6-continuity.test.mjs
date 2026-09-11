import test from "node:test";
import assert from "node:assert/strict";
import { createWorldEngine, commitEvent } from "../src/virgal/world-engine.js";
import { createStorylineEnvelope } from "../src/virgal/ai/storyline-envelope.js";
import { validateModelProposal } from "../src/virgal/ai/proposal-schema.js";
import { getModelConfig } from "../src/virgal/ai/model-config.js";
import { requestAstraProposal } from "../src/virgal/ai/astra-client.js";
import { generateModelProposal } from "../src/virgal/ai/proposal-orchestrator.js";
import { createModelRuntimeSnapshot } from "../src/persistence.js";

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
  const advanced = commitEvent(world, { type: "TIME_PASSED", domain: "WORLD", payload: {} });
  const raw = JSON.stringify({ proposalId: "late", expectedHeadEventHash: originalHead, kind: "SOCIAL", candidateEvents: [] });
  const result = await generateModelProposal({
    world: advanced,
    instruction: "continue",
    requestModel: async () => raw
  });
  assert.equal(result.status, "HELD");
  assert.equal(result.error, "stale_storyline_head");
});

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
