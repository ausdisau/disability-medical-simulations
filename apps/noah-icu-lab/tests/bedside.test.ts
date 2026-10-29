import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  commitStation, initialCare, stationGate,
  type CareState, type StationId,
} from '../src/features/cardiopulmonary/runtime/bedside.ts';
import {
  createModel, advanceModel, DEFAULT_PARAMETERS, DEFAULT_SETTINGS,
  type LungParameters,
} from '../src/features/cardiopulmonary/runtime/pulmonary.ts';
import { configureCase, profiles } from '../src/features/cardiopulmonary/content/cases.ts';

const parameters = (patch: Partial<LungParameters> = {}): LungParameters => ({ ...DEFAULT_PARAMETERS, ...patch });
const assigned = (id: StationId, patch: Partial<CareState> = {}): CareState => ({
  ...initialCare(), selected: id, stage: 'assigned', assignedRole: 'Bedside nurse',
  planVerified: true, assessmentDone: true, circuitAssessed: true, responderReady: true,
  patientAgreement: id,
  ...patch,
});

test('access failure is unknown and does not fabricate a patient response', () => {
  const state = initialCare(false);
  assert.equal(state.patientResponse, 'unknown');
  assert.match(state.patientMessage, /unknown/i);
  assert.equal(state.planVerified, false);
  assert.equal(state.assessmentDone, false);
  assert.equal(state.patientAgreement, null);
});

test('a known response and reviewed plan never imply agreement to planned care', () => {
  const p = parameters({ secretionBurden: 0.8 });
  assert.equal(initialCare(true).patientAgreement, null);
  for (const id of ['07', '23', '09'] as const) {
    const care = assigned(id, { patientAgreement: null });
    assert.equal(care.patientResponse, 'known');
    assert.equal(care.planVerified, true);
    const result = commitStation(id, care, p);
    assert.match(result.message, /agreement/i);
    assert.deepEqual(result.parameters, p);
    assert.deepEqual(result.care, care);
  }
});

test('agreement is scoped to the proposed station and can be revoked before commitment', () => {
  const p = parameters({ secretionBurden: 0.8 });
  for (const id of ['07', '23', '09'] as const) {
    const differentStation: StationId = id === '07' ? '23' : '07';
    const wrongScope = assigned(id, { patientAgreement: differentStation });
    assert.match(stationGate(id, wrongScope, p) ?? '', /agreement/i);
    const ready = assigned(id);
    assert.equal(stationGate(id, ready, p), null);
    const revoked = { ...ready, patientAgreement: null };
    const result = commitStation(id, revoked, p);
    assert.match(result.message, /agreement/i);
    assert.deepEqual(result.care, revoked);
    assert.deepEqual(result.parameters, p);
  }
});

test('committed planned care consumes its agreement without inventing future agreement', () => {
  const p = parameters({ secretionBurden: 0.8 });
  for (const id of ['07', '23', '09'] as const) {
    const result = commitStation(id, assigned(id), p);
    assert.equal(result.care.stage, 'committed');
    assert.equal(result.care.patientAgreement, null);
    assert.equal(result.care.patientResponse, 'known');
  }
});

test('selection and checks alone cannot deliver an intervention', () => {
  const p = parameters({ secretionBurden: 0.8 });
  for (const stage of ['available', 'selected', 'checked'] as const) {
    const care = assigned('07', { stage });
    const result = commitStation('07', care, p);
    assert.deepEqual(result.parameters, p);
    assert.deepEqual(result.care, care);
  }
  const mismatched = assigned('14');
  assert.deepEqual(commitStation('07', mismatched, p).parameters, p);
});

test('airway replacement remains context-only even when all ordinary gates are ready', () => {
  const p = parameters({ disconnected: true });
  const care = assigned('01');
  const result = commitStation('01', care, p);
  assert.deepEqual(result.parameters, p);
  assert.deepEqual(result.care, care);
  assert.match(result.message, /context only|not implemented/i);
});

test('circuit correction requires evidence and readiness, not merely a selected object', () => {
  const connected = parameters();
  const disconnected = parameters({ disconnected: true });
  assert.ok(stationGate('14', assigned('14'), connected));
  assert.ok(stationGate('14', assigned('14', { circuitAssessed: false }), disconnected));
  assert.ok(stationGate('14', assigned('14', { responderReady: false }), disconnected));
  assert.equal(stationGate('14', assigned('14'), disconnected), null);
});

test('clearance requires clinical assessment, a plan, a supported cause and a ready responder', () => {
  const p = parameters({ secretionBurden: 0.8 });
  for (const absent of ['assessmentDone', 'planVerified', 'responderReady'] as const) {
    assert.ok(stationGate('07', assigned('07', { [absent]: false }), p), absent);
  }
  assert.ok(stationGate('07', assigned('07'), parameters({ secretionBurden: 0.08 })));
});

test('planned hands-on care respects WAIT and unknown communication', () => {
  const p = parameters({ secretionBurden: 0.8 });
  for (const id of ['07', '23', '09'] as const) {
    for (const access of [
      { patientResponse: 'wait' as const },
      { patientResponse: 'unknown' as const, aacAvailable: false },
    ]) {
      const care = assigned(id, access);
      const result = commitStation(id, care, p);
      assert.ok(stationGate(id, care, p), `${id} should preserve ${access.patientResponse}`);
      assert.deepEqual(result.parameters, p);
      assert.deepEqual(result.care, care);
    }
  }
});

test('urgent circuit assessment and correction remain available when communication is interrupted', () => {
  const p = parameters({ disconnected: true });
  const access = { patientResponse: 'unknown' as const, aacAvailable: false, patientAgreement: null };
  assert.equal(stationGate('17', assigned('17', access), p), null);
  assert.equal(stationGate('14', assigned('14', access), p), null);
  const result = commitStation('14', assigned('14', access), p);
  assert.equal(result.parameters.disconnected, false);
  assert.equal(result.care.patientResponse, 'unknown');
  assert.equal(result.care.aacAvailable, false);
  assert.equal(result.care.patientAgreement, null);
  assert.equal(result.care.reassessmentDue, true);
});

test('clearance provides a partial response without correcting unrelated pathology', () => {
  const p = parameters({ secretionBurden: 0.8, shuntFraction: 0.3, cardiacReserve: 0.5, leakFraction: 0.2 });
  const snapshot = structuredClone(p);
  const care = assigned('07');
  const originalCare = structuredClone(care);
  const result = commitStation('07', care, p);
  assert.ok(result.parameters.secretionBurden < p.secretionBurden);
  assert.ok(result.parameters.secretionBurden > 0.25, 'residual burden must remain for reassessment');
  assert.equal(result.parameters.shuntFraction, p.shuntFraction);
  assert.equal(result.parameters.cardiacReserve, p.cardiacReserve);
  assert.equal(result.parameters.leakFraction, p.leakFraction);
  assert.equal(result.care.reassessmentDue, true);
  assert.deepEqual(p, snapshot);
  assert.deepEqual(care, originalCare);
});

test('partial clearance must be reassessed before it can be repeated', () => {
  const first = commitStation('07', assigned('07'), parameters({ secretionBurden: 0.8 }));
  const readyAgain = { ...first.care, selected: '07' as const, stage: 'assigned' as const };
  const repeated = commitStation('07', readyAgain, first.parameters);
  assert.ok(stationGate('07', readyAgain, first.parameters));
  assert.deepEqual(repeated.parameters, first.parameters);
  assert.deepEqual(repeated.care, readyAgain);
  assert.match(repeated.message, /reassess/i);
  const reassessed = { ...readyAgain, reassessmentDue: false, reassessmentCount: 1 };
  assert.match(stationGate('07', reassessed, first.parameters) ?? '', /agreement/i);
  assert.equal(stationGate('07', { ...reassessed, patientAgreement: '07' }, first.parameters), null);
});

test('care reviews cannot normalize physiology or advance the simulation clock', () => {
  const p = parameters({ complianceMlPerCmH2O: 20, shuntFraction: 0.3, cardiacReserve: 0.5 });
  const model = advanceModel(createModel(DEFAULT_SETTINGS, p), DEFAULT_SETTINGS, p, 30);
  const modelSnapshot = structuredClone(model);
  for (const id of ['04', '17', '20', '23', '09'] as const) {
    const result = commitStation(id, assigned(id), p);
    assert.deepEqual(result.parameters, p, id);
  }
  assert.deepEqual(model, modelSnapshot);
});

test('circuit correction changes the fault without restoring gas or cardiac parameters', () => {
  const p = parameters({ disconnected: true, leakFraction: 0.55, shuntFraction: 0.25, cardiacReserve: 0.5 });
  const result = commitStation('14', assigned('14'), p);
  assert.equal(result.parameters.disconnected, false);
  assert.equal(result.parameters.leakFraction, 0);
  assert.equal(result.parameters.shuntFraction, 0.25);
  assert.equal(result.parameters.cardiacReserve, 0.5);
  assert.equal(result.care.reassessmentDue, true);
});

test('case construction does not mutate profiles and AAC interruption does not change lung physiology', () => {
  for (const id of ['cp', 'dmd'] as const) {
    const original = structuredClone(profiles[id]);
    const baseline = configureCase(id, 'baseline');
    const accessFailure = configureCase(id, 'aac');
    assert.deepEqual(accessFailure.parameters, baseline.parameters);
    assert.deepEqual(accessFailure.vent, baseline.vent);
    const acute = configureCase(id, 'restriction');
    assert.ok(acute.parameters.complianceMlPerCmH2O < baseline.parameters.complianceMlPerCmH2O);
    acute.parameters.cardiacReserve = 0.3;
    assert.deepEqual(profiles[id], original);
  }
});
