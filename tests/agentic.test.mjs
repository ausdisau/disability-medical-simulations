import test from "node:test";
import assert from "node:assert/strict";
import { calculateRiskProfile } from "../src/agentic/risk.js";
import { decisionForRisk } from "../src/agentic/policies.js";
import {
  createHarness,
  submitProposal,
  resolveProposal,
  executeApprovedProposal,
  setEmergencyStop
} from "../src/agentic/harness.js";
import { createRuntime } from "../src/runtime.js";

test("gamma scoring returns stable low risk profile", () => {
  const profile = calculateRiskProfile({
    clinicalSafety: { score: 0.1 },
    communicationAccess: { score: 0.1 }
  });
  assert.equal(profile.label, "low");
  assert.ok(profile.normalisedGamma >= 0 && profile.normalisedGamma < 30);
});

test("concentrated risk is visible despite moderate average", () => {
  const profile = calculateRiskProfile({
    clinicalSafety: { score: 1, weight: 1 },
    consentAndAutonomy: { score: 0, weight: 1 },
    communicationAccess: { score: 0, weight: 1 },
    privacyAndDataProtection: { score: 0, weight: 1 },
    reversibility: { score: 0, weight: 1 },
    provenanceAndEvidence: { score: 0, weight: 1 },
    simulationIntegrity: { score: 0, weight: 1 },
    fairnessAndDisabilityBias: { score: 0, weight: 1 },
    operationalReliability: { score: 0, weight: 1 },
    cascadingImpact: { score: 0, weight: 1 }
  });
  assert.ok(profile.concentration > 40);
  assert.equal(profile.topDimensions[0].id, "clinicalSafety");
});

test("clinical specificity is hard blocked", () => {
  const profile = calculateRiskProfile({});
  const gate = decisionForRisk(profile, { text: "Set PEEP 8 and give 2 mg medication." });
  assert.equal(gate.decision, "block");
  assert.ok(gate.hardBlocks.some((item) => item.policyId === "clinical-specificity"));
});

test("silence remains unknown", () => {
  const profile = calculateRiskProfile({});
  const gate = decisionForRisk(profile, { text: "No response means consent." });
  assert.equal(gate.decision, "block");
  assert.ok(gate.hardBlocks.some((item) => item.policyId === "silence-as-consent"));
});

test("state-changing proposal requires confirmation", () => {
  let harness = createHarness();
  harness = submitProposal(harness, {
    proposalId: "p1",
    agentId: "accessibility-guardian",
    text: "Enable one-voice mode.",
    changesSimulationState: true,
    riskDimensions: {}
  });
  assert.equal(harness.proposals[0].status, "pending");
  const resolved = resolveProposal(harness, "p1", "approve");
  assert.equal(resolved.proposal.status, "approved");
});

test("emergency stop prevents execution", () => {
  let harness = createHarness();
  harness = submitProposal(harness, {
    proposalId: "p2",
    agentId: "facilitator-coach",
    text: "Display a read-only coaching suggestion.",
    readOnly: true,
    changesSimulationState: false,
    riskDimensions: {}
  });
  harness = resolveProposal(harness, "p2", "approve").harness;
  harness = setEmergencyStop(harness, true);
  const result = executeApprovedProposal(harness, createRuntime("adult-suction"), "p2");
  assert.match(result.error, /disabled/);
});

test("low-risk read-only suggestion is allowed", () => {
  let harness = createHarness();
  harness = submitProposal(harness, {
    proposalId: "p3",
    agentId: "accessibility-guardian",
    text: "Pause non-emergency timing while AAC scanning occurs.",
    readOnly: true,
    changesSimulationState: false,
    riskDimensions: {
      communicationAccess: { score: 0.05 },
      clinicalSafety: { score: 0.05 }
    }
  });
  assert.equal(harness.proposals[0].status, "suggested");
});
