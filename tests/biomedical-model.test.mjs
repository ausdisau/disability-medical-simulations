import test from "node:test";
import assert from "node:assert/strict";
import {
  PROJECT_HOPE_PROVENANCE,
  applyCardiovascularEvent,
  createBiomedicalState,
  runBiomedicalSimulation,
  stepBiomedicalModel,
  validateBaseline
} from "../src/features/biomedical-model.js";

const TEST_BASELINE = Object.freeze({
  heartRateBpm: 80,
  meanArterialPressureMmHg: 90,
  rightAtrialPressureMmHg: 3,
  cardiacOutputLMin: 5,
  strokeVolumeMl: 62.5,
  systemicVascularResistanceMmHgMinPerL: 17.4,
  meanSystemicFillingPressureMmHg: 8,
  venousResistanceMmHgMinPerL: 1,
  hemoglobinGdl: 13,
  paCO2MmHg: 40,
  paO2MmHg: 90,
  referenceAlveolarVentilationLMin: 5
});

const BASE_INPUTS = Object.freeze({
  ventilation: {
    rateBpm: 16,
    tidalVolumeL: 0.46,
    deadSpaceL: 0.15,
    fio2: 0.21,
    peepCmH2O: 2,
    inspiratoryPressureAbovePeepCmH2O: 8,
    inspiratoryDutyFraction: 0.33,
    circuitPatency: 1,
    gasExchangeEfficiency: 0.9
  },
  cardiovascular: {
    volumeFactor: 1,
    vasomotorFactor: 1,
    contractilityFactor: 1,
    externalPerfusionLMin: 0
  }
});

test("explicit baseline is required and internally checked", () => {
  assert.equal(validateBaseline(TEST_BASELINE), true);
  assert.throws(() => createBiomedicalState({ baseline: null }), /baseline/i);
});

test("higher positive airway pressure reduces venous return in the coupling model", () => {
  const state = createBiomedicalState({ baseline: TEST_BASELINE });
  const low = stepBiomedicalModel(state, BASE_INPUTS, 1);
  const high = stepBiomedicalModel(
    state,
    {
      ...BASE_INPUTS,
      ventilation: {
        ...BASE_INPUTS.ventilation,
        peepCmH2O: 12,
        inspiratoryPressureAbovePeepCmH2O: 14
      }
    },
    1
  );

  assert.ok(high.venousReturnLMin < low.venousReturnLMin);
  assert.ok(high.rightAtrialPressureMmHg > low.rightAtrialPressureMmHg);
});

test("gas-exchange impairment lowers oxygenation over time without changing disability baseline", () => {
  const state = createBiomedicalState({ baseline: TEST_BASELINE });
  const result = runBiomedicalSimulation({
    state,
    durationSeconds: 30,
    dtSeconds: 0.5,
    inputs: {
      ...BASE_INPUTS,
      ventilation: {
        ...BASE_INPUTS.ventilation,
        gasExchangeEfficiency: 0.25
      }
    }
  });

  assert.ok(result.state.paO2MmHg < state.paO2MmHg);
  assert.ok(result.state.oxygenSaturationFraction < state.oxygenSaturationFraction);
  assert.equal(state.baseline.paO2MmHg, TEST_BASELINE.paO2MmHg);
});

test("PEA preserves electrical activity while removing native mechanical output", () => {
  let state = createBiomedicalState({ baseline: TEST_BASELINE });
  state = applyCardiovascularEvent(state, { type: "PEA", electricalRateBpm: 52 });
  state = stepBiomedicalModel(state, BASE_INPUTS, 0.5);

  assert.equal(state.rhythm, "pea");
  assert.equal(state.electricalRateBpm, 52);
  assert.equal(state.nativeCardiacOutputLMin, 0);
  assert.equal(state.mechanicalCirculationPresent, false);
});

test("asystole removes both electrical rate and native mechanical output", () => {
  let state = createBiomedicalState({ baseline: TEST_BASELINE });
  state = applyCardiovascularEvent(state, { type: "ASYSTOLE" });
  state = stepBiomedicalModel(state, BASE_INPUTS, 0.5);

  assert.equal(state.rhythm, "asystole");
  assert.equal(state.electricalRateBpm, 0);
  assert.equal(state.nativeCardiacOutputLMin, 0);
});

test("ROSC requires scenario-provided rate and contractility rather than inventing them", () => {
  let state = createBiomedicalState({ baseline: TEST_BASELINE });
  state = applyCardiovascularEvent(state, { type: "ASYSTOLE" });

  assert.throws(() => applyCardiovascularEvent(state, { type: "ROSC" }), /requires/i);

  state = applyCardiovascularEvent(state, {
    type: "ROSC",
    electricalRateBpm: 96,
    contractilityFactor: 0.55,
    source: "test-scenario"
  });
  state = stepBiomedicalModel(state, BASE_INPUTS, 1);

  assert.equal(state.rhythm, "rosc");
  assert.equal(state.mechanicalCirculationPresent, true);
  assert.ok(state.nativeCardiacOutputLMin > 0);
});

test("Project Hope provenance blocks disability-severity physiology inference", () => {
  assert.ok(
    PROJECT_HOPE_PROVENANCE.rules.baselineOxygenationNotInferredFromMotorSeverity.includes(
      "SRC-LUNG-CP-2014"
    )
  );
  assert.match(PROJECT_HOPE_PROVENANCE.constraints[0], /must be provided explicitly/i);
  assert.match(PROJECT_HOPE_PROVENANCE.constraints[3], /must never determine/i);
});
