import test from "node:test";
import assert from "node:assert/strict";
import { createWorldEngine, commitEvent, replayBranch } from "../src/virgal/world-engine.js";
import { createCharacterWorld } from "../src/virgal/character-world/state.js";
import { createStorylineEnvelope } from "../src/virgal/ai/storyline-envelope.js";
import { validateModelProposal } from "../src/virgal/ai/proposal-schema.js";
import { getModelConfig } from "../src/virgal/ai/model-config.js";
import { requestAstraProposal } from "../src/virgal/ai/astra-client.js";
import { generateModelProposal } from "../src/virgal/ai/proposal-orchestrator.js";
import { createModelRuntimeSnapshot, buildSnapshotPayload } from "../src/persistence.js";

test("external storyline envelope excludes patient-controlled claims unless explicitly model-shareable", () => {
  const characterWorld = createCharacterWorld({
    patientPrincipalId: "eli",
    characters: [{ id: "eli", agentClass: "PATIENT_PRINCIPAL" }, { id: "friend", agentClass: "NPC" }]
  });
  let world = createWorldEngine({ scenarioId: "eli-open-world", seed: "seed-a", characterWorld });
  world = commitEvent(world, {
    type: "CLAIM_ASSERTED",
    domain: "INFORMATION",
    actorRefs: ["eli"],
    payload: {
      claim: { id: "private-icu-detail", proposition: "private detail", privacyScope: "PATIENT_CONTROLLED", protected: true },
      recipients: ["eli"]
    }
  });
  world = commitEvent(world, {
    type: "CLAIM_ASSERTED",
    domain: "INFORMATION",
    actorRefs: ["eli"],
    payload: {
      claim: { id: "shareable-status", proposition: "Eli is in ICU", privacyScope: "PUBLIC", modelShareable: true },
      recipients: ["eli"]
    }
  });

  const envelope = createStorylineEnvelope(world, { externalProvider: true });
  const serialized = JSON.stringify(envelope);
  assert.equal(serialized.includes("private detail"), false);
  assert.equal(serialized.includes("shareable-status"), true);
});

test("proposal validation rejects unknown candidate fields and device settings", () => {
  const result = validateModelProposal({
    proposalId: "strict-1",
    expectedHeadEventHash: "head",
    kind: "SOCIAL",
    candidateDialogue: [],
    candidateEvents: [{
      candidateId: "c1",
      category: "MOVEMENT",
      summary: "move toward doorway",
      actorRefs: ["friend"],
      targetRefs: [],
      locationRef: "school",
      factState: "GENERATED_CANDIDATE",
      deviceSettings: { pressure: 99 }
    }],
    uncertainty: "low",
    sourceRefs: []
  }, "head");
  assert.equal(result.ok, false);
  assert.equal(result.error, "invalid_proposal_shape");
});

test("current supported-model default is gpt-5.6-sol and overrides require allowlisting", () => {
  const base = getModelConfig({ OPENAI_API_KEY: "x" });
  assert.equal(base.model, "gpt-5.6-sol");
  assert.throws(() => getModelConfig({ OPENAI_API_KEY: "x", PROJECT_HOPE_MODEL: "gpt-6-astra" }), /not allowed/i);
  const future = getModelConfig({
    OPENAI_API_KEY: "x",
    PROJECT_HOPE_MODEL: "future-model",
    PROJECT_HOPE_ALLOWED_MODELS: "gpt-5.6-sol,future-model",
    PROJECT_HOPE_REASONING: "high"
  });
  assert.equal(future.model, "future-model");
});

test("Responses client uses store false, strict json schema, abort signal, and raw output parsing", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      json: async () => ({
        output: [{
          type: "message",
          content: [{
            type: "output_text",
            text: JSON.stringify({
              proposalId: "raw-1",
              expectedHeadEventHash: "head",
              kind: "SOCIAL",
              actorRefs: [],
              targetRefs: [],
              locationRef: null,
              candidateDialogue: [],
              candidateEvents: [],
              uncertainty: "low",
              sourceRefs: []
            })
          }]
        }]
      })
    };
  };
  const raw = await requestAstraProposal({
    envelope: { headEventHash: "head" },
    instruction: "continue",
    config: {
      model: "gpt-5.6-sol",
      reasoningEffort: "high",
      endpoint: "https://api.openai.com/v1/responses",
      apiKey: "secret",
      timeoutMs: 2500
    },
    fetchImpl
  });
  const sent = JSON.parse(calls[0].init.body);
  assert.equal(sent.store, false);
  assert.equal(sent.text.format.type, "json_schema");
  assert.equal(sent.text.format.strict, true);
  assert.ok(calls[0].init.signal);
  assert.equal(JSON.parse(raw).proposalId, "raw-1");
});

test("orchestrator rechecks the canonical head after an awaited model request", async () => {
  let currentHead = null;
  const world = createWorldEngine({ scenarioId: "eli-open-world", seed: "seed-a" });
  currentHead = world.headEventHash;
  const result = await generateModelProposal({
    world,
    instruction: "continue",
    requestModel: async (envelope) => {
      currentHead = "advanced-head";
      return JSON.stringify({
        proposalId: "late-2",
        expectedHeadEventHash: envelope.headEventHash,
        kind: "SOCIAL",
        actorRefs: [],
        targetRefs: [],
        locationRef: null,
        candidateDialogue: [],
        candidateEvents: [],
        uncertainty: "low",
        sourceRefs: []
      });
    },
    getCurrentHead: async () => currentHead,
    modelRuntime: { model: "gpt-5.6-sol", reasoningEffort: "high", promptVersion: "rsee-1" }
  });
  assert.equal(result.status, "HELD");
  assert.equal(result.error, "stale_storyline_head");
  assert.equal(result.modelRuntime.currentHead, "advanced-head");
});

test("snapshot payload keeps model provenance only and omits absent metadata", () => {
  const state = {
    scenarioId: "eli-open-world",
    seconds: 10,
    events: [],
    stations: {},
    world: createWorldEngine({ scenarioId: "eli-open-world", seed: "seed-a" })
  };
  const payload = buildSnapshotPayload(state, {
    model: "gpt-5.6-sol",
    reasoningEffort: "high",
    basedOnHead: "abc",
    rejectedCandidates: [{ secret: "do-not-store" }]
  });
  assert.equal(payload.worldState.modelRuntime.model, "gpt-5.6-sol");
  assert.equal("promptVersion" in payload.worldState.modelRuntime, false);
  assert.equal(JSON.stringify(payload).includes("do-not-store"), false);
});

test("model selection changes provenance without changing canonical replay", () => {
  let world = createWorldEngine({ scenarioId: "eli-open-world", seed: "seed-a" });
  world = commitEvent(world, { type: "SOCIAL_NOTE", domain: "SOCIAL", payload: { text: "Eli remains in PICU" } });
  const before = JSON.stringify(world.events);
  const hash = world.headEventHash;
  const currentRuntime = createModelRuntimeSnapshot({ model: "gpt-5.6-sol", basedOnHead: hash });
  const futureRuntime = createModelRuntimeSnapshot({ model: "future-model", basedOnHead: hash });
  assert.notDeepEqual(currentRuntime, futureRuntime);
  assert.equal(JSON.stringify(world.events), before);
  assert.equal(world.headEventHash, hash);
  assert.equal(replayBranch(world).valid, true);
});
