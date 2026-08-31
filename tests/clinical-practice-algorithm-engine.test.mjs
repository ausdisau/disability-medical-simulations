import test from "node:test";
import assert from "node:assert/strict";

import {
  buildClinicalSceneMonitor,
  deriveClinicalPracticeContext
} from "../src/features/clinical-practice-algorithm-engine.js";

test("BLS arrest recognition exposes CPR/AED learner action without granting ALS authority", () => {
  const ctx = deriveClinicalPracticeContext({
    responsive: false,
    breathingNormally: false,
    pulsePresent: false,
    rhythm: "pea",
    learnerScope: "BLS"
  });
  assert.ok(ctx.activePathways.includes("BLS_RECOGNITION"));
  assert.ok(ctx.activePathways.includes("ALS_NONSHOCKABLE"));
  assert.ok(ctx.learnerActions.some((a) => a.id === "BLS_CPR_AED"));
  assert.ok(ctx.clinicianLedActions.some((a) => a.id === "NO_DEFIBRILLATION_FOR_PEA_ASYSTOLE"));
  assert.equal(ctx.invariants.advancedActionsRemainClinicianLedWhenLearnerScopeIsBLS, true);
});

test("shockable arrest activates defibrillation branch", () => {
  const ctx = deriveClinicalPracticeContext({
    responsive: false,
    breathingNormally: false,
    pulsePresent: false,
    rhythm: "vf"
  });
  assert.ok(ctx.activePathways.includes("ALS_SHOCKABLE"));
  assert.ok(ctx.clinicianLedActions.some((a) => a.id === "ALS_DEFIBRILLATION"));
  assert.equal(ctx.npcSafeFacts.shockableRhythmPathway, true);
});

test("post-ROSC hypercapnic respiratory failure uses 88-92 authored oxygen target", () => {
  const ctx = deriveClinicalPracticeContext({
    pulsePresent: true,
    rosc: true,
    oxygenSaturationReliable: true,
    hypercapnicRespiratoryFailure: true,
    paCO2MmHg: 68,
    meanArterialPressureMmHg: 58,
    systolicBloodPressureMmHg: 92
  });
  const oxygen = ctx.clinicianLedActions.find((a) => a.id === "POST_ROSC_TARGETED_OXYGEN");
  assert.deepEqual(oxygen.target, [88, 92]);
  assert.ok(ctx.clinicianLedActions.some((a) => a.id === "POST_ROSC_BP_TARGET"));
  assert.ok(ctx.activePathways.includes("POST_ROSC"));
});

test("post-ROSC general target uses 94-98 when reliable oxygen measurement exists", () => {
  const ctx = deriveClinicalPracticeContext({
    pulsePresent: true,
    rosc: true,
    oxygenSaturationReliable: true,
    hypercapnicRespiratoryFailure: false
  });
  const oxygen = ctx.clinicianLedActions.find((a) => a.id === "POST_ROSC_TARGETED_OXYGEN");
  assert.deepEqual(oxygen.target, [94, 98]);
});

test("suspected infection with deterioration activates sepsis pathway without inventing a drug or dose", () => {
  const ctx = deriveClinicalPracticeContext({
    suspectedInfection: true,
    respiratoryDeterioration: true,
    clinicallySignificantOrganDysfunction: true,
    lactateMeasured: false,
    bloodCulturesCollected: false,
    antimicrobialsStarted: false
  });
  assert.ok(ctx.activePathways.includes("SEPSIS_PATHWAY"));
  assert.ok(ctx.clinicianLedActions.some((a) => a.id === "SEPSIS_EMPIRIC_ANTIMICROBIAL"));
  const antimicrobial = ctx.clinicianLedActions.find((a) => a.id === "SEPSIS_EMPIRIC_ANTIMICROBIAL");
  assert.match(antimicrobial.label, /local pathway\/formulary/i);
  assert.equal("dose" in antimicrobial, false);
});

test("tracheostomy deterioration escalates airway help while advanced manipulation remains clinician-led", () => {
  const ctx = deriveClinicalPracticeContext({
    tracheostomyPresent: true,
    tracheostomyPatent: false,
    respiratoryDeterioration: true
  });
  assert.ok(ctx.activePathways.includes("TRACHEOSTOMY_EMERGENCY"));
  assert.ok(ctx.learnerActions.some((a) => a.id === "TRACH_ESCALATE_AIRWAY_HELP"));
  assert.ok(ctx.clinicianLedActions.some((a) => a.id === "TRACH_EMERGENCY_ASSESSMENT"));
});

test("red deterioration trigger activates rapid response and creates NPC-safe monitor labels", () => {
  const ctx = deriveClinicalPracticeContext({ deteriorationTrigger: "red" });
  assert.ok(ctx.activePathways.includes("DETERIORATION_RAPID_RESPONSE"));
  const monitor = buildClinicalSceneMonitor(ctx);
  assert.ok(monitor.labels.includes("RAPID RESPONSE / EMERGENCY ESCALATION ACTIVE"));
});

test("communication access problem never creates capacity or treatment-ceiling inference", () => {
  const ctx = deriveClinicalPracticeContext({ communicationAccessAvailable: false });
  assert.ok(ctx.alerts.some((item) => /communication access/i.test(item)));
  assert.equal(ctx.invariants.physiologyDoesNotInferCapacity, true);
  assert.equal(ctx.invariants.disabilityDoesNotSetTreatmentCeiling, true);
  assert.equal(ctx.invariants.familyPresenceDoesNotCreateAuthority, true);
});

test("valid applicable CPR limit suppresses simulated arrest treatment branch", () => {
  const ctx = deriveClinicalPracticeContext({
    responsive: false,
    breathingNormally: false,
    pulsePresent: false,
    rhythm: "pea",
    validApplicableCPRLimit: true
  });
  assert.ok(ctx.activePathways.includes("BLS_RECOGNITION"));
  assert.equal(ctx.activePathways.includes("ALS_CARDIAC_ARREST"), false);
  assert.ok(ctx.activePathways.includes("ADVANCE_CARE_REVIEW"));
});
