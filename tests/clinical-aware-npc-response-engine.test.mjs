import test from "node:test";
import assert from "node:assert/strict";

import { createRelationalSubstrate } from "../src/features/biosocial-relational-substrate.js";
import { buildClinicalAwareNPCResponse } from "../src/features/clinical-aware-npc-response-engine.js";

function fixture() {
  return createRelationalSubstrate({
    patientId: "maya",
    actors: [
      { id: "maya", label: "Maya", role: "patient", kind: "patient", directCommunicationSkill: 1, roleClarity: 1 },
      { id: "mother", label: "Maya's mother", role: "trusted family supporter", kind: "family", stress: 0.8, informationNeed: 0.9, controlImpulse: 0.8, roleClarity: 0.7 }
    ],
    relationships: [
      { from: "mother", to: "maya", trust: 0.507, conflict: 0.564, autonomyAlignment: 0.734, communicationReliability: 0.8, boundaryRespect: 0.7, supportAvailability: 0.8 }
    ],
    access: { communicationAccessReliability: 0.95, directPatientVoiceAvailable: true }
  });
}

test("post-ROSC/sepsis facts are available to dialogue without changing relational state", () => {
  const state = fixture();
  const before = JSON.stringify(state);
  const turn = buildClinicalAwareNPCResponse(state, {
    npcActorId: "mother",
    studentAction: "We are watching her closely and I can explain what we know and what is still uncertain.",
    clinicalSnapshot: {
      rosc: true,
      pulsePresent: true,
      respiratoryDeterioration: true,
      suspectedInfection: true,
      clinicallySignificantOrganDysfunction: true,
      oxygenSaturationReliable: true,
      hypercapnicRespiratoryFailure: true,
      tracheostomyPresent: true,
      tracheostomyPatent: true,
      learnerScope: "BLS"
    }
  });
  assert.ok(turn.clinicalPractice.activePathways.includes("POST_ROSC"));
  assert.ok(turn.clinicalPractice.activePathways.includes("SEPSIS_PATHWAY"));
  assert.equal(turn.clinicalPractice.npcSafeFacts.postROSCActive, true);
  assert.equal(turn.rightsConstraints.npcCanCommitClinicalEvent, false);
  assert.equal(JSON.stringify(state), before);
});

test("PEA context is exposed as non-shockable without allowing an NPC to prescribe", () => {
  const turn = buildClinicalAwareNPCResponse(fixture(), {
    npcActorId: "mother",
    clinicalSnapshot: {
      responsive: false,
      breathingNormally: false,
      pulsePresent: false,
      rhythm: "pea",
      learnerScope: "BLS"
    }
  });
  assert.equal(turn.clinicalPractice.npcSafeFacts.nonShockableRhythmPathway, true);
  assert.equal(turn.rightsConstraints.npcCanPrescribeTreatment, false);
  assert.match(turn.generationInstruction, /advanced actions remain clinician-led/i);
});
