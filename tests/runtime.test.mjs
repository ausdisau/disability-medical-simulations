import test from "node:test";
import assert from "node:assert/strict";
import { scenarios } from "../src/scenarios.js";
import {
  advanceStation,
  commitChoice,
  createRuntime,
  facilitatorPause,
  formatTime,
  pauseForCommunication,
  replayCommands,
  restoreCommunication,
  selectChoice,
  startSimulation,
  tick
} from "../src/runtime.js";

test("v1 alpha runtime starts paused with memory-only storage", () => {
  const state = createRuntime(scenarios[0]);
  assert.equal(state.runState, "PAUSED");
  assert.equal(state.system.storage, "memory_only");
  assert.equal(state.system.platformRetention, "none");
});

test("start then tick advances both clocks", () => {
  const started = startSimulation(createRuntime(scenarios[0]));
  const advanced = tick(started, 5);
  assert.equal(advanced.clinicalSeconds, 5);
  assert.equal(advanced.evaluationSeconds, 5);
});

test("AAC composition pauses evaluation time while clinical time continues", () => {
  let state = startSimulation(createRuntime(scenarios[0]));
  state = pauseForCommunication(state);
  state = tick(state, 7);
  assert.equal(state.clinicalSeconds, 7);
  assert.equal(state.evaluationSeconds, 0);
  assert.equal(state.communication.composing, true);
});

test("facilitator pause freezes both clocks", () => {
  let state = startSimulation(createRuntime(scenarios[0]));
  state = facilitatorPause(state);
  const advanced = tick(state, 10);
  assert.equal(advanced.clinicalSeconds, 0);
  assert.equal(advanced.evaluationSeconds, 0);
});

test("restoring communication resumes evaluation without inventing a response", () => {
  let state = startSimulation(createRuntime(scenarios[0]));
  state = pauseForCommunication(state);
  state = tick(state, 3);
  state = restoreCommunication(state);
  state = tick(state, 2);
  assert.equal(state.clinicalSeconds, 5);
  assert.equal(state.evaluationSeconds, 2);
  assert.equal(state.communication.response, "unknown");
});

test("station lifecycle follows evidence-gated v1 alpha states", () => {
  let state = createRuntime(scenarios[0]);
  state = advanceStation(state, "04");
  assert.equal(state.stations["04"], "relevant");
  state = advanceStation(state, "04");
  assert.equal(state.stations["04"], "assigned");
  state = advanceStation(state, "04");
  assert.equal(state.stations["04"], "committed");
  state = advanceStation(state, "04");
  assert.equal(state.stations["04"], "applied");
});

test("cause-led decision opens a new phase without pretending the case is resolved", () => {
  const scenario = scenarios[0];
  let state = createRuntime(scenario);
  state = selectChoice(state, "cause-led");
  const result = commitChoice(state, scenario);
  assert.equal(result.safe, true);
  assert.equal(result.state.phase, "cause-led-reassessment");
  assert.equal(result.state.completed, false);
});

test("removing AAC reduces information reliability but never manufactures a patient answer", () => {
  const scenario = scenarios[0];
  let state = createRuntime(scenario);
  state = selectChoice(state, "remove-aac");
  state = commitChoice(state, scenario).state;
  assert.equal(state.communication.status, "interrupted");
  assert.equal(state.communication.reliability, "unknown");
  assert.equal(state.communication.response, "unknown");
});

test("ordered command log replays to the same deterministic structured state", () => {
  const scenario = scenarios[0];
  let state = createRuntime(scenario);
  state = startSimulation(state);
  state = tick(state, 4);
  state = pauseForCommunication(state);
  state = tick(state, 3);
  state = restoreCommunication(state);
  state = selectChoice(state, "cause-led");
  state = commitChoice(state, scenario).state;
  const replayed = replayCommands(scenario, state.commandLog, { seed: state.seed });
  assert.deepEqual(replayed, state);
});

test("clock formatting remains stable", () => {
  assert.equal(formatTime(0), "00:00");
  assert.equal(formatTime(65), "01:05");
});
