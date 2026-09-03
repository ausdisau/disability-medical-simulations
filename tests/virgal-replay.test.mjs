import test from "node:test";
import assert from "node:assert/strict";
import {
  chooseDeterministicAction,
  deriveNamedStreamId,
  hashCanonicalState,
  sha256Hex,
  verifyRecordedStochasticTrace
} from "../src/virgal/determinism.js";
import { commitEvent, createWorldEngine, forkBranch, setFocus } from "../src/virgal/world-engine.js";

const candidates = [
  { id: "rest", utility: 0.7, eligible: true },
  { id: "call", utility: 0.6, eligible: true },
  { id: "answer-for-patient", utility: 1.0, eligible: false }
];

test("SHA-256 implementation matches the standard abc vector", () => {
  assert.equal(
    sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
  );
});

test("REPLAY-001 identical inputs yield identical stochastic trace and state hash", () => {
  const input = {
    rootSeed: "4819",
    scenarioVersion: "1.0.0",
    branchId: "canonical",
    actorId: "family-01",
    randomnessPurpose: "ordinary-goal-tiebreak",
    drawKey: "decision-4",
    candidates
  };
  const a = chooseDeterministicAction(input);
  const b = chooseDeterministicAction(input);
  assert.deepEqual(a, b);

  let world1 = createWorldEngine({ scenarioId: "alex", seed: "4819", scenarioVersion: "1.0.0" });
  let world2 = createWorldEngine({ scenarioId: "alex", seed: "4819", scenarioVersion: "1.0.0" });
  world1 = commitEvent(world1, { type: a.selectedActionId, domain: "WORLD", payload: { trace: a.trace } });
  world2 = commitEvent(world2, { type: b.selectedActionId, domain: "WORLD", payload: { trace: b.trace } });
  assert.equal(hashCanonicalState(world1), hashCanonicalState(world2));
});

test("render-only camera focus does not change canonical state hash", () => {
  const world = createWorldEngine({ scenarioId: "alex", seed: "4819", scenarioVersion: "1.0.0" });
  const focused = setFocus(world, "HOME_KITCHEN");
  assert.equal(hashCanonicalState(world), hashCanonicalState(focused));
});

test("REPLAY-002 recorded trace validates without resampling", () => {
  const selected = chooseDeterministicAction({
    rootSeed: "4819",
    scenarioVersion: "1.0.0",
    branchId: "canonical",
    actorId: "family-01",
    randomnessPurpose: "ordinary-goal-tiebreak",
    drawKey: "decision-4",
    candidates
  });
  assert.equal(verifyRecordedStochasticTrace(selected.trace, selected.trace).valid, true);
});

test("REPLAY-003 branch fork keeps pre-fork state but changes named stream", () => {
  let world = createWorldEngine({ scenarioId: "alex", seed: "4819", branchId: "canonical", scenarioVersion: "1.0.0" });
  world = commitEvent(world, { type: "PRE_FORK", domain: "WORLD", payload: {} });
  const child = forkBranch(world, { branchId: "variant-a", seed: "9001" });
  assert.equal(child.events[0].eventHash, world.events[0].eventHash);
  const parentStream = deriveNamedStreamId({ rootSeed: world.seed, scenarioVersion: world.scenarioVersion, branchId: world.branchId, actorId: "family-01", randomnessPurpose: "ordinary-goal-tiebreak" });
  const childStream = deriveNamedStreamId({ rootSeed: child.seed, scenarioVersion: child.scenarioVersion, branchId: child.branchId, actorId: "family-01", randomnessPurpose: "ordinary-goal-tiebreak" });
  assert.notEqual(parentStream, childStream);
});

test("variant branch requires a new branch id and seed", () => {
  const world = createWorldEngine({ scenarioId: "alex", seed: "4819", branchId: "canonical", scenarioVersion: "1.0.0" });
  assert.throws(() => forkBranch(world, { branchId: "canonical", seed: "9001" }), /branch/i);
  assert.throws(() => forkBranch(world, { branchId: "variant-a", seed: "4819" }), /seed/i);
  assert.throws(() => forkBranch(world, { branchId: "variant-a" }), /seed/i);
});
