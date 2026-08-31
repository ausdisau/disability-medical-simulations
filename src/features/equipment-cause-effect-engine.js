export const EQUIPMENT_CAUSE_EFFECT_VERSION = "0.1.0";

/**
 * Evidence-gated equipment cause/effect layer for Project Hope.
 *
 * The state values below are synthetic simulation variables in [0,1]. They are
 * deliberately not physiological measurements, risk scores, or patient-specific
 * treatment predictions. Equipment availability never creates an indication.
 */

export const EQUIPMENT_STATION_STATES = Object.freeze([
  "available",
  "selected",
  "checked",
  "assigned",
  "committed"
]);

export const BODY_STATE_KEYS = Object.freeze([
  "oxygenationReserve",
  "ventilationReserve",
  "airwayPatency",
  "secretionBurden",
  "workOfBreathing",
  "hemodynamicReserve",
  "postureSupport",
  "aacAccess",
  "signalReliability"
]);

export const EQUIPMENT_IDS = Object.freeze({
  OXYGEN: "OXYGEN_DELIVERY",
  SUCTION: "SUCTION",
  MANUAL_VENTILATION: "MANUAL_VENTILATION",
  REPOSITION: "REPOSITION_SUPPORT",
  DEFIBRILLATOR: "DEFIBRILLATOR",
  AAC_RESTORE: "AAC_RESTORE"
});

export const EQUIPMENT_DEFINITIONS = Object.freeze({
  OXYGEN_DELIVERY: {
    label: "Oxygen delivery",
    evidenceGate: "oxygenIndicated",
    authorisedWorkstream: "AIRWAY_BREATHING",
    primaryDomains: ["oxygenationReserve"],
    explicitNonEffects: ["ventilationReserve", "capacity", "legalAuthority"],
    reassess: ["oxygenation", "ventilation", "workOfBreathing"],
    sourceBoundary: "ANZCOR/local oxygen protocol controls clinical execution"
  },
  SUCTION: {
    label: "Airway suction",
    evidenceGate: "secretionsEvidence",
    authorisedWorkstream: "AIRWAY_TRAINED_CLINICIAN",
    primaryDomains: ["airwayPatency", "secretionBurden"],
    explicitNonEffects: ["capacity", "legalAuthority"],
    reassess: ["airwayPatency", "secretions", "ventilation", "oxygenation"],
    sourceBoundary: "current local tracheostomy/airway protocol controls technique"
  },
  MANUAL_VENTILATION: {
    label: "Manual ventilation support",
    evidenceGate: "ventilationFailure",
    authorisedWorkstream: "AIRWAY_TRAINED_CLINICIAN",
    primaryDomains: ["ventilationReserve", "workOfBreathing"],
    explicitNonEffects: ["capacity", "legalAuthority"],
    reassess: ["chestMovement", "ventilation", "oxygenation", "capnography"],
    sourceBoundary: "advanced airway/ventilation actions remain clinician-led"
  },
  REPOSITION_SUPPORT: {
    label: "Positioning / postural support",
    evidenceGate: "positioningCompatible",
    authorisedWorkstream: "BEDSIDE_TEAM",
    primaryDomains: ["postureSupport", "workOfBreathing", "aacAccess"],
    explicitNonEffects: ["fixedSpO2Gain", "capacity", "legalAuthority"],
    reassess: ["comfort", "chestMovement", "workOfBreathing", "aacAccess"],
    sourceBoundary: "effect is qualitative and patient-specific; no universal oxygen gain is assumed"
  },
  DEFIBRILLATOR: {
    label: "Defibrillator",
    evidenceGate: "shockableArrest",
    authorisedWorkstream: "ALS_TEAM",
    primaryDomains: [],
    explicitNonEffects: ["automaticROSC", "capacity", "legalAuthority"],
    reassess: ["rhythm", "pulse", "CPRPathway"],
    sourceBoundary: "ANZCOR ALS shockable-rhythm pathway controls use; no deterministic ROSC effect"
  },
  AAC_RESTORE: {
    label: "Restore AAC access",
    evidenceGate: "aacAccessImpaired",
    authorisedWorkstream: "ANY_BEDSIDE_TEAM_MEMBER",
    primaryDomains: ["aacAccess"],
    explicitNonEffects: ["cognition", "capacity", "legalAuthority"],
    reassess: ["eyeGazeAccess", "messageAccuracy", "responseTime"],
    sourceBoundary: "communication access is a safety function, not a capacity test"
  }
});

function clamp01(value) {
  const number = Number.isFinite(value) ? Number(value) : 0;
  return Math.min(1, Math.max(0, number));
}

function copyState(state = {}) {
  return Object.fromEntries(
    BODY_STATE_KEYS.map((key) => [key, clamp01(state[key] ?? defaultBodyState()[key])])
  );
}

export function defaultBodyState() {
  return {
    oxygenationReserve: 0.46,
    ventilationReserve: 0.34,
    airwayPatency: 0.90,
    secretionBurden: 0.35,
    workOfBreathing: 0.78,
    hemodynamicReserve: 0.42,
    postureSupport: 0.60,
    aacAccess: 0.92,
    signalReliability: 0.88
  };
}

export function defaultEvidenceGates() {
  return {
    oxygenIndicated: false,
    secretionsEvidence: false,
    ventilationFailure: false,
    shockableArrest: false,
    positioningCompatible: true,
    aacAccessImpaired: false
  };
}

export function createEquipmentStation(equipmentId, overrides = {}) {
  const definition = EQUIPMENT_DEFINITIONS[equipmentId];
  if (!definition) throw new RangeError(`Unknown equipmentId: ${equipmentId}`);
  return {
    equipmentId,
    state: "available",
    ready: false,
    compatible: null,
    assignedWorkstream: null,
    evidenceGateSatisfied: false,
    contextOnly: false,
    ...overrides
  };
}

export function transitionEquipmentStation(station, action, details = {}) {
  const currentIndex = EQUIPMENT_STATION_STATES.indexOf(station.state);
  if (currentIndex < 0) throw new RangeError(`Invalid station state: ${station.state}`);

  const normalizedAction = String(action || "").toUpperCase();
  const next = { ...station };

  if (normalizedAction === "SELECT") {
    if (currentIndex > 1) return next;
    next.state = "selected";
    return next;
  }

  if (normalizedAction === "CHECK") {
    if (currentIndex < 1) throw new Error("Equipment must be selected before it is checked.");
    next.state = "checked";
    next.ready = details.ready === true;
    next.compatible = details.compatible == null ? null : details.compatible === true;
    next.evidenceGateSatisfied = details.evidenceGateSatisfied === true;
    return next;
  }

  if (normalizedAction === "ASSIGN") {
    if (currentIndex < 2) throw new Error("Equipment must be checked before assignment.");
    if (!details.workstream) throw new Error("ASSIGN requires a workstream.");
    next.state = "assigned";
    next.assignedWorkstream = String(details.workstream);
    return next;
  }

  if (normalizedAction === "COMMIT") {
    if (currentIndex < 3) throw new Error("Equipment must be assigned before commitment.");
    next.state = "committed";
    return next;
  }

  throw new RangeError(`Unsupported equipment station action: ${action}`);
}

function gateFor(definition, gates) {
  return gates?.[definition.evidenceGate] === true;
}

function workstreamMatches(definition, station) {
  if (definition.authorisedWorkstream === "ANY_BEDSIDE_TEAM_MEMBER") return true;
  return station.assignedWorkstream === definition.authorisedWorkstream;
}

function zeroDelta() {
  return Object.fromEntries(BODY_STATE_KEYS.map((key) => [key, 0]));
}

/**
 * Synthetic one-step effect envelope. Coefficients are engineering placeholders,
 * not empirical treatment effect sizes. They exist to make causal direction visible
 * in an educational interface while evidence gates control whether an effect may be shown.
 */
function effectDelta(equipmentId, state) {
  const delta = zeroDelta();

  switch (equipmentId) {
    case EQUIPMENT_IDS.OXYGEN:
      delta.oxygenationReserve = 0.10;
      break;
    case EQUIPMENT_IDS.SUCTION:
      delta.airwayPatency = 0.10;
      delta.secretionBurden = -0.14;
      break;
    case EQUIPMENT_IDS.MANUAL_VENTILATION:
      delta.ventilationReserve = 0.16;
      delta.oxygenationReserve = 0.03;
      delta.workOfBreathing = -0.12;
      break;
    case EQUIPMENT_IDS.REPOSITION:
      delta.postureSupport = 0.12;
      delta.ventilationReserve = 0.04;
      delta.oxygenationReserve = 0.02;
      delta.workOfBreathing = -0.07;
      delta.aacAccess = state.aacAccess < 0.95 ? 0.03 : 0;
      break;
    case EQUIPMENT_IDS.AAC_RESTORE:
      delta.aacAccess = 0.08;
      break;
    case EQUIPMENT_IDS.DEFIBRILLATOR:
      // No deterministic physiology delta: the clinical arrest engine owns rhythm/ROSC events.
      break;
    default:
      throw new RangeError(`Unknown equipmentId: ${equipmentId}`);
  }

  return delta;
}

function applyDelta(state, delta) {
  return Object.fromEntries(
    BODY_STATE_KEYS.map((key) => [key, clamp01(state[key] + (delta[key] ?? 0))])
  );
}

export function visualDeteriorationIndex(bodyState) {
  const s = copyState(bodyState);
  const components = [
    1 - s.oxygenationReserve,
    1 - s.ventilationReserve,
    1 - s.airwayPatency,
    s.secretionBurden,
    s.workOfBreathing,
    1 - s.hemodynamicReserve,
    1 - s.postureSupport
  ];
  return clamp01(components.reduce((sum, value) => sum + value, 0) / components.length);
}

export function deriveBodyVisual(bodyState) {
  const s = copyState(bodyState);
  const decline = visualDeteriorationIndex(s);
  return {
    decline,
    verticalStability: clamp01(1 - decline),
    chestEffort: clamp01(s.workOfBreathing),
    postureSupport: s.postureSupport,
    communicationReachability: s.aacAccess,
    cues: [
      ...(s.workOfBreathing >= 0.70 ? ["increased-visible-respiratory-effort"] : []),
      ...(s.postureSupport < 0.50 ? ["reduced-postural-support"] : []),
      ...(s.aacAccess < 0.65 ? ["aac-access-compromised"] : []),
      ...(s.oxygenationReserve < 0.40 ? ["oxygenation-reserve-low"] : []),
      ...(s.ventilationReserve < 0.40 ? ["ventilation-reserve-low"] : [])
    ]
  };
}

export function previewEquipmentEffect(bodyState, station, gates = defaultEvidenceGates()) {
  const state = copyState(bodyState);
  const definition = EQUIPMENT_DEFINITIONS[station.equipmentId];
  if (!definition) throw new RangeError(`Unknown equipmentId: ${station.equipmentId}`);

  const evidenceGateSatisfied = gateFor(definition, gates);
  const readinessSatisfied = station.ready === true && station.compatible !== false;
  const assignmentSatisfied = workstreamMatches(definition, station);
  const lifecycleSatisfied = station.state === "assigned" || station.state === "committed";

  const blockedReasons = [];
  if (!evidenceGateSatisfied) blockedReasons.push(`evidence-gate:${definition.evidenceGate}`);
  if (!readinessSatisfied) blockedReasons.push("readiness-or-compatibility-not-confirmed");
  if (!assignmentSatisfied) blockedReasons.push("authorised-workstream-not-assigned");
  if (!lifecycleSatisfied) blockedReasons.push("station-not-assigned");
  if (station.contextOnly) blockedReasons.push("context-only-asset");

  const allowed = blockedReasons.length === 0;
  const delta = allowed ? effectDelta(station.equipmentId, state) : zeroDelta();
  const predictedState = applyDelta(state, delta);

  return {
    equipmentId: station.equipmentId,
    label: definition.label,
    allowed,
    blockedReasons,
    evidenceGate: definition.evidenceGate,
    authorisedWorkstream: definition.authorisedWorkstream,
    syntheticDelta: delta,
    before: state,
    previewAfter: predictedState,
    beforeVisual: deriveBodyVisual(state),
    previewVisual: deriveBodyVisual(predictedState),
    reassess: [...definition.reassess],
    sourceBoundary: definition.sourceBoundary,
    safety: {
      equipmentAvailabilityIsIndication: false,
      previewMutatesPatientState: false,
      capacityInferenceAllowed: false,
      legalAuthorityInferenceAllowed: false,
      deterministicClinicalOutcomeClaimed: false
    }
  };
}

export function commitEquipmentEffect(bodyState, station, gates = defaultEvidenceGates()) {
  if (station.state !== "committed") {
    throw new Error("Station must reach committed state before a synthetic effect can be applied.");
  }
  const preview = previewEquipmentEffect(bodyState, station, gates);
  if (!preview.allowed) {
    return {
      ...preview,
      committed: false,
      resultingState: copyState(bodyState),
      controllerEventRequired: false
    };
  }

  if (station.equipmentId === EQUIPMENT_IDS.DEFIBRILLATOR) {
    return {
      ...preview,
      committed: true,
      resultingState: copyState(bodyState),
      controllerEventRequired: true,
      controllerEvent: "ALS_DEFIBRILLATION_ATTEMPT",
      note: "Rhythm and ROSC outcomes remain owned by the clinical event controller."
    };
  }

  return {
    ...preview,
    committed: true,
    resultingState: preview.previewAfter,
    controllerEventRequired: false
  };
}

export function buildEquipmentCauseEffectGraph(bodyState, stations = [], gates = defaultEvidenceGates()) {
  const state = copyState(bodyState);
  return stations.map((station) => {
    const preview = previewEquipmentEffect(state, station, gates);
    return {
      equipmentId: preview.equipmentId,
      label: preview.label,
      state: station.state,
      allowed: preview.allowed,
      blockedReasons: preview.blockedReasons,
      edges: Object.entries(preview.syntheticDelta)
        .filter(([, value]) => value !== 0)
        .map(([target, value]) => ({
          from: preview.equipmentId,
          to: target,
          direction: value > 0 ? "increase" : "decrease",
          magnitude: Math.abs(value),
          synthetic: true
        })),
      reassess: preview.reassess
    };
  });
}

export function buildEquipmentLedgerEntry({
  runId,
  actorId,
  station,
  preview,
  moderatorEventId = null,
  timestamp = new Date().toISOString()
}) {
  return {
    runId: String(runId),
    actorId: String(actorId),
    timestamp,
    equipmentId: station.equipmentId,
    stationState: station.state,
    evidenceGate: preview.evidenceGate,
    allowed: preview.allowed,
    blockedReasons: [...preview.blockedReasons],
    before: { ...preview.before },
    previewAfter: { ...preview.previewAfter },
    moderatorEventId,
    provenance: {
      engine: "equipment-cause-effect-engine",
      version: EQUIPMENT_CAUSE_EFFECT_VERSION,
      syntheticEffectCoefficients: true,
      clinicalExecutionControlledElsewhere: true
    }
  };
}
