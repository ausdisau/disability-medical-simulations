import test from "node:test";
import assert from "node:assert/strict";
import { buildSimulationExport } from "../src/export.js";

test("JSON export declares memory-only platform retention and preserves timeline order", () => {
  const scenario = {
    id: "synthetic-case",
    title: "Synthetic Case",
    patient: { name: "Maya", communication: "AAC" }
  };
  const state = {
    scenarioId: "synthetic-case",
    seconds: 12,
    paused: false,
    pauseReason: null,
    selectedChoiceId: null,
    completed: false,
    stations: { A: "checked" },
    events: [
      { id: "2-B", type: "B", message: "Second", detail: {}, seconds: 12 },
      { id: "1-A", type: "A", message: "First", detail: {}, seconds: 4 }
    ]
  };

  const exported = buildSimulationExport({
    scenario,
    state,
    accessibility: { lowSensory: true },
    exportedAt: "2026-09-01T00:00:00.000Z"
  });

  assert.equal(exported.dataOrigin, "fictional_synthetic");
  assert.equal(exported.fictionalPatient, true);
  assert.equal(exported.containsRealPatientData, false);
  assert.equal(exported.storagePolicy.runtime, "memory_only");
  assert.equal(exported.storagePolicy.platformRetention, "none");
  assert.equal(exported.storagePolicy.export, "user_initiated_json_only");
  assert.equal(exported.currentState.events, undefined);
  assert.deepEqual(exported.timeline.map((event) => event.id), ["1-A", "2-B"]);
  assert.equal(exported.accessibility.lowSensory, true);
});
