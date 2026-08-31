import test from "node:test";
import assert from "node:assert/strict";

import {
  EQUIPMENT_IDS,
  buildEquipmentCauseEffectGraph,
  commitEquipmentEffect,
  createEquipmentStation,
  defaultBodyState,
  defaultEvidenceGates,
  deriveBodyVisual,
  previewEquipmentEffect,
  transitionEquipmentStation,
  visualDeteriorationIndex
} from "../src/features/equipment-cause-effect-engine.js";

function assignedReadyStation(equipmentId, gateSatisfied = true, workstream = null) {
  const definitionWorkstreams = {
    [EQUIPMENT_IDS.OXYGEN]: "AIRWAY_BREATHING",
    [EQUIPMENT_IDS.SUCTION]: "AIRWAY_TRAINED_CLINICIAN",
    [EQUIPMENT_IDS.MANUAL_VENTILATION]: "AIRWAY_TRAINED_CLINICIAN",
    [EQUIPMENT_IDS.REPOSITION]: "BEDSIDE_TEAM",
    [EQUIPMENT_IDS.DEFIBRILLATOR]: "ALS_TEAM",
    [EQUIPMENT_IDS.AAC_RESTORE]: "ANY_BEDSIDE_TEAM_MEMBER"
  };

  let station = createEquipmentStation(equipmentId);
  station = transitionEquipmentStation(station, "SELECT");
  station = transitionEquipmentStation(station, "CHECK", {
    ready: true,
    compatible: true,
    evidenceGateSatisfied: gateSatisfied
  });
  station = transitionEquipmentStation(station, "ASSIGN", {
    workstream: workstream ?? definitionWorkstreams[equipmentId]
  });
  return station;
}

test("selection alone never changes the body state", () => {
  const body = defaultBodyState();
  const station = transitionEquipmentStation(createEquipmentStation(EQUIPMENT_IDS.OXYGEN), "SELECT");
  const preview = previewEquipmentEffect(body, station, { ...defaultEvidenceGates(), oxygenIndicated: true });
  assert.equal(preview.allowed, false);
  assert.deepEqual(preview.previewAfter, body);
});

test("oxygen changes oxygenation reserve but does not directly fix ventilation", () => {
  const body = defaultBodyState();
  const station = assignedReadyStation(EQUIPMENT_IDS.OXYGEN);
  const preview = previewEquipmentEffect(body, station, { ...defaultEvidenceGates(), oxygenIndicated: true });
  assert.equal(preview.allowed, true);
  assert.ok(preview.previewAfter.oxygenationReserve > body.oxygenationReserve);
  assert.equal(preview.previewAfter.ventilationReserve, body.ventilationReserve);
});

test("suction is blocked without evidence of secretions", () => {
  const body = defaultBodyState();
  const station = assignedReadyStation(EQUIPMENT_IDS.SUCTION);
  const preview = previewEquipmentEffect(body, station, defaultEvidenceGates());
  assert.equal(preview.allowed, false);
  assert.ok(preview.blockedReasons.includes("evidence-gate:secretionsEvidence"));
  assert.deepEqual(preview.previewAfter, body);
});

test("manual ventilation is blocked unless the ventilation-failure gate is authored", () => {
  const body = defaultBodyState();
  const station = assignedReadyStation(EQUIPMENT_IDS.MANUAL_VENTILATION);
  const preview = previewEquipmentEffect(body, station, defaultEvidenceGates());
  assert.equal(preview.allowed, false);
  assert.equal(preview.previewAfter.workOfBreathing, body.workOfBreathing);
});

test("compatible repositioning can improve synthetic posture/access variables without claiming a fixed SpO2 gain", () => {
  const body = { ...defaultBodyState(), aacAccess: 0.70 };
  const station = assignedReadyStation(EQUIPMENT_IDS.REPOSITION);
  const preview = previewEquipmentEffect(body, station, defaultEvidenceGates());
  assert.equal(preview.allowed, true);
  assert.ok(preview.previewAfter.postureSupport > body.postureSupport);
  assert.ok(preview.previewAfter.aacAccess > body.aacAccess);
  assert.ok(preview.previewAfter.workOfBreathing < body.workOfBreathing);
});

test("AAC restoration changes access, not cognition or legal authority", () => {
  const body = { ...defaultBodyState(), aacAccess: 0.40 };
  const station = assignedReadyStation(EQUIPMENT_IDS.AAC_RESTORE);
  const preview = previewEquipmentEffect(body, station, { ...defaultEvidenceGates(), aacAccessImpaired: true });
  assert.equal(preview.allowed, true);
  assert.ok(preview.previewAfter.aacAccess > body.aacAccess);
  assert.equal(preview.safety.capacityInferenceAllowed, false);
  assert.equal(preview.safety.legalAuthorityInferenceAllowed, false);
});

test("defibrillator is blocked in a non-shockable context", () => {
  const body = defaultBodyState();
  const station = assignedReadyStation(EQUIPMENT_IDS.DEFIBRILLATOR);
  const preview = previewEquipmentEffect(body, station, defaultEvidenceGates());
  assert.equal(preview.allowed, false);
  assert.ok(preview.blockedReasons.includes("evidence-gate:shockableArrest"));
});

test("a committed shockable defibrillator action requests a controller event rather than deterministic ROSC", () => {
  const body = defaultBodyState();
  let station = assignedReadyStation(EQUIPMENT_IDS.DEFIBRILLATOR);
  station = transitionEquipmentStation(station, "COMMIT");
  const result = commitEquipmentEffect(body, station, { ...defaultEvidenceGates(), shockableArrest: true });
  assert.equal(result.committed, true);
  assert.equal(result.controllerEventRequired, true);
  assert.equal(result.controllerEvent, "ALS_DEFIBRILLATION_ATTEMPT");
  assert.deepEqual(result.resultingState, body);
});

test("all visual state outputs remain bounded between zero and one", () => {
  const body = defaultBodyState();
  const visual = deriveBodyVisual(body);
  assert.ok(visual.decline >= 0 && visual.decline <= 1);
  assert.ok(visual.verticalStability >= 0 && visual.verticalStability <= 1);
  assert.ok(visualDeteriorationIndex(body) >= 0 && visualDeteriorationIndex(body) <= 1);
});

test("cause-effect graph only exposes edges for evidence-gated effects", () => {
  const body = defaultBodyState();
  const oxygen = assignedReadyStation(EQUIPMENT_IDS.OXYGEN);
  const suction = assignedReadyStation(EQUIPMENT_IDS.SUCTION);
  const graph = buildEquipmentCauseEffectGraph(body, [oxygen, suction], {
    ...defaultEvidenceGates(),
    oxygenIndicated: true,
    secretionsEvidence: false
  });
  assert.equal(graph[0].allowed, true);
  assert.ok(graph[0].edges.some((edge) => edge.to === "oxygenationReserve"));
  assert.equal(graph[1].allowed, false);
  assert.equal(graph[1].edges.length, 0);
});
