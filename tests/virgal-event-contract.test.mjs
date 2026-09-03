import test from "node:test";
import assert from "node:assert/strict";
import { createWorldEngine } from "../src/virgal/world-engine.js";
import { commitGuardedEvent } from "../src/virgal/event-contract.js";

const route = {
  decision: "ALLOW_SIMULATION",
  domain: "ordinary_world",
  mode: "WORLD_FREE",
  owner: "VIRGAL",
  canCommit: true,
  requiresGuardian: false,
  reasonCodes: [],
  accessibleReason: "Bounded ordinary-world event is owned by VIRGAL."
};

test("guarded event records authority, provenance, revision and idempotency", () => {
  const world = createWorldEngine({ scenarioId: "open-world", seed: "seed", branchId: "canonical", scenarioVersion: "1.0.0" });
  const result = commitGuardedEvent(world, {
    type: "MAKE_BREAKFAST",
    domain: "ordinary_world",
    idempotencyKey: "home:breakfast:1",
    expectedWorldVersion: 0,
    initialCondition: true,
    causalParents: [],
    committedEffects: [{ path: "home.breakfast", op: "set", value: "started" }],
    provenance: { source: "virgal", type: "synthetic_world" }
  }, { route, guardianDecision: "ALLOW_SIMULATION" });

  assert.equal(result.committed, true);
  assert.equal(result.world.revision, 1);
  assert.equal(result.event.authorityOwner, "VIRGAL");
  assert.equal(result.event.guardianDecision, "ALLOW_SIMULATION");
});

test("duplicate idempotency key does not double-commit", () => {
  let world = createWorldEngine({ scenarioId: "open-world", seed: "seed", scenarioVersion: "1.0.0" });
  const proposal = {
    type: "MAKE_BREAKFAST",
    domain: "ordinary_world",
    idempotencyKey: "home:breakfast:1",
    expectedWorldVersion: 0,
    initialCondition: true,
    causalParents: [],
    committedEffects: [],
    provenance: { source: "virgal", type: "synthetic_world" }
  };
  const first = commitGuardedEvent(world, proposal, { route, guardianDecision: "ALLOW_SIMULATION" });
  const second = commitGuardedEvent(first.world, { ...proposal, expectedWorldVersion: 1 }, { route, guardianDecision: "ALLOW_SIMULATION" });
  assert.equal(second.committed, false);
  assert.ok(second.errors.includes("EVENT-IDEMPOTENCY-DUPLICATE"));
});

test("conflicting or missing authority owner blocks protected commit", () => {
  const world = createWorldEngine({ scenarioId: "open-world", seed: "seed", scenarioVersion: "1.0.0" });
  const clinicalRoute = { ...route, domain: "clinical", mode: "CLINICAL_GUARDED", owner: "CLINICAL_CONTROLLER", canCommit: false, requiresGuardian: true };
  const result = commitGuardedEvent(world, {
    type: "VENTILATOR_CHANGE",
    domain: "clinical",
    idempotencyKey: "clinical:vent:1",
    expectedWorldVersion: 0,
    initialCondition: true,
    causalParents: [],
    committedEffects: [],
    provenance: { source: "virgal", type: "proposal" }
  }, { route: clinicalRoute, guardianDecision: "BLOCK_UNSUPPORTED" });
  assert.equal(result.committed, false);
  assert.ok(result.errors.includes("EVENT-AUTHORITY-DENIED"));
});
