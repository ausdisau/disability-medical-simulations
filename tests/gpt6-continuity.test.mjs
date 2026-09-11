import test from "node:test";
import assert from "node:assert/strict";
import { createWorldEngine, commitEvent } from "../src/virgal/world-engine.js";
import { createStorylineEnvelope } from "../src/virgal/ai/storyline-envelope.js";
import { validateModelProposal } from "../src/virgal/ai/proposal-schema.js";

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
