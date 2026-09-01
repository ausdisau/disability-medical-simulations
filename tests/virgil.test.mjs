import test from "node:test";
import assert from "node:assert/strict";
import { scenarios } from "../src/scenarios.js";
import { createRuntime } from "../src/runtime.js";
import { buildVirgilProposal, VIRGIL_CONTRACT } from "../src/virgil.js";

test("VIRGIL contract is advisory and cannot write canonical state", () => {
  assert.equal(VIRGIL_CONTRACT.authority, "advisory_only");
  assert.equal(VIRGIL_CONTRACT.mayWriteCanonicalState, false);
  assert.equal(VIRGIL_CONTRACT.mayInferPatientSpeech, false);
  assert.equal(VIRGIL_CONTRACT.mayDetermineConsentOrCapacity, false);
  assert.equal(VIRGIL_CONTRACT.mayAuthorizeTreatment, false);
});

test("VIRGIL surfaces UNKNOWN rather than inventing Rohan communication", () => {
  const scenario = scenarios.find((item) => item.id === "rohan-alarm");
  const state = createRuntime(scenario);
  const before = JSON.stringify(state);
  const proposal = buildVirgilProposal(state, scenario);
  const after = JSON.stringify(state);

  assert.equal(before, after);
  assert.ok(proposal.unknownEvidence.some((item) => /patient-authored response/i.test(item.label)));
  assert.match(proposal.boundary, /does not alter physiology/i);
});
