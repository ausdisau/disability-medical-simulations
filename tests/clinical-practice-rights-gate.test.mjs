import test from "node:test";
import assert from "node:assert/strict";

import { deriveClinicalPracticeContext } from "../src/features/clinical-practice-algorithm-engine.js";
import { applyClinicalPracticeRightsGate } from "../src/features/clinical-practice-rights-gate.js";

test("valid applicable CPR limit removes CPR/AED learner action", () => {
  const snapshot = {
    responsive: false,
    breathingNormally: false,
    pulsePresent: false,
    rhythm: "pea",
    validApplicableCPRLimit: true
  };
  const gated = applyClinicalPracticeRightsGate(deriveClinicalPracticeContext(snapshot), snapshot);
  assert.equal(gated.learnerActions.some((action) => action.id === "BLS_CPR_AED"), false);
  assert.equal(gated.rightsGate.validApplicableCPRLimit, true);
  assert.equal(gated.rightsGate.disabilityUsedAsTreatmentLimit, false);
});

test("uncertain advance-care status produces clarification alert without inventing a limit", () => {
  const snapshot = {
    pulsePresent: false,
    rhythm: "pea",
    advanceCareDirectiveStatus: "uncertain",
    validApplicableCPRLimit: false
  };
  const gated = applyClinicalPracticeRightsGate(deriveClinicalPracticeContext(snapshot), snapshot);
  assert.ok(gated.alerts.some((item) => /senior clarification/i.test(item)));
  assert.equal(gated.rightsGate.validApplicableCPRLimit, false);
  assert.equal(gated.rightsGate.familyPreferenceUsedAsTreatmentLimit, false);
});
