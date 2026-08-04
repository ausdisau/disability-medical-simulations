import test from "node:test";
import assert from "node:assert/strict";
import { scenarios } from "../src/scenarios.js";
import { rohanTree } from "../src/rohan-tree.js";
import {
  advanceStation,
  commitChoice,
  commitTreeChoice,
  createRuntime,
  createTreeRuntime,
  formatTime,
  pauseForCommunication,
  reassess,
  restoreCommunication,
  selectChoice,
  summarizeOutcome,
  tick
} from "../src/runtime.js";

test("legacy runtime starts with all stations available", () => {
  const state = createRuntime("adult-suction");
  assert.ok(Object.values(state.stations).every((status) => status === "available"));
});

test("tree runtime starts with body, voice and system ledgers", () => {
  const state = createTreeRuntime(rohanTree);
  assert.equal(state.nodeId, "baseline-refuge");
  assert.equal(state.voice.latestReliableMessage, "WAIT");
  assert.equal(state.body.oxygenation, 4);
  assert.equal(state.system.aacCalibrated, true);
});

test("AAC pause freezes simulation time", () => {
  const paused = pauseForCommunication(createTreeRuntime(rohanTree));
  assert.equal(paused.paused, true);
  assert.equal(tick(paused).seconds, 0);
});

test("restoring communication resumes time and calibration", () => {
  const resumed = restoreCommunication(pauseForCommunication(createTreeRuntime(rohanTree)));
  assert.equal(resumed.paused, false);
  assert.equal(resumed.system.aacCalibrated, true);
  assert.equal(tick(resumed).seconds, 1);
});

test("tree choices move to a new node and persist consequences", () => {
  let state = createTreeRuntime(rohanTree);
  state = selectChoice(state, "ask-for-choice-now");
  const result = commitTreeChoice(state, rohanTree);
  assert.equal(result.state.nodeId, "comparison-repair");
  assert.equal(result.state.trust.rohanTeam, 1);
  assert.equal(result.state.crisisDebt, 1);
  assert.deepEqual(result.state.history, ["baseline-refuge", "comparison-repair"]);
});

test("automatic crisis effects apply on entry", () => {
  let state = createTreeRuntime(rohanTree);
  state = { ...state, nodeId: "consent-opening", history: ["consent-opening"], visited: { "consent-opening": 1 } };
  state = selectChoice(state, "scope-and-rescue");
  const result = commitTreeChoice(state, rohanTree);
  assert.equal(result.state.nodeId, "acute-deterioration");
  assert.equal(result.state.voice.reliability, "slower");
  assert.ok(result.state.body.ventilation < 4);
});

test("reassessment reduces crisis debt but never below zero", () => {
  let state = createTreeRuntime(rohanTree);
  state = { ...state, crisisDebt: 2 };
  state = reassess(state);
  assert.equal(state.crisisDebt, 1);
  state = reassess(reassess(state));
  assert.equal(state.crisisDebt, 0);
});

test("outcome summary exposes decision integrity measures", () => {
  const outcome = summarizeOutcome(createTreeRuntime(rohanTree));
  assert.equal(outcome.voice, "reliable");
  assert.equal(outcome.crisisDebt, 0);
  assert.equal(outcome.decisions, 0);
});

test("station state advances one evidence gate at a time", () => {
  let state = createRuntime("rohan-alarm");
  state = advanceStation(state, "04");
  assert.equal(state.stations["04"], "selected");
  state = advanceStation(state, "04");
  assert.equal(state.stations["04"], "checked");
});

test("legacy scenario decisions remain supported", () => {
  const scenario = scenarios[0];
  let state = createRuntime(scenario.id);
  state = selectChoice(state, "cause-led");
  const result = commitChoice(state, scenario);
  assert.equal(result.safe, true);
  assert.equal(result.state.completed, true);
});

test("missing tree decision returns accessible feedback without mutation", () => {
  const state = createTreeRuntime(rohanTree);
  const result = commitTreeChoice(state, rohanTree);
  assert.equal(result.state, state);
  assert.match(result.feedback, /select a decision/i);
});

test("clock formatting is stable", () => {
  assert.equal(formatTime(0), "00:00");
  assert.equal(formatTime(65), "01:05");
});
