import test from "node:test";
import assert from "node:assert/strict";
import { scenarios, stationDefinitions } from "../src/scenarios.js";
import { PICU_COURSE_SECTIONS, PICU_TRAINER_SOURCE } from "../src/picuTrainer.js";
import { advanceStation, createRuntime, reassess } from "../src/runtime.js";

test("PICU Trainer convergence exposes exactly 20 canonical IAS stations", () => {
  assert.equal(stationDefinitions.length, 20);
  assert.deepEqual(stationDefinitions.map((item) => item.id), [
    "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"
  ]);
});

test("ported station library is genericised and excludes real-person persona content", () => {
  const serialized = JSON.stringify(stationDefinitions);
  assert.doesNotMatch(serialized, /Jonathan/i);
  assert.doesNotMatch(serialized, /NDIS number/i);
  assert.equal(PICU_TRAINER_SOURCE.excludedScope.includes("persona_store_and_private_identity_fields"), true);
});

test("course navigation preserves eight PICU learning sections", () => {
  assert.equal(PICU_COURSE_SECTIONS.length, 8);
  assert.equal(PICU_COURSE_SECTIONS[0].label, "Orientation");
  assert.equal(PICU_COURSE_SECTIONS.at(-1).label, "Completion / JSON");
});

test("alternative airway station stays evidence-locked until current plan is applied", () => {
  let state = createRuntime(scenarios[0]);
  assert.equal(state.stations["03"], "locked_by_evidence");

  const blocked = advanceStation(state, "03");
  assert.equal(blocked.stations["03"], "locked_by_evidence");
  assert.equal(blocked.events.at(-1).type, "STATION_BLOCKED");

  state = blocked;
  for (let i = 0; i < 4; i += 1) state = advanceStation(state, "04");
  assert.equal(state.stations["04"], "applied");
  assert.equal(state.evidence.currentPlanReviewed, true);

  state = advanceStation(state, "03");
  assert.equal(state.stations["03"], "relevant");
  assert.equal(state.events.at(-1).type, "STATION_GATE_OPENED");
});

test("defibrillator station requires reassessment plus supporting breathing evidence", () => {
  let state = createRuntime(scenarios[1]);
  state = advanceStation(state, "18");
  assert.equal(state.stations["18"], "locked_by_evidence");

  state = reassess(state);
  state = advanceStation(state, "18");
  assert.equal(state.stations["18"], "locked_by_evidence");

  for (let i = 0; i < 4; i += 1) state = advanceStation(state, "17");
  assert.equal(state.stations["17"], "applied");

  state = advanceStation(state, "18");
  assert.equal(state.stations["18"], "relevant");
});
