export const BIOSOCIAL_RELATIONAL_SUBSTRATE_VERSION = "0.1.0";

const EPSILON = 1e-9;

export const RIGHTS_INVARIANTS = Object.freeze({
  communicationFailureDoesNotEqualIncapacity: true,
  familyPresenceDoesNotEqualSubstituteAuthority: true,
  relationalStressDoesNotEqualTreatmentFutility: true,
  disabilityDoesNotDetermineRelationalBaseline: true,
  freeTextRoleplayCannotMutateDeterministicState: true
});

export const RELATIONAL_EVENT_TYPES = Object.freeze([
  "RESPIRATORY_DETERIORATION",
  "ICU_TRANSFER",
  "CARDIAC_ARREST",
  "ROSC",
  "AAC_ACCESS_DISRUPTED",
  "AAC_ACCESS_RESTORED",
  "PRIVATE_CONVERSATION_REQUEST",
  "FAMILY_DISAGREEMENT",
  "BOUNDARY_RESPECTED",
  "BOUNDARY_OVERRIDE_ATTEMPT",
  "PATIENT_VOICE_ACKNOWLEDGED",
  "REPAIR_CONVERSATION",
  "SUPPORT_OFFERED",
  "INFORMATION_CLARIFIED"
]);

const DEFAULT_PARAMETERS = Object.freeze({
  stressRecoveryRatePerSecond: 0.018,
  socialStressContagionPerSecond: 0.007,
  threatGainPerSecond: 0.025,
  uncertaintyGainPerSecond: 0.010,
  supportBufferPerSecond: 0.015,
  communicationReliefPerSecond: 0.006,
  controlImpulseGainPerSecond: 0.012,
  controlImpulseRecoveryPerSecond: 0.015,
  trustRepairPerSecond: 0.010,
  trustErosionPerSecond: 0.018,
  conflictGainPerSecond: 0.016,
  conflictRecoveryPerSecond: 0.010,
  autonomyAlignmentRepairPerSecond: 0.012,
  autonomyAlignmentErosionPerSecond: 0.020,
  communicationReliabilityRepairPerSecond: 0.018,
  communicationReliabilityErosionPerSecond: 0.022,
  roleClarityRepairPerSecond: 0.008,
  roleClarityErosionPerSecond: 0.010
});

function clamp01(value) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function finitePositive(value, field) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${field} must be a finite number greater than zero.`);
  }
  return value;
}

function unique(items) {
  return [...new Set(items)];
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeActor(actor) {
  if (!actor?.id || typeof actor.id !== "string") {
    throw new TypeError("Every relational actor requires a string id.");
  }
  return {
    id: actor.id,
    label: actor.label ?? actor.id,
    role: actor.role ?? "support-network-member",
    kind: actor.kind ?? "supporter",
    stress: clamp01(actor.stress ?? 0.2),
    copingReserve: clamp01(actor.copingReserve ?? 0.6),
    perceivedThreat: clamp01(actor.perceivedThreat ?? 0),
    informationNeed: clamp01(actor.informationNeed ?? 0.5),
    controlImpulse: clamp01(actor.controlImpulse ?? 0.2),
    emotionalAvailability: clamp01(actor.emotionalAvailability ?? 0.7),
    directCommunicationSkill: clamp01(actor.directCommunicationSkill ?? 0.7),
    roleClarity: clamp01(actor.roleClarity ?? 0.8),
    supportCapacity: clamp01(actor.supportCapacity ?? 0.7),
    threatSensitivity: clamp01(actor.threatSensitivity ?? 0.7),
    notes: Array.isArray(actor.notes) ? [...actor.notes] : []
  };
}

function normalizeRelationship(rel, actorIds) {
  if (!rel?.from || !rel?.to) {
    throw new TypeError("Every relationship requires from and to actor ids.");
  }
  if (!actorIds.has(rel.from) || !actorIds.has(rel.to)) {
    throw new RangeError(`Relationship ${rel.from}->${rel.to} references an unknown actor.`);
  }
  if (rel.from === rel.to) {
    throw new RangeError("Self relationships are not supported in the relational substrate.");
  }
  const id = rel.id ?? `${rel.from}->${rel.to}`;
  return {
    id,
    from: rel.from,
    to: rel.to,
    type: rel.type ?? "support",
    influenceWeight: clamp01(rel.influenceWeight ?? 0.5),
    closeness: clamp01(rel.closeness ?? 0.5),
    trust: clamp01(rel.trust ?? 0.6),
    conflict: clamp01(rel.conflict ?? 0.1),
    autonomyAlignment: clamp01(rel.autonomyAlignment ?? 0.8),
    communicationReliability: clamp01(rel.communicationReliability ?? 0.8),
    boundaryRespect: clamp01(rel.boundaryRespect ?? 0.8),
    supportAvailability: clamp01(rel.supportAvailability ?? 0.7),
    baseline: {
      trust: clamp01(rel.trust ?? 0.6),
      conflict: clamp01(rel.conflict ?? 0.1),
      autonomyAlignment: clamp01(rel.autonomyAlignment ?? 0.8),
      communicationReliability: clamp01(rel.communicationReliability ?? 0.8),
      boundaryRespect: clamp01(rel.boundaryRespect ?? 0.8),
      supportAvailability: clamp01(rel.supportAvailability ?? 0.7)
    }
  };
}

function defaultRightsContext(patientId) {
  return {
    patientDecisionMakerId: patientId,
    verifiedSubstituteDecisionMakerId: null,
    emergencyBasisActive: false,
    source: "external-rights-gate",
    capacityStatus: "not-evaluated-by-relational-substrate"
  };
}

export function validateRelationalDefinition({ actors, relationships, patientId }) {
  if (!Array.isArray(actors) || actors.length < 1) {
    throw new TypeError("actors must contain at least one actor.");
  }
  const ids = actors.map((actor) => actor?.id);
  if (ids.some((id) => !id || typeof id !== "string")) {
    throw new TypeError("Every actor must have a non-empty string id.");
  }
  if (unique(ids).length !== ids.length) {
    throw new RangeError("Actor ids must be unique.");
  }
  if (!ids.includes(patientId)) {
    throw new RangeError("patientId must identify an actor in the relational network.");
  }
  if (!Array.isArray(relationships)) {
    throw new TypeError("relationships must be an array.");
  }
  return true;
}

export function createRelationalSubstrate({
  actors,
  relationships = [],
  patientId,
  rightsContext = {},
  parameters = {},
  access = {}
}) {
  validateRelationalDefinition({ actors, relationships, patientId });
  const normalizedActors = actors.map(normalizeActor);
  const actorIds = new Set(normalizedActors.map((actor) => actor.id));
  const normalizedRelationships = relationships.map((rel) => normalizeRelationship(rel, actorIds));

  const explicitRights = {
    ...defaultRightsContext(patientId),
    ...rightsContext,
    patientDecisionMakerId: rightsContext.patientDecisionMakerId ?? patientId,
    capacityStatus: "not-evaluated-by-relational-substrate"
  };

  return {
    modelVersion: BIOSOCIAL_RELATIONAL_SUBSTRATE_VERSION,
    timeSeconds: 0,
    patientId,
    actors: Object.fromEntries(normalizedActors.map((actor) => [actor.id, actor])),
    relationships: Object.fromEntries(normalizedRelationships.map((rel) => [rel.id, rel])),
    rightsContext: explicitRights,
    access: {
      communicationAccessReliability: clamp01(access.communicationAccessReliability ?? 1),
      privacyReliability: clamp01(access.privacyReliability ?? 1),
      directPatientVoiceAvailable: Boolean(access.directPatientVoiceAvailable ?? true)
    },
    environment: {
      clinicalThreat: 0,
      uncertainty: 0,
      staffContinuity: 1,
      familyPresence: {}
    },
    parameters: { ...DEFAULT_PARAMETERS, ...parameters },
    transient: {
      actorStimuli: {},
      relationshipStimuli: {}
    },
    events: [],
    audit: [
      {
        seconds: 0,
        type: "RELATIONAL_SUBSTRATE_CREATED",
        detail: {
          patientId,
          rightsInvariants: RIGHTS_INVARIANTS
        }
      }
    ]
  };
}

function incomingRelationships(state, actorId) {
  return Object.values(state.relationships).filter((rel) => rel.to === actorId);
}

function outgoingRelationships(state, actorId) {
  return Object.values(state.relationships).filter((rel) => rel.from === actorId);
}

function normalizedIncomingInfluence(state, actorId) {
  const incoming = incomingRelationships(state, actorId);
  const total = incoming.reduce((sum, rel) => sum + rel.influenceWeight, 0);
  if (total <= EPSILON) return [];
  return incoming.map((rel) => ({
    rel,
    weight: rel.influenceWeight / total
  }));
}

function receivedSupport(state, actorId) {
  const incoming = incomingRelationships(state, actorId);
  if (!incoming.length) return 0;
  const weighted = incoming.reduce((sum, rel) => {
    const source = state.actors[rel.from];
    return sum + rel.supportAvailability * source.supportCapacity * source.emotionalAvailability;
  }, 0);
  return clamp01(weighted / incoming.length);
}

function actorStimulus(state, actorId) {
  return state.transient.actorStimuli[actorId] ?? {};
}

function relationshipStimulus(state, relationshipId) {
  return state.transient.relationshipStimuli[relationshipId] ?? {};
}

function updateActor(state, actor, dtSeconds) {
  const p = state.parameters;
  const stimulus = actorStimulus(state, actor.id);
  const incoming = normalizedIncomingInfluence(state, actor.id);
  const socialStress = incoming.reduce(
    (sum, item) => sum + item.weight * state.actors[item.rel.from].stress,
    0
  );
  const support = clamp01(receivedSupport(state, actor.id) + (stimulus.supportBuffer ?? 0));
  const threat = clamp01(
    state.environment.clinicalThreat * actor.threatSensitivity + (stimulus.threat ?? 0)
  );
  const uncertainty = clamp01(state.environment.uncertainty + (stimulus.uncertainty ?? 0));
  const commAccess = state.access.communicationAccessReliability;
  const stressShock = stimulus.stressShock ?? 0;

  const stressDelta = dtSeconds * (
    p.threatGainPerSecond * threat +
    p.socialStressContagionPerSecond * socialStress +
    p.uncertaintyGainPerSecond * uncertainty * actor.informationNeed -
    p.stressRecoveryRatePerSecond * actor.copingReserve * actor.stress -
    p.supportBufferPerSecond * support -
    p.communicationReliefPerSecond * commAccess * actor.directCommunicationSkill
  ) + stressShock;

  const roleClarity = clamp01(actor.roleClarity + dtSeconds * (
    p.roleClarityRepairPerSecond * (stimulus.roleClarification ?? 0) -
    p.roleClarityErosionPerSecond * (stimulus.roleConfusion ?? 0)
  ));

  const controlTarget = clamp01(
    0.15 + 0.55 * actor.stress + 0.35 * threat + 0.25 * uncertainty - 0.45 * roleClarity
  );
  const controlImpulse = clamp01(actor.controlImpulse + dtSeconds * (
    p.controlImpulseGainPerSecond * Math.max(0, controlTarget - actor.controlImpulse) -
    p.controlImpulseRecoveryPerSecond * Math.max(0, actor.controlImpulse - controlTarget)
  ));

  return {
    ...actor,
    stress: clamp01(actor.stress + stressDelta),
    perceivedThreat: threat,
    controlImpulse,
    roleClarity
  };
}

function updateRelationship(state, rel, dtSeconds) {
  const p = state.parameters;
  const stimulus = relationshipStimulus(state, rel.id);
  const commAccess = state.access.communicationAccessReliability;
  const from = state.actors[rel.from];
  const to = state.actors[rel.to];

  const directVoiceExposure = clamp01(
    stimulus.directPatientVoice ?? (state.access.directPatientVoiceAvailable ? commAccess : 0)
  );
  const boundaryRespectSignal = clamp01(stimulus.boundaryRespect ?? 0);
  const boundaryViolationSignal = clamp01(stimulus.boundaryViolation ?? 0);
  const disagreement = clamp01(stimulus.disagreement ?? 0);
  const repair = clamp01(stimulus.repair ?? 0);
  const misinformation = clamp01(stimulus.misinformation ?? 0);
  const clarification = clamp01(stimulus.clarification ?? 0);

  const communicationTarget = clamp01(
    commAccess * (0.45 + 0.55 * from.directCommunicationSkill) *
      (1 - 0.4 * misinformation) + 0.25 * clarification
  );
  const communicationReliability = clamp01(rel.communicationReliability + dtSeconds * (
    p.communicationReliabilityRepairPerSecond * Math.max(0, communicationTarget - rel.communicationReliability) -
    p.communicationReliabilityErosionPerSecond * Math.max(0, rel.communicationReliability - communicationTarget)
  ));

  const trustDelta = dtSeconds * (
    p.trustRepairPerSecond * (
      repair +
      0.7 * boundaryRespectSignal +
      0.4 * directVoiceExposure * communicationReliability
    ) -
    p.trustErosionPerSecond * (
      boundaryViolationSignal +
      0.6 * disagreement +
      0.5 * misinformation +
      0.35 * (1 - communicationReliability)
    )
  );

  const conflictDelta = dtSeconds * (
    p.conflictGainPerSecond * (
      disagreement + boundaryViolationSignal +
      0.35 * state.environment.clinicalThreat * (1 - rel.autonomyAlignment)
    ) -
    p.conflictRecoveryPerSecond * (
      repair + boundaryRespectSignal + clarification
    )
  );

  const autonomyDelta = dtSeconds * (
    p.autonomyAlignmentRepairPerSecond * (
      repair + boundaryRespectSignal + directVoiceExposure
    ) -
    p.autonomyAlignmentErosionPerSecond * (
      boundaryViolationSignal + 0.5 * misinformation
    )
  );

  const boundaryRespect = clamp01(
    rel.boundaryRespect + dtSeconds * (0.03 * boundaryRespectSignal - 0.05 * boundaryViolationSignal)
  );

  const supportAvailability = clamp01(
    rel.supportAvailability + dtSeconds * (
      0.015 * (stimulus.supportOffered ?? 0) -
      0.012 * Math.max(0, from.stress - from.copingReserve) -
      0.010 * rel.conflict
    )
  );

  return {
    ...rel,
    trust: clamp01(rel.trust + trustDelta),
    conflict: clamp01(rel.conflict + conflictDelta),
    autonomyAlignment: clamp01(rel.autonomyAlignment + autonomyDelta),
    communicationReliability,
    boundaryRespect,
    supportAvailability,
    lastObservedTargetStress: to.stress
  };
}

function appendAudit(state, type, detail = {}) {
  return {
    ...state,
    audit: [
      ...state.audit,
      { seconds: state.timeSeconds, type, detail }
    ]
  };
}

export function stepRelationalSubstrate(state, inputs = {}, dtSeconds = 1) {
  finitePositive(dtSeconds, "dtSeconds");

  const nextEnvironment = {
    ...state.environment,
    clinicalThreat: clamp01(inputs.clinicalThreat ?? state.environment.clinicalThreat),
    uncertainty: clamp01(inputs.uncertainty ?? state.environment.uncertainty),
    staffContinuity: clamp01(inputs.staffContinuity ?? state.environment.staffContinuity),
    familyPresence: inputs.familyPresence
      ? { ...state.environment.familyPresence, ...inputs.familyPresence }
      : state.environment.familyPresence
  };
  const nextAccess = {
    ...state.access,
    communicationAccessReliability: clamp01(
      inputs.communicationAccessReliability ?? state.access.communicationAccessReliability
    ),
    privacyReliability: clamp01(inputs.privacyReliability ?? state.access.privacyReliability),
    directPatientVoiceAvailable:
      inputs.directPatientVoiceAvailable ?? state.access.directPatientVoiceAvailable
  };

  const transient = {
    actorStimuli: inputs.actorStimuli ?? state.transient.actorStimuli,
    relationshipStimuli: inputs.relationshipStimuli ?? state.transient.relationshipStimuli
  };

  const working = {
    ...state,
    environment: nextEnvironment,
    access: nextAccess,
    transient
  };

  const actors = Object.fromEntries(
    Object.values(working.actors).map((actor) => [actor.id, updateActor(working, actor, dtSeconds)])
  );
  const withActors = { ...working, actors };
  const relationships = Object.fromEntries(
    Object.values(withActors.relationships).map((rel) => [rel.id, updateRelationship(withActors, rel, dtSeconds)])
  );

  const next = {
    ...withActors,
    relationships,
    timeSeconds: state.timeSeconds + dtSeconds,
    transient: { actorStimuli: {}, relationshipStimuli: {} },
    rightsContext: { ...state.rightsContext, capacityStatus: "not-evaluated-by-relational-substrate" }
  };

  return appendAudit(next, "RELATIONAL_STEP", {
    dtSeconds,
    clinicalThreat: next.environment.clinicalThreat,
    uncertainty: next.environment.uncertainty,
    communicationAccessReliability: next.access.communicationAccessReliability
  });
}

function mergeActorStimulus(target, actorId, patch) {
  target[actorId] = { ...(target[actorId] ?? {}), ...patch };
}

function mergeRelationshipStimulus(target, relationshipId, patch) {
  target[relationshipId] = { ...(target[relationshipId] ?? {}), ...patch };
}

function relationshipsBetween(state, a, b) {
  return Object.values(state.relationships).filter(
    (rel) => (rel.from === a && rel.to === b) || (rel.from === b && rel.to === a)
  );
}

export function applyRelationalEvent(state, event) {
  if (!event?.type || !RELATIONAL_EVENT_TYPES.includes(event.type)) {
    throw new RangeError(`Unsupported relational event: ${event?.type ?? "<missing>"}`);
  }

  let clinicalThreat = state.environment.clinicalThreat;
  let uncertainty = state.environment.uncertainty;
  let access = { ...state.access };
  const actorStimuli = {};
  const relationshipStimuli = {};
  const patientId = state.patientId;
  const supporterId = event.supporterId ?? null;

  switch (event.type) {
    case "RESPIRATORY_DETERIORATION":
      clinicalThreat = Math.max(clinicalThreat, clamp01(event.severity ?? 0.65));
      uncertainty = Math.max(uncertainty, clamp01(event.uncertainty ?? 0.45));
      for (const actor of Object.values(state.actors)) {
        mergeActorStimulus(actorStimuli, actor.id, { stressShock: 0.04 * actor.threatSensitivity });
      }
      break;

    case "ICU_TRANSFER":
      clinicalThreat = Math.max(clinicalThreat, clamp01(event.severity ?? 0.55));
      uncertainty = Math.max(uncertainty, clamp01(event.uncertainty ?? 0.50));
      for (const actor of Object.values(state.actors)) {
        mergeActorStimulus(actorStimuli, actor.id, { stressShock: 0.03 * actor.threatSensitivity });
      }
      break;

    case "CARDIAC_ARREST":
      clinicalThreat = 1;
      uncertainty = 1;
      for (const actor of Object.values(state.actors)) {
        mergeActorStimulus(actorStimuli, actor.id, { stressShock: 0.12 * actor.threatSensitivity });
      }
      break;

    case "ROSC":
      clinicalThreat = Math.max(0.65, clamp01(event.clinicalThreat ?? 0.78));
      uncertainty = Math.max(0.65, clamp01(event.uncertainty ?? 0.82));
      break;

    case "AAC_ACCESS_DISRUPTED":
      access.communicationAccessReliability = clamp01(event.reliability ?? 0.25);
      access.directPatientVoiceAvailable = Boolean(event.directPatientVoiceAvailable ?? false);
      uncertainty = Math.max(uncertainty, 0.65);
      break;

    case "AAC_ACCESS_RESTORED":
      access.communicationAccessReliability = clamp01(event.reliability ?? 0.95);
      access.directPatientVoiceAvailable = Boolean(event.directPatientVoiceAvailable ?? true);
      for (const rel of Object.values(state.relationships)) {
        mergeRelationshipStimulus(relationshipStimuli, rel.id, {
          clarification: 1,
          directPatientVoice: rel.from === patientId || rel.to === patientId ? 1 : 0.5
        });
      }
      break;

    case "PRIVATE_CONVERSATION_REQUEST": {
      if (!supporterId) throw new TypeError("PRIVATE_CONVERSATION_REQUEST requires supporterId.");
      const respected = event.respected !== false;
      for (const rel of relationshipsBetween(state, patientId, supporterId)) {
        mergeRelationshipStimulus(
          relationshipStimuli,
          rel.id,
          respected
            ? { boundaryRespect: 1, directPatientVoice: 1, repair: 0.35 }
            : { boundaryViolation: 1, disagreement: 0.6 }
        );
      }
      mergeActorStimulus(actorStimuli, supporterId, respected
        ? { roleClarification: 1 }
        : { roleConfusion: 1, stressShock: 0.04 });
      break;
    }

    case "FAMILY_DISAGREEMENT": {
      const actorA = event.actorA;
      const actorB = event.actorB;
      if (!actorA || !actorB) throw new TypeError("FAMILY_DISAGREEMENT requires actorA and actorB.");
      for (const rel of relationshipsBetween(state, actorA, actorB)) {
        mergeRelationshipStimulus(relationshipStimuli, rel.id, {
          disagreement: clamp01(event.intensity ?? 0.7)
        });
      }
      break;
    }

    case "BOUNDARY_RESPECTED": {
      const actorA = event.actorA ?? supporterId;
      const actorB = event.actorB ?? patientId;
      if (!actorA || !actorB) throw new TypeError("BOUNDARY_RESPECTED requires an actor pair.");
      for (const rel of relationshipsBetween(state, actorA, actorB)) {
        mergeRelationshipStimulus(relationshipStimuli, rel.id, {
          boundaryRespect: 1,
          directPatientVoice: 1,
          repair: clamp01(event.repair ?? 0.5)
        });
      }
      break;
    }

    case "BOUNDARY_OVERRIDE_ATTEMPT": {
      const actorA = event.actorA ?? supporterId;
      const actorB = event.actorB ?? patientId;
      if (!actorA || !actorB) throw new TypeError("BOUNDARY_OVERRIDE_ATTEMPT requires an actor pair.");
      for (const rel of relationshipsBetween(state, actorA, actorB)) {
        mergeRelationshipStimulus(relationshipStimuli, rel.id, {
          boundaryViolation: 1,
          disagreement: clamp01(event.intensity ?? 0.8)
        });
      }
      break;
    }

    case "PATIENT_VOICE_ACKNOWLEDGED":
      for (const rel of Object.values(state.relationships)) {
        if (rel.from === patientId || rel.to === patientId) {
          mergeRelationshipStimulus(relationshipStimuli, rel.id, {
            directPatientVoice: 1,
            boundaryRespect: 0.6,
            clarification: 0.7
          });
        }
      }
      break;

    case "REPAIR_CONVERSATION": {
      const actorA = event.actorA;
      const actorB = event.actorB;
      if (!actorA || !actorB) throw new TypeError("REPAIR_CONVERSATION requires actorA and actorB.");
      for (const rel of relationshipsBetween(state, actorA, actorB)) {
        mergeRelationshipStimulus(relationshipStimuli, rel.id, {
          repair: clamp01(event.strength ?? 0.8),
          boundaryRespect: 0.7,
          clarification: 0.8
        });
      }
      break;
    }

    case "SUPPORT_OFFERED": {
      if (!event.from || !event.to) throw new TypeError("SUPPORT_OFFERED requires from and to.");
      for (const rel of relationshipsBetween(state, event.from, event.to)) {
        if (rel.from === event.from && rel.to === event.to) {
          mergeRelationshipStimulus(relationshipStimuli, rel.id, { supportOffered: 1 });
        }
      }
      mergeActorStimulus(actorStimuli, event.to, { supportBuffer: clamp01(event.strength ?? 0.5) });
      break;
    }

    case "INFORMATION_CLARIFIED":
      uncertainty = clamp01(state.environment.uncertainty - clamp01(event.amount ?? 0.35));
      for (const rel of Object.values(state.relationships)) {
        mergeRelationshipStimulus(relationshipStimuli, rel.id, { clarification: 1 });
      }
      break;

    default:
      break;
  }

  const next = {
    ...state,
    environment: { ...state.environment, clinicalThreat, uncertainty },
    access,
    transient: { actorStimuli, relationshipStimuli },
    events: [
      ...state.events,
      {
        id: `${state.events.length + 1}-${event.type}`,
        seconds: state.timeSeconds,
        type: event.type,
        detail: { ...event }
      }
    ],
    rightsContext: { ...state.rightsContext, capacityStatus: "not-evaluated-by-relational-substrate" }
  };

  return appendAudit(next, "RELATIONAL_EVENT_APPLIED", {
    type: event.type,
    supporterId,
    rightsContextUnchanged: true
  });
}

export function adaptRespiratorySimulationSignal(signal = {}) {
  return {
    clinicalThreat: clamp01(signal.clinicalThreat ?? 0),
    uncertainty: clamp01(signal.uncertainty ?? 0),
    communicationAccessReliability: clamp01(signal.communicationAccessReliability ?? 1),
    directPatientVoiceAvailable: Boolean(signal.directPatientVoiceAvailable ?? true),
    provenance: {
      source: "accessible-respiratory-simulation-adapter",
      excludes: [
        "disability severity as physiology",
        "AAC use as capacity",
        "wheelchair use as frailty",
        "family presence as legal authority"
      ]
    }
  };
}

export function deriveRoleplayContext(state, actorId, targetId = state.patientId) {
  const actor = state.actors[actorId];
  const target = state.actors[targetId];
  if (!actor || !target) throw new RangeError("deriveRoleplayContext requires valid actor ids.");

  const relations = relationshipsBetween(state, actorId, targetId);
  const relation = relations.find((rel) => rel.from === actorId && rel.to === targetId) ?? relations[0] ?? null;

  return {
    actor: {
      id: actor.id,
      label: actor.label,
      role: actor.role,
      stress: actor.stress,
      perceivedThreat: actor.perceivedThreat,
      informationNeed: actor.informationNeed,
      controlImpulse: actor.controlImpulse,
      roleClarity: actor.roleClarity
    },
    target: {
      id: target.id,
      label: target.label,
      role: target.role
    },
    relationship: relation
      ? {
          trust: relation.trust,
          conflict: relation.conflict,
          autonomyAlignment: relation.autonomyAlignment,
          communicationReliability: relation.communicationReliability,
          boundaryRespect: relation.boundaryRespect,
          supportAvailability: relation.supportAvailability
        }
      : null,
    environment: {
      clinicalThreat: state.environment.clinicalThreat,
      uncertainty: state.environment.uncertainty,
      communicationAccessReliability: state.access.communicationAccessReliability,
      directPatientVoiceAvailable: state.access.directPatientVoiceAvailable
    },
    rightsConstraints: {
      patientDecisionMakerId: state.rightsContext.patientDecisionMakerId,
      verifiedSubstituteDecisionMakerId: state.rightsContext.verifiedSubstituteDecisionMakerId,
      capacityStatus: "do-not-infer-from-roleplay-or-relational-state",
      familyPresenceDoesNotCreateAuthority: true,
      communicationDifficultyDoesNotCreateIncapacity: true
    },
    instruction: "Render plausible dialogue only. Do not mutate deterministic relational state from free text. Commit state changes only through explicit authored relational events."
  };
}

export function summarizeRelationalState(state) {
  const actors = Object.values(state.actors).map((actor) => ({
    id: actor.id,
    stress: actor.stress,
    perceivedThreat: actor.perceivedThreat,
    controlImpulse: actor.controlImpulse,
    roleClarity: actor.roleClarity
  }));
  const relationships = Object.values(state.relationships).map((rel) => ({
    id: rel.id,
    from: rel.from,
    to: rel.to,
    trust: rel.trust,
    conflict: rel.conflict,
    autonomyAlignment: rel.autonomyAlignment,
    communicationReliability: rel.communicationReliability,
    boundaryRespect: rel.boundaryRespect,
    supportAvailability: rel.supportAvailability
  }));

  return {
    modelVersion: state.modelVersion,
    timeSeconds: state.timeSeconds,
    patientId: state.patientId,
    actors,
    relationships,
    environment: deepClone(state.environment),
    access: deepClone(state.access),
    rightsContext: deepClone(state.rightsContext),
    rightsInvariants: RIGHTS_INVARIANTS
  };
}
