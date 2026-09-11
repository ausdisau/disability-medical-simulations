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
