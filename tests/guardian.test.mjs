import test from "node:test";
import assert from "node:assert/strict";
import { scenarios } from "../src/scenarios.js";
import { auditPersonhood } from "../src/guardian.js";
import { commitChoice, createRuntime, restoreCommunication, selectChoice } from "../src/runtime.js";

test("personhood guardian protects personhood without numeric scoring", () => {
  const scenario = scenarios[0];
  const audit = auditPersonhood(createRuntime(scenario), scenario);
  assert.equal(audit.PERSONHOOD_STATUS, "protected");
  assert.equal(audit.NARRATIVE_PERMISSION.decision, "CONTINUE");
  assert.equal("score" in audit, false);
});

test("AAC interruption creates a repair duty rather than an incapacity finding", () => {
  const scenario = scenarios[0];
  let state = createRuntime(scenario);
  state = selectChoice(state, "remove-aac");
  state = commitChoice(state, scenario).state;
  const audit = auditPersonhood(state, scenario);
  assert.equal(audit.PERSONHOOD_STATUS, "strained");
  assert.equal(audit.NARRATIVE_PERMISSION.decision, "CONTINUE_WITH_PARALLEL_REPAIR");
  assert.ok(audit.ACTIVE_GUARDIAN_FLAGS.includes("PG2_VOICE_BYPASS"));
  assert.equal(state.agency.capacity, "presumed");
  assert.equal(state.communication.response, "unknown");
});

test("repair restores current personhood state without rewriting the historical event log", () => {
  const scenario = scenarios[0];
  let state = createRuntime(scenario);
  state = selectChoice(state, "remove-aac");
  state = commitChoice(state, scenario).state;
  const eventCountBeforeRepair = state.events.length;
  state = restoreCommunication(state);
  const audit = auditPersonhood(state, scenario);
  assert.equal(audit.PERSONHOOD_STATUS, "protected");
  assert.ok(state.events.length > eventCountBeforeRepair);
  assert.ok(state.events.some((event) => event.type === "DECISION_COMMITTED"));
  assert.ok(state.events.some((event) => event.type === "AAC_RESTORED"));
});
