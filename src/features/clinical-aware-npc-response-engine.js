import { buildDynamicNPCResponse } from "./dynamic-npc-response-engine.js";
import {
  buildClinicalSceneMonitor,
  deriveClinicalPracticeContext
} from "./clinical-practice-algorithm-engine.js";

/**
 * Join the read-only clinical-practice layer to the read-only NPC renderer.
 *
 * Clinical algorithms may change what NPCs can plausibly observe or ask about, but dialogue
 * does not mutate physiology, commit an emergency event, prescribe treatment, or change rights.
 */
export function buildClinicalAwareNPCResponse(relationalState, {
  npcActorId,
  targetActorId = relationalState.patientId,
  studentAction = "",
  turnIndex = 0,
  syntheticFamilyEnvelope = null,
  clinicalSnapshot = {}
} = {}) {
  const clinicalPractice = deriveClinicalPracticeContext(clinicalSnapshot);
  const npcTurn = buildDynamicNPCResponse(relationalState, {
    npcActorId,
    targetActorId,
    studentAction,
    turnIndex,
    envelope: syntheticFamilyEnvelope
  });

  return {
    ...npcTurn,
    clinicalPractice: {
      activePathways: [...clinicalPractice.activePathways],
      monitor: buildClinicalSceneMonitor(clinicalPractice),
      npcSafeFacts: { ...clinicalPractice.npcSafeFacts },
      alerts: [...clinicalPractice.alerts],
      sourceIds: clinicalPractice.sources.map((item) => item.id)
    },
    generationInstruction: [
      "Render dialogue consistent with the clinical-practice facts supplied in clinicalPractice.npcSafeFacts.",
      "Do not invent an arrest, ROSC, sepsis diagnosis, tracheostomy emergency, prognosis or treatment response that is not present in the authored clinical snapshot.",
      "Family NPCs may ask what is known, what remains uncertain, what staff are monitoring and what happens next.",
      "Clinician NPCs may describe current pathway status in plain language, but advanced actions remain clinician-led and local procedure/guideline controls execution.",
      "Dialogue cannot change clinical or relational state. Moderator/controller events remain authoritative."
    ].join(" "),
    rightsConstraints: {
      ...npcTurn.rightsConstraints,
      clinicalAlgorithmCreatesCapacityFinding: false,
      disabilityCreatesEmergencyThreshold: false,
      npcCanCommitClinicalEvent: false,
      npcCanPrescribeTreatment: false
    }
  };
}
