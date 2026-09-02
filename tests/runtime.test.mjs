import test from "node:test";
import assert from "node:assert/strict";
import { scenarios } from "../src/scenarios.js";
import {
  advanceStation,
  commitChoice,
  createRuntime,
  formatTime,
  pauseForCommunication,
  restoreCommunication,
  selectChoice,
  tick
} from "../src/runtime.js";

test("runtime starts with all stations available", () => {
  const state = createRuntime("adult-suction");
  assert.equal(state.scenarioId, "adult-suction");
  assert.ok(Object.values(state.stations).every((status) => status === "available"));
});

test("AAC composition pauses evaluation time while clinical/world time continues", () => {
  const composing = pauseForCommunication(createRuntime("adult-suction"));
  assert.equal(composing.pauseReason, "communication");
  const next = tick(composing);
  assert.equal(next.seconds, 1);
  assert.equal(next.clinicalSeconds, 1);
  assert.equal(next.evaluationSeconds, 0);
});

test("restoring communication resumes evaluation time", () => {
  const composing = tick(pauseForCommunication(createRuntime("adult-suction")));
  const resumed = restoreCommunication(composing);
  const next = tick(resumed);
  assert.equal(next.seconds, 2);
  assert.equal(next.clinicalSeconds, 2);
  assert.equal(next.evaluationSeconds, 1);
});

test("station state advances one evidence gate at a time", () => {
  let state = createRuntime("rohan-alarm");
  state = advanceStation(state, "04");
  assert.equal(state.stations["04"], "selected");
  state = advanceStation(state, "04");
  assert.equal(state.stations["04"], "checked");
});

test("safe cause-led decision marks the scenario complete", () => {
  const scenario = scenarios[0];
  let state = createRuntime(scenario.id);
  state = selectChoice(state, "cause-led");
  const result = commitChoice(state, scenario);
  assert.equal(result.safe, true);
  assert.equal(result.state.completed, true);
});

test("unsafe decision remains recoverable and does not complete the scenario", () => {
  const scenario = scenarios[1];
  let state = createRuntime(scenario.id);
  state = selectChoice(state, "magic-object");
  const result = commitChoice(state, scenario);
  assert.equal(result.safe, false);
  assert.equal(result.state.completed, false);
  assert.match(result.feedback, /magic-object/i);
});

test("missing decision returns accessible feedback without mutating state", () => {
  const scenario = scenarios[0];
  const state = createRuntime(scenario.id);
  const result = commitChoice(state, scenario);
  assert.equal(result.state, state);
  assert.match(result.feedback, /select a decision/i);
});

test("clock formatting is stable", () => {
  assert.equal(formatTime(0), "00:00");
  assert.equal(formatTime(65), "01:05");
});
