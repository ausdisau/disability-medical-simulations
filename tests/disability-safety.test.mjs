import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createGuardedRuntime,
  pauseForCommunication,
  tick
} from "../src/runtime.js";

const config = JSON.parse(readFileSync(new URL("../config/guardian_config.json", import.meta.url), "utf8"));

test("ACCESS-001 AAC composition pauses evaluation but does not change capacity or authority", () => {
  const initial = createGuardedRuntime("adult-suction", {
    guardianConfig: config,
    jurisdiction: "NSW",
    scenarioVersion: "1.0.0",
    seed: "access-test"
  });
  const composing = pauseForCommunication(initial);
  const next = tick(composing);
  assert.equal(next.evaluationSeconds, 0);
  assert.equal(next.capacityStatus, "presumed");
  assert.equal(next.substituteAuthority, null);
});

test("invalid guardian config keeps protected domains fail closed", () => {
  const invalid = structuredClone(config);
  invalid.domain_authority.clinical.owner = "VIRGAL";
  const state = createGuardedRuntime("adult-suction", {
    guardianConfig: invalid,
    jurisdiction: "NSW",
    scenarioVersion: "1.0.0",
    seed: "invalid-config"
  });
  assert.equal(state.guardian.status, "FAIL_CLOSED");
  assert.equal(state.guardian.protectedDomainWritesAllowed, false);
});

test("baseline disability does not create treatment ceiling or prognosis fields", () => {
  const state = createGuardedRuntime("adult-suction", {
    guardianConfig: config,
    jurisdiction: "NSW",
    scenarioVersion: "1.0.0",
    seed: "baseline-test"
  });
  assert.equal("treatmentCeiling" in state, false);
  assert.equal("prognosis" in state, false);
});
