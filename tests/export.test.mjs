import test from "node:test";
import assert from "node:assert/strict";
import { scenarios } from "../src/scenarios.js";
import { buildSimulationExport } from "../src/export.js";
import { createRuntime, startSimulation, tick } from "../src/runtime.js";

test("v1 alpha JSON export is fictional, stateless and provenance-labelled", () => {
  const scenario = scenarios[0];
  let state = startSimulation(createRuntime(scenario));
  state = tick(state, 2);
  const payload = buildSimulationExport({
    scenario,
    state,
    accessibility: { reducedMotion: true },
    exportedAt: "2026-09-01T00:00:00.000Z"
  });

  assert.equal(payload.format, "project-hope-simulation");
  assert.equal(payload.dataOrigin, "fictional_synthetic");
  assert.equal(payload.fictionalPatient, true);
  assert.equal(payload.containsRealPatientData, false);
  assert.equal(payload.storagePolicy.runtime, "memory_only");
  assert.equal(payload.storagePolicy.platformRetention, "none");
  assert.equal(payload.storagePolicy.serverDatabase, false);
  assert.equal(payload.storagePolicy.browserPersistence, false);
  assert.equal(payload.runtime.clinicalSeconds, 2);
  assert.equal(payload.runtime.evaluationSeconds, 2);
  assert.equal(payload.provenance.application, "Project Hope Emulator");
  assert.ok(Array.isArray(payload.commandLog));
  assert.ok(payload.personhoodGuardian);
});

test("export refuses a scenario that is not explicitly fictional synthetic", () => {
  const scenario = { ...scenarios[0], data_origin: "unknown" };
  const state = createRuntime(scenarios[0]);
  assert.throws(() => buildSimulationExport({ scenario, state }), /fictional synthetic/i);
});
