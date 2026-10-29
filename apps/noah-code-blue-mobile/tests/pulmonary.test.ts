import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SETTINGS, DEFAULT_PARAMETERS, MAX_HISTORY_SAMPLES,
  advanceModel, createModel, deliverManualBreath, getWaveSamples, normalizeSettings, normalizeParameters,
  type VentSettings, type LungParameters, type ModelState,
} from '../src/model/pulmonary.ts';

const settings = (patch: Partial<VentSettings> = {}): VentSettings => ({ ...DEFAULT_SETTINGS, ...patch });
const parameters = (patch: Partial<LungParameters> = {}): LungParameters => ({ ...DEFAULT_PARAMETERS, ...patch });
const run = (s = settings(), p = parameters(), seconds = 120): ModelState => advanceModel(createModel(s, p), s, p, seconds);
const near = (actual: number, expected: number, tolerance: number, explanation: string) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${explanation}: ${actual} versus ${expected}`);

test('two equal compartments reproduce the analytical periodic single R-C excursion', () => {
  const s = settings({ rate: 12, inspiratoryTime: 1, pressureControl: 12 });
  const p = parameters({ complianceMlPerCmH2O: 50, resistanceCmH2OPerLPerSec: 10, secretionBurden: 0, leftComplianceFraction: 0.5 });
  const a = Math.exp(-1 / 0.5), b = Math.exp(-4 / 0.5);
  const expectedMl = 50 * 12 * (1 - a) * (1 - b) / (1 - a * b);
  near(run(s, p).metrics.actualTidalVolumeMl, expectedMl, expectedMl * 0.015, 'implicit integration converges to R-C solution');
});

test('pressure control responds to reduced compliance and increased resistance', () => {
  const baseline = run().metrics;
  const stiff = run(settings(), parameters({ complianceMlPerCmH2O: 20 })).metrics;
  const obstructed = run(settings(), parameters({ resistanceCmH2OPerLPerSec: 30 })).metrics;
  assert.ok(stiff.actualTidalVolumeMl < baseline.actualTidalVolumeMl * 0.7);
  assert.ok(obstructed.actualTidalVolumeMl < baseline.actualTidalVolumeMl * 0.7);
  near(stiff.peakPressure, baseline.peakPressure, 0.001, 'same pressure-controlled pressure');
});

test('volume control supplies requested volume when the pressure cap does not intervene', () => {
  const s = settings({ mode: 'VC', tidalVolumeMl: 420, pressureLimit: 50 });
  const result = run(s).metrics;
  near(result.actualTidalVolumeMl, 420, 1, 'delivered VT');
  near(result.minuteVentilation, 420 * s.rate / 1000, 0.03, 'minute ventilation unit conversion');
});

test('a pressure cap constrains volume control rather than inventing target delivery', () => {
  const s = settings({ mode: 'VC', tidalVolumeMl: 700, pressureLimit: 20 });
  const result = run(s, parameters({ complianceMlPerCmH2O: 15 }));
  assert.ok(result.metrics.actualTidalVolumeMl < 300);
  assert.ok(result.pressureLimited);
  assert.ok(result.history.every(sample => sample.pressure <= 20 + 1e-9));
});

test('insufficient expiration creates intrinsic PEEP in the R-C system', () => {
  const p = parameters({ resistanceCmH2OPerLPerSec: 40 });
  const trapped = run(settings({ rate: 40, inspiratoryTime: 1.2 }), p).metrics;
  const unhurried = run(settings({ rate: 10, inspiratoryTime: 1 }), p).metrics;
  assert.ok(trapped.autoPEEP > 5);
  assert.ok(trapped.autoPEEP > unhurried.autoPEEP + 4);
});

test('FiO2 changes oxygenation without directly changing ventilation or PaCO2', () => {
  const p = parameters({ shuntFraction: 0.12 });
  const low = run(settings({ rate: 10, fio2: 0.21 }), p, 180).metrics;
  const high = run(settings({ rate: 10, fio2: 0.8 }), p, 180).metrics;
  near(high.paCO2, low.paCO2, 1e-12, 'CO2 independence from FiO2');
  near(high.alveolarVentilation, low.alveolarVentilation, 1e-12, 'unchanged alveolar ventilation');
  assert.ok(high.spo2 > low.spo2 + 2);
  assert.ok(high.paCO2 > 48, 'a high saturation must coexist with retained CO2 in this scenario');
});

test('inadequate alveolar ventilation raises CO2 and lowers acute modeled pH', () => {
  const adequate = run().metrics;
  const reduced = run(settings({ rate: 8, pressureControl: 8 }), parameters(), 180).metrics;
  assert.ok(reduced.alveolarVentilation < adequate.alveolarVentilation);
  assert.ok(reduced.paCO2 > adequate.paCO2 + 10);
  assert.ok(reduced.pH < adequate.pH);
});

test('disconnection removes circuit readings and the capnogram, with separate CO2 accumulation', () => {
  const initial = run();
  const p = parameters({ disconnected: true });
  const immediate = advanceModel(initial, settings(), p, 0.1);
  assert.equal(immediate.metrics.tidalVolumeMl, 0);
  assert.equal(immediate.metrics.minuteVentilation, 0);
  assert.equal(immediate.metrics.pressure, 0);
  assert.equal(immediate.metrics.flow, 0);
  assert.equal(immediate.metrics.etCO2, null);
  const later = advanceModel(immediate, settings(), p, 60);
  assert.ok(later.metrics.paCO2 > initial.metrics.paCO2 + 5);
  assert.ok(later.metrics.paO2 < initial.metrics.paO2);
  assert.equal(later.history.at(-1)?.co2, null);
});

test('cardiac reserve is independent of diagnosis, lung mechanics and CO2 production', () => {
  const usual = run().metrics;
  const reduced = run(settings(), parameters({ cardiacReserve: 0.5 })).metrics;
  assert.ok(reduced.cardiacOutput < usual.cardiacOutput * 0.6);
  assert.ok(reduced.map < usual.map);
  near(reduced.actualTidalVolumeMl, usual.actualTidalVolumeMl, 1e-12, 'unchanged mechanics');
  near(reduced.paCO2, usual.paCO2, 1e-12, 'unchanged ventilation in this simplified model');
});

test('leak reduces measured expiration; secretion burden raises resistance', () => {
  const baseline = run().metrics;
  const leak = run(settings(), parameters({ leakFraction: 0.4 })).metrics;
  const secretions = run(settings(), parameters({ secretionBurden: 0.8 })).metrics;
  assert.ok(leak.tidalVolumeMl < leak.actualTidalVolumeMl);
  assert.ok(leak.actualTidalVolumeMl < baseline.actualTidalVolumeMl);
  assert.ok(secretions.actualTidalVolumeMl < baseline.actualTidalVolumeMl);
});

test('route metadata does not assume a tracheostomy automatically changes resistance', () => {
  const trach = run(settings({ airway: 'tracheostomy' })).metrics;
  const ett = run(settings({ airway: 'ett' })).metrics;
  assert.deepEqual(trach, ett);
});

test('invalid values are normalized to finite software bounds', () => {
  const s = normalizeSettings({ fio2: NaN, peep: Infinity, rate: -500, inspiratoryTime: 500, pressureControl: NaN, pressureLimit: -10, tidalVolumeMl: Infinity });
  const p = normalizeParameters({ complianceMlPerCmH2O: NaN, cardiacReserve: Infinity, shuntFraction: 30, leakFraction: -2, deadSpaceMl: Infinity });
  for (const value of Object.values(s)) if (typeof value === 'number') assert.ok(Number.isFinite(value));
  for (const value of Object.values(p)) if (typeof value === 'number') assert.ok(Number.isFinite(value));
  assert.ok(s.inspiratoryTime < 60 / s.rate);
  assert.ok(s.pressureLimit >= s.peep + 2);
  assert.ok(p.shuntFraction <= 0.65 && p.leakFraction >= 0);
  const result = run(s, p);
  for (const value of Object.values(result.metrics)) if (typeof value === 'number') assert.ok(Number.isFinite(value));
});

test('zero, negative and nonfinite elapsed times cannot advance the physiology', () => {
  const initial = createModel();
  for (const elapsed of [0, -5, NaN, Infinity]) {
    const result = advanceModel(initial, settings(), parameters(), elapsed);
    assert.deepEqual(result, initial);
  }
});

test('explicit fixed time is reproducible across different scheduling chunks', () => {
  const once = run(settings(), parameters(), 20);
  let split = createModel();
  for (let i = 0; i < 200; i += 1) split = advanceModel(split, settings(), parameters(), 0.1);
  assert.deepEqual(split, once);
});

test('advance does not mutate a previous state or its trace history', () => {
  const initial = run(settings(), parameters(), 1);
  const snapshot = structuredClone(initial);
  const result = advanceModel(initial, settings(), parameters(), 1);
  assert.deepEqual(initial, snapshot);
  assert.notEqual(result.metrics, initial.metrics);
  const waves = getWaveSamples(result);
  waves[0].pressure = 999;
  assert.notEqual(result.history[0].pressure, 999);
});

test('ten simulated minutes remain finite and bound the history to sixty seconds', () => {
  const result = run(settings(), parameters(), 600);
  assert.equal(result.time, 600);
  assert.equal(result.history.length, MAX_HISTORY_SAMPLES);
  assert.ok(result.completedBreaths > 150);
  assert.ok(result.history[0].time >= 540);
  for (const value of Object.values(result.metrics)) if (typeof value === 'number') assert.ok(Number.isFinite(value));
});

test('extreme allowed mechanics do not create NaN, negative absolute volumes or cap violations', () => {
  for (const compliance of [10, 100]) for (const resistance of [2, 60]) for (const leak of [0, 0.95]) {
    const s = settings({ rate: 40, peep: 20, pressureControl: 35, pressureLimit: 40, inspiratoryTime: 1.25 });
    const p = parameters({ complianceMlPerCmH2O: compliance, resistanceCmH2OPerLPerSec: resistance, leakFraction: leak, leftComplianceFraction: 0.2, muscleEffortCmH2O: 15, secretionBurden: 1 });
    const result = run(s, p, 30);
    assert.ok(result.leftVolumeL >= 0 && result.rightVolumeL >= 0);
    for (const value of Object.values(result.metrics)) if (typeof value === 'number') assert.ok(Number.isFinite(value));
    assert.ok(result.history.every(sample => sample.pressure <= 40));
  }
});

test('manual source has no automatic mandatory breaths, irrespective of the machine rate', () => {
  const s = settings({ ventilationSource: 'manual-bag', rate: 40 });
  const result = run(s, parameters(), 90);
  assert.equal(result.manualBreathCount, 0);
  assert.equal(result.metrics.respiratoryRate, 0);
  assert.equal(result.metrics.alveolarVentilation, 0);
  assert.equal(result.metrics.tidalVolumeMl, 0);
  assert.ok(result.metrics.paCO2 > 50);
});

test('one bag command requests one time-dependent R-C breath without resetting gases', () => {
  const s = settings({ ventilationSource: 'manual-bag' });
  const initial = createModel(s, parameters());
  const queued = deliverManualBreath(initial, s, parameters());
  assert.equal(queued.time, initial.time);
  assert.equal(queued.metrics.paCO2, initial.metrics.paCO2);
  assert.equal(queued.metrics.paO2, initial.metrics.paO2);
  assert.equal(queued.leftVolumeL, initial.leftVolumeL);
  assert.equal(queued.manualBreathCount, 1);
  const duplicate = deliverManualBreath(queued, s, parameters());
  assert.equal(duplicate.manualBreathCount, 1, 'an in-progress squeeze cannot be retriggered');
  const filling = advanceModel(queued, s, parameters(), 0.5);
  assert.ok(filling.metrics.volumeMl > 200);
  assert.ok(filling.manualBreathActive);
  const expired = advanceModel(filling, s, parameters(), 8);
  assert.ok(expired.metrics.tidalVolumeMl > 300);
  assert.equal(expired.manualBreathActive, false);
  assert.equal(expired.completedBreaths, 1);
  const unattended = advanceModel(expired, s, parameters(), 80);
  assert.equal(unattended.manualBreathCount, 1);
  assert.equal(unattended.metrics.alveolarVentilation, 0);
  assert.equal(unattended.metrics.respiratoryRate, 0);
  assert.equal(unattended.metrics.etCO2, null);
});

test('manual measured rate follows actual bag events, not the ventilator rate setting', () => {
  const s = settings({ ventilationSource: 'manual-bag', rate: 40 });
  let state = createModel(s, parameters());
  for (let i = 0; i < 10; i += 1) {
    state = deliverManualBreath(state, s, parameters());
    state = advanceModel(state, s, parameters(), 6);
  }
  assert.equal(state.manualBreathCount, 10);
  near(state.metrics.manualRespiratoryRate, 10, 0.01, 'delivered rolling rate');
  assert.ok(state.metrics.minuteVentilation > 3 && state.metrics.minuteVentilation < 5);
  assert.ok(state.metrics.paCO2 > 44, 'manual ventilation does not magically normalize CO2');
});

test('a connected bag bypasses a failed machine circuit but retains lung resistance and stiffness', () => {
  const s = settings({ ventilationSource: 'manual-bag' });
  const bag = (p: LungParameters) => advanceModel(deliverManualBreath(createModel(s, p), s, p), s, p, 8);
  const ordinary = bag(parameters());
  const bypass = bag(parameters({ disconnected: true }));
  const obstructed = bag(parameters({ disconnected: true, secretionBurden: 0.9, complianceMlPerCmH2O: 20 }));
  near(bypass.metrics.actualTidalVolumeMl, ordinary.metrics.actualTidalVolumeMl, 1e-9, 'machine circuit bypass');
  assert.ok(obstructed.metrics.actualTidalVolumeMl < bypass.metrics.actualTidalVolumeMl * 0.6);
});

test('low cardiac reserve cannot itself declare arrest or enable compression-generated flow', () => {
  const p = parameters({ cardiacReserve: 0.25, compressionsActive: true });
  const result = run(settings(), p);
  assert.ok(result.metrics.map < 40);
  assert.equal(result.metrics.spontaneousPulsePresent, true);
  assert.equal(result.metrics.compressionActive, false);
  assert.equal(result.metrics.compressionFlow, 0);
  assert.equal(result.compressionCount, 0);
});

test('explicit arrest removes intrinsic forward flow and reliable oximetry', () => {
  const result = run(settings(), parameters({ circulationState: 'arrest' }), 10);
  assert.equal(result.metrics.intrinsicCardiacOutput, 0);
  assert.equal(result.metrics.cardiacOutput, 0);
  assert.equal(result.metrics.oxygenDelivery, 0);
  assert.equal(result.metrics.spontaneousPulsePresent, false);
  assert.equal(result.metrics.pulseOximeterAvailable, false);
  assert.equal(result.metrics.etCO2, 0);
});

test('compressions create limited modeled flow and completed cycles, never automatic ROSC', () => {
  const p = parameters({ circulationState: 'arrest', compressionsActive: true, compressionRate: 110 });
  const result = run(settings(), p, 30);
  assert.ok(result.metrics.compressionFlow > 1 && result.metrics.compressionFlow < 2);
  assert.equal(result.metrics.cardiacOutput, result.metrics.compressionFlow);
  assert.equal(result.metrics.intrinsicCardiacOutput, 0);
  assert.equal(result.metrics.spontaneousPulsePresent, false);
  assert.equal(result.metrics.pulseOximeterAvailable, false);
  assert.ok(result.compressionCount >= 54 && result.compressionCount <= 55);
  assert.ok(result.history.some(sample => Math.abs(sample.compression ?? 0) > 0.1));
  const later = advanceModel(result, settings(), p, 180);
  assert.equal(later.metrics.spontaneousPulsePresent, false);
  assert.equal(later.metrics.intrinsicCardiacOutput, 0);
});

test('pausing compressions stops the cycle count and lets generated flow decay', () => {
  const p = parameters({ circulationState: 'arrest', compressionsActive: true });
  const running = run(settings(), p, 10);
  const stopped = advanceModel(running, settings(), { ...p, compressionsActive: false }, 8);
  assert.equal(stopped.compressionCount, running.compressionCount);
  assert.equal(stopped.metrics.compressionActive, false);
  assert.ok(stopped.metrics.compressionFlow < 0.001);
  assert.equal(stopped.metrics.spontaneousPulsePresent, false);
});

test('mask breaths require a compression pause; an existing advanced airway permits overlap', () => {
  const p = parameters({ circulationState: 'arrest', compressionsActive: true });
  const mask = settings({ ventilationSource: 'manual-bag', airway: 'mask' });
  const blocked = deliverManualBreath(createModel(mask, p), mask, p);
  assert.equal(blocked.manualBreathCount, 0);
  const allowed = deliverManualBreath(blocked, mask, { ...p, compressionsActive: false });
  assert.equal(allowed.manualBreathCount, 1);
  const ett = settings({ ventilationSource: 'manual-bag', airway: 'ett' });
  const concurrent = advanceModel(deliverManualBreath(createModel(ett, p), ett, p), ett, p, 0.5);
  assert.equal(concurrent.manualBreathCount, 1);
  assert.equal(concurrent.metrics.compressionActive, true);
  assert.ok(concurrent.metrics.volumeMl > 200);
  assert.ok(concurrent.metrics.compressionFlow > 0);
});

test('mask is an explicitly manual source and new numerical fields receive finite normalization', () => {
  assert.equal(normalizeSettings({ airway: 'mask', ventilationSource: 'ventilator' }).airway, 'tracheostomy');
  assert.equal(normalizeSettings({ airway: 'mask', ventilationSource: 'manual-bag' }).airway, 'mask');
  const p = normalizeParameters({ circulationState: 'arrest', compressionsActive: true, compressionRate: Infinity, compressionDepthMm: NaN, compressionRecoilFraction: -4 });
  assert.equal(p.compressionRate, 110);
  assert.equal(p.compressionDepthMm, 55);
  assert.equal(p.compressionRecoilFraction, 0);
  const result = run(settings(), p, 10);
  assert.equal(result.metrics.compressionFlow, 0);
  for (const value of Object.values(result.metrics)) if (typeof value === 'number') assert.ok(Number.isFinite(value));
});

test('explicit facilitator restoration preserves gas state and is the only restoration switch', () => {
  const p = parameters({ circulationState: 'arrest', compressionsActive: true });
  const arrest = run(settings({ pressureControl: 5 }), p, 60);
  assert.equal(arrest.metrics.spontaneousPulsePresent, false);
  const restored = advanceModel(arrest, settings({ pressureControl: 5 }), { ...p, circulationState: 'perfusing', compressionsActive: false }, 0.01);
  assert.equal(restored.metrics.spontaneousPulsePresent, true);
  assert.equal(restored.metrics.compressionFlow, 0);
  near(restored.metrics.paCO2, arrest.metrics.paCO2, 0.01, 'restoration does not reset accumulated CO2');
  near(restored.metrics.paO2, arrest.metrics.paO2, 0.2, 'restoration does not reset oxygen state');
});

test('an explicit arrest event immediately invalidates pulse oximetry without consuming time', () => {
  const initial = run();
  const changed = advanceModel(initial, settings(), parameters({ circulationState: 'arrest' }), 0);
  assert.equal(changed.time, initial.time);
  assert.equal(changed.metrics.paCO2, initial.metrics.paCO2);
  assert.equal(changed.metrics.paO2, initial.metrics.paO2);
  assert.equal(changed.metrics.spontaneousPulsePresent, false);
  assert.equal(changed.metrics.pulseOximeterAvailable, false);
  assert.equal(changed.metrics.intrinsicCardiacOutput, 0);
});

test('compressions use only explicit simulation time and remain chunk-invariant', () => {
  const p = parameters({ circulationState: 'arrest', compressionsActive: true });
  const once = run(settings(), p, 20);
  let split = createModel(settings(), p);
  for (let i = 0; i < 200; i += 1) split = advanceModel(split, settings(), p, 0.1);
  assert.deepEqual(split, once);
  const paused = advanceModel(split, settings(), p, 0);
  assert.equal(paused.compressionCount, split.compressionCount);
  assert.equal(paused.metrics.compressionFlow, split.metrics.compressionFlow);
});

test('an initial arrest state has no heart rate, spontaneous output or artificial pulse pressure', () => {
  const state = createModel(settings(), parameters({ circulationState: 'arrest' }));
  assert.equal(state.metrics.heartRate, 0);
  assert.equal(state.metrics.intrinsicCardiacOutput, 0);
  assert.equal(state.metrics.cardiacOutput, 0);
  assert.equal(state.metrics.systolicBP, state.metrics.diastolicBP);
  assert.ok(state.metrics.diastolicBP >= 0);
  assert.equal(state.metrics.spontaneousPulsePresent, false);
  assert.equal(state.metrics.pulseOximeterAvailable, false);
});

test('synchronized muscle effort is absent during arrest while remaining operative during perfusion', () => {
  const noEffort = parameters({ muscleEffortCmH2O: 0 });
  const effort = parameters({ muscleEffortCmH2O: 15 });
  const arrestedWithout = run(settings(), { ...noEffort, circulationState: 'arrest' }, 30);
  const arrestedWith = run(settings(), { ...effort, circulationState: 'arrest' }, 30);
  assert.deepEqual(arrestedWith.metrics, arrestedWithout.metrics);
  assert.equal(arrestedWith.leftVolumeL, arrestedWithout.leftVolumeL);
  assert.equal(arrestedWith.rightVolumeL, arrestedWithout.rightVolumeL);
  const perfusingWithout = run(settings(), noEffort, 30);
  const perfusingWith = run(settings(), effort, 30);
  assert.ok(perfusingWith.metrics.actualTidalVolumeMl > perfusingWithout.metrics.actualTidalVolumeMl + 50);
});
