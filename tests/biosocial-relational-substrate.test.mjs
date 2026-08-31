import test from "node:test";
import assert from "node:assert/strict";

import {
  RIGHTS_INVARIANTS,
  adaptRespiratorySimulationSignal,
  applyRelationalEvent,
  createRelationalSubstrate,
  deriveRoleplayContext,
  stepRelationalSubstrate,
  summarizeRelationalState
} from "../src/features/biosocial-relational-substrate.js";

function fixture() {
  return createRelationalSubstrate({
    patientId: "maya",
    actors: [
      {
        id: "maya",
        label: "Maya",
        role: "patient",
        kind: "patient",
        stress: 0.35,
        copingReserve: 0.55,
        threatSensitivity: 0.75,
        directCommunicationSkill: 1,
        roleClarity: 1,
        supportCapacity: 0.45
      },
      {
        id: "mother",
        label: "Maya's mother",
        role: "trusted family supporter",
        kind: "family",
        stress: 0.55,
        copingReserve: 0.5,
        threatSensitivity: 0.9,
        informationNeed: 0.8,
        roleClarity: 0.7,
        supportCapacity: 0.85
      },
      {
        id: "aisha",
        label: "Aisha",
        role: "long-term friend",
        kind: "friend",
        stress: 0.25,
        copingReserve: 0.75,
        threatSensitivity: 0.55,
        roleClarity: 0.9,
        supportCapacity: 0.8
      },
      {
        id: "nurse",
        label: "Priya",
        role: "ICU nurse",
        kind: "clinician",
        stress: 0.3,
        copingReserve: 0.8,
        threatSensitivity: 0.7,
        roleClarity: 0.95,
        supportCapacity: 0.75
      }
    ],
    relationships: [
      {
        from: "mother",
        to: "maya",
        influenceWeight: 0.8,
        trust: 0.62,
        conflict: 0.12,
        autonomyAlignment: 0.68,
        communicationReliability: 0.82,
        boundaryRespect: 0.75,
        supportAvailability: 0.9
      },
      {
        from: "maya",
        to: "mother",
        influenceWeight: 0.9,
        trust: 0.68,
        conflict: 0.12,
        autonomyAlignment: 0.78,
        communicationReliability: 0.88,
        boundaryRespect: 0.85,
        supportAvailability: 0.7
      },
      {
        from: "aisha",
        to: "maya",
        influenceWeight: 0.5,
        trust: 0.9,
        conflict: 0.05,
        autonomyAlignment: 0.95,
        communicationReliability: 0.9,
        boundaryRespect: 0.95,
        supportAvailability: 0.8
      },
      {
        from: "nurse",
        to: "maya",
        influenceWeight: 0.5,
        trust: 0.72,
        conflict: 0.02,
        autonomyAlignment: 0.95,
        communicationReliability: 0.9,
        boundaryRespect: 0.95,
        supportAvailability: 0.85
      },
      {
        from: "nurse",
        to: "mother",
        influenceWeight: 0.5,
        trust: 0.7,
        conflict: 0.05,
        autonomyAlignment: 0.9,
        communicationReliability: 0.9,
        boundaryRespect: 0.9,
        supportAvailability: 0.7
      }
    ],
    access: {
      communicationAccessReliability: 0.95,
      privacyReliability: 0.95,
      directPatientVoiceAvailable: true
    }
  });
}

test("patient remains the decision maker by default and capacity is outside the relational model", () => {
  const state = fixture();
  assert.equal(state.rightsContext.patientDecisionMakerId, "maya");
  assert.equal(state.rightsContext.verifiedSubstituteDecisionMakerId, null);
  assert.equal(state.rightsContext.capacityStatus, "not-evaluated-by-relational-substrate");
  assert.equal(RIGHTS_INVARIANTS.familyPresenceDoesNotEqualSubstituteAuthority, true);
});

test("acute respiratory deterioration raises threat/stress without changing rights authority", () => {
  let state = fixture();
  const beforeStress = state.actors.mother.stress;
  const beforeRights = structuredClone(state.rightsContext);
  state = applyRelationalEvent(state, { type: "RESPIRATORY_DETERIORATION", severity: 0.8 });
  state = stepRelationalSubstrate(state, {}, 1);
  assert.ok(state.actors.mother.stress > beforeStress);
  assert.deepEqual(state.rightsContext, beforeRights);
});

test("cardiac arrest produces a strong biosocial threat signal but not a treatment ceiling", () => {
  let state = fixture();
  state = applyRelationalEvent(state, { type: "CARDIAC_ARREST" });
  state = stepRelationalSubstrate(state, {}, 1);
  assert.equal(state.environment.clinicalThreat, 1);
  assert.equal(state.environment.uncertainty, 1);
  assert.equal(state.rightsContext.patientDecisionMakerId, "maya");
  assert.equal("treatmentCeiling" in state, false);
});

test("AAC disruption changes information reliability but never creates incapacity", () => {
  let state = fixture();
  state = applyRelationalEvent(state, {
    type: "AAC_ACCESS_DISRUPTED",
    reliability: 0.2,
    directPatientVoiceAvailable: false
  });
  state = stepRelationalSubstrate(state, {}, 1);
  assert.equal(state.access.communicationAccessReliability, 0.2);
  assert.equal(state.access.directPatientVoiceAvailable, false);
  assert.equal(state.rightsContext.capacityStatus, "not-evaluated-by-relational-substrate");
  assert.equal(RIGHTS_INVARIANTS.communicationFailureDoesNotEqualIncapacity, true);
});

test("respecting a private conversation request improves autonomy alignment and does not make family a substitute", () => {
  let state = fixture();
  const relId = "mother->maya";
  const before = state.relationships[relId];
  state = applyRelationalEvent(state, {
    type: "PRIVATE_CONVERSATION_REQUEST",
    supporterId: "mother",
    respected: true
  });
  for (let i = 0; i < 10; i += 1) state = stepRelationalSubstrate(state, {}, 1);
  const after = state.relationships[relId];
  assert.ok(after.trust > before.trust);
  assert.ok(after.autonomyAlignment > before.autonomyAlignment);
  assert.ok(after.boundaryRespect > before.boundaryRespect);
  assert.equal(state.rightsContext.verifiedSubstituteDecisionMakerId, null);
});

test("attempting to override a boundary raises conflict and erodes trust but remains repairable", () => {
  let state = fixture();
  const relId = "mother->maya";
  const initial = { ...state.relationships[relId] };
  state = applyRelationalEvent(state, {
    type: "BOUNDARY_OVERRIDE_ATTEMPT",
    actorA: "mother",
    actorB: "maya",
    intensity: 0.9
  });
  for (let i = 0; i < 8; i += 1) state = stepRelationalSubstrate(state, {}, 1);
  assert.ok(state.relationships[relId].conflict > initial.conflict);
  assert.ok(state.relationships[relId].trust < initial.trust);

  const afterRupture = { ...state.relationships[relId] };
  state = applyRelationalEvent(state, {
    type: "REPAIR_CONVERSATION",
    actorA: "mother",
    actorB: "maya",
    strength: 1
  });
  for (let i = 0; i < 20; i += 1) state = stepRelationalSubstrate(state, {}, 1);
  assert.ok(state.relationships[relId].trust > afterRupture.trust);
  assert.ok(state.relationships[relId].conflict < afterRupture.conflict);
});

test("all dynamic actor and edge variables stay inside zero-to-one bounds", () => {
  let state = fixture();
  state = applyRelationalEvent(state, { type: "CARDIAC_ARREST" });
  for (let i = 0; i < 300; i += 1) {
    state = stepRelationalSubstrate(state, {
      clinicalThreat: i < 50 ? 1 : 0.25,
      uncertainty: i < 75 ? 1 : 0.2,
      communicationAccessReliability: i < 25 ? 0.2 : 0.95
    }, 0.5);
  }

  for (const actor of Object.values(state.actors)) {
    for (const field of ["stress", "copingReserve", "perceivedThreat", "informationNeed", "controlImpulse", "emotionalAvailability", "directCommunicationSkill", "roleClarity", "supportCapacity", "threatSensitivity"]) {
      assert.ok(actor[field] >= 0 && actor[field] <= 1, `${actor.id}.${field} out of bounds`);
    }
  }
  for (const rel of Object.values(state.relationships)) {
    for (const field of ["influenceWeight", "closeness", "trust", "conflict", "autonomyAlignment", "communicationReliability", "boundaryRespect", "supportAvailability"]) {
      assert.ok(rel[field] >= 0 && rel[field] <= 1, `${rel.id}.${field} out of bounds`);
    }
  }
});

test("respiratory adapter excludes disability severity and family authority inference", () => {
  const signal = adaptRespiratorySimulationSignal({
    clinicalThreat: 0.85,
    uncertainty: 0.7,
    communicationAccessReliability: 0.5,
    directPatientVoiceAvailable: true,
    cerebralPalsySeverity: 0.99,
    wheelchairUse: true
  });
  assert.equal(signal.clinicalThreat, 0.85);
  assert.equal(signal.uncertainty, 0.7);
  assert.equal("cerebralPalsySeverity" in signal, false);
  assert.equal("wheelchairUse" in signal, false);
  assert.ok(signal.provenance.excludes.some((item) => /family presence/i.test(item)));
});

test("roleplay context is read-only guidance and cannot infer capacity or legal authority", () => {
  const state = fixture();
  const before = summarizeRelationalState(state);
  const context = deriveRoleplayContext(state, "mother", "maya");
  const after = summarizeRelationalState(state);
  assert.deepEqual(after, before);
  assert.equal(context.rightsConstraints.patientDecisionMakerId, "maya");
  assert.equal(context.rightsConstraints.verifiedSubstituteDecisionMakerId, null);
  assert.match(context.rightsConstraints.capacityStatus, /do-not-infer/i);
  assert.match(context.instruction, /Do not mutate deterministic relational state/i);
});
