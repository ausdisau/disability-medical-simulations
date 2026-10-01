export const BIOMEDICAL_MODEL_VERSION = "0.1.0";

const EPSILON = 1e-9;
const SEA_LEVEL_BAROMETRIC_PRESSURE_MMHG = 760;
const WATER_VAPOUR_PRESSURE_MMHG = 47;
const RESPIRATORY_QUOTIENT = 0.8;
const O2_BINDING_ML_PER_G_HB = 1.34;
const DISSOLVED_O2_ML_DL_PER_MMHG = 0.003;

const REQUIRED_BASELINE_FIELDS = [
  "heartRateBpm",
  "meanArterialPressureMmHg",
  "rightAtrialPressureMmHg",
  "cardiacOutputLMin",
  "strokeVolumeMl",
  "systemicVascularResistanceMmHgMinPerL",
  "meanSystemicFillingPressureMmHg",
  "venousResistanceMmHgMinPerL",
  "hemoglobinGdl",
  "paCO2MmHg",
  "paO2MmHg",
  "referenceAlveolarVentilationLMin"
];

const DEFAULT_MODEL_PARAMETERS = Object.freeze({
  oxygenTimeConstantSeconds: 10,
  carbonDioxideTimeConstantSeconds: 20,
  arterialPressureTimeConstantSeconds: 2,
  intrathoracicPressureCoupling: 0.18,
  minimumGasExchangeEfficiency: 0.02,
  maximumGasExchangeEfficiency: 1.0,
  minimumCircuitPatency: 0,
  maximumCircuitPatency: 1,
  minimumVasomotorFactor: 0.05,
  maximumVasomotorFactor: 3,
  maximumPreloadFactor: 1.8,
  maximumContractilityFactor: 2,
  oxygenDebtRecoveryFractionPerSecond: 0.01
});

export const PROJECT_HOPE_PROVENANCE = Object.freeze({
  source: "Project_Hope_Patient_Perspective_Provenance_v0.5.json",
  rules: {
    adultCpRespiratoryPlausibility: ["SRC-CP-ADMISSIONS-2020", "SRC-CP-ED-2021"],
    baselineOxygenationNotInferredFromMotorSeverity: ["SRC-LUNG-CP-2014"],
    dysphagiaIndividualised: ["SRC-CP-EATING-2022", "SRC-EDACS-ADULT-2021"],
    silentAspirationPossible: ["SRC-SILENT-ASP-2018"],
    positioningQualitativeOnly: ["SRC-POSITION-CP-2011"],
    directCommunicationAndSupporterRole: [
      "SRC-COMM-CP-2007",
      "SRC-CENTREPIECE-2008",
      "SRC-TIME-COMM-2011"
    ],
    documentationDriftPossible: ["SRC-DOCUMENTATION-2019"],
    patientConcernYellowZone: ["SRC-CEC-WORRY-2026", "SRC-CEC-EDOC-2026"],
    noIndividualPrognosisFromPopulationMortality: ["SRC-CP-RESP-MORT-2019"]
  },
  constraints: [
    "Baseline physiology must be provided explicitly and must not be inferred from disability severity.",
    "Positioning effects are scenario inputs and qualitative modifiers, not fixed oxygenation gains.",
    "Aspiration may be represented when evidence supports it but is never the default explanation for cerebral palsy.",
    "Population mortality evidence must never determine an individual treatment ceiling or prognosis.",
    "Communication access and patient authority remain separate from physiological state."
  ]
});

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function assertFinitePositive(value, field) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${field} must be a finite number greater than zero.`);
  }
}

export function validateBaseline(baseline) {
  if (!baseline || typeof baseline !== "object") {
    throw new TypeError("An explicit baseline object is required.");
  }

  for (const field of REQUIRED_BASELINE_FIELDS) {
    assertFinitePositive(baseline[field], `baseline.${field}`);
  }

  const expectedStrokeVolume = (baseline.cardiacOutputLMin * 1000) / baseline.heartRateBpm;
  const relativeDifference = Math.abs(expectedStrokeVolume - baseline.strokeVolumeMl) / baseline.strokeVolumeMl;
  if (relativeDifference > 0.25) {
    throw new RangeError(
      "baseline.strokeVolumeMl is inconsistent with baseline cardiacOutputLMin and heartRateBpm by more than 25%."
    );
  }

  return true;
}

export function oxygenSaturationFromPaO2(paO2MmHg) {
  const p = Math.max(0, paO2MmHg);
  const n = 2.7;
  const p50 = 26.8;
  if (p === 0) return 0;
  return clamp((p ** n) / (p50 ** n + p ** n), 0, 1);
}

export function arterialOxygenContentMlDl({ hemoglobinGdl, oxygenSaturationFraction, paO2MmHg }) {
  return (
    O2_BINDING_ML_PER_G_HB * hemoglobinGdl * clamp(oxygenSaturationFraction, 0, 1) +
    DISSOLVED_O2_ML_DL_PER_MMHG * Math.max(0, paO2MmHg)
  );
}

export function createBiomedicalState({ baseline, initial = {}, parameters = {} }) {
  validateBaseline(baseline);
  const modelParameters = { ...DEFAULT_MODEL_PARAMETERS, ...parameters };
  const initialSaturation = oxygenSaturationFromPaO2(initial.paO2MmHg ?? baseline.paO2MmHg);
  const baselineOxygenContent = arterialOxygenContentMlDl({
    hemoglobinGdl: baseline.hemoglobinGdl,
    oxygenSaturationFraction: oxygenSaturationFromPaO2(baseline.paO2MmHg),
    paO2MmHg: baseline.paO2MmHg
  });
  const referenceOxygenDeliveryMlMin = baseline.cardiacOutputLMin * 10 * baselineOxygenContent;

  return {
    modelVersion: BIOMEDICAL_MODEL_VERSION,
    timeSeconds: 0,
    baseline: { ...baseline },
    parameters: modelParameters,
    provenance: PROJECT_HOPE_PROVENANCE,
    rhythm: initial.rhythm ?? "sinus",
    electricalRateBpm: initial.electricalRateBpm ?? baseline.heartRateBpm,
    contractilityFactor: initial.contractilityFactor ?? 1,
    paO2MmHg: initial.paO2MmHg ?? baseline.paO2MmHg,
    paCO2MmHg: initial.paCO2MmHg ?? baseline.paCO2MmHg,
    oxygenSaturationFraction: initialSaturation,
    meanArterialPressureMmHg: initial.meanArterialPressureMmHg ?? baseline.meanArterialPressureMmHg,
    rightAtrialPressureMmHg: initial.rightAtrialPressureMmHg ?? baseline.rightAtrialPressureMmHg,
    venousReturnLMin: initial.venousReturnLMin ?? baseline.cardiacOutputLMin,
    strokeVolumeMl: initial.strokeVolumeMl ?? baseline.strokeVolumeMl,
    nativeCardiacOutputLMin: initial.nativeCardiacOutputLMin ?? baseline.cardiacOutputLMin,
    effectiveSystemicFlowLMin: initial.effectiveSystemicFlowLMin ?? baseline.cardiacOutputLMin,
    arterialOxygenContentMlDl: initial.arterialOxygenContentMlDl ?? baselineOxygenContent,
    oxygenDeliveryMlMin: initial.oxygenDeliveryMlMin ?? referenceOxygenDeliveryMlMin,
    referenceOxygenDeliveryMlMin,
    oxygenDebtIndex: initial.oxygenDebtIndex ?? 0,
    mechanicalCirculationPresent: initial.mechanicalCirculationPresent ?? true,
    lastInputs: null,
    observables: null,
    audit: []
  };
}

export function calculateVentilationTargets(state, ventilation) {
  const { baseline, parameters } = state;
  const rateBpm = Math.max(0, ventilation.rateBpm ?? 0);
  const tidalVolumeL = Math.max(0, ventilation.tidalVolumeL ?? 0);
  const deadSpaceL = Math.max(0, ventilation.deadSpaceL ?? 0);
  const circuitPatency = clamp(
    ventilation.circuitPatency ?? 1,
    parameters.minimumCircuitPatency,
    parameters.maximumCircuitPatency
  );
  const gasExchangeEfficiency = clamp(
    ventilation.gasExchangeEfficiency ?? 1,
    parameters.minimumGasExchangeEfficiency,
    parameters.maximumGasExchangeEfficiency
  );
  const fio2 = clamp(ventilation.fio2 ?? 0.21, 0.21, 1);
  const metabolicCO2Relative = Math.max(0.05, ventilation.metabolicCO2Relative ?? 1);

  const alveolarVentilationLMin = rateBpm * Math.max(0, tidalVolumeL - deadSpaceL) * circuitPatency;
  const targetPaCO2MmHg = clamp(
    baseline.paCO2MmHg * metabolicCO2Relative *
      (baseline.referenceAlveolarVentilationLMin / Math.max(alveolarVentilationLMin, 0.05)),
    5,
    200
  );

  const alveolarOxygenMmHg = Math.max(
    0,
    fio2 * (SEA_LEVEL_BAROMETRIC_PRESSURE_MMHG - WATER_VAPOUR_PRESSURE_MMHG) -
      targetPaCO2MmHg / RESPIRATORY_QUOTIENT
  );
  const mixedVenousAnchorMmHg = 40;
  const targetPaO2MmHg = clamp(
    mixedVenousAnchorMmHg +
      (alveolarOxygenMmHg - mixedVenousAnchorMmHg) * gasExchangeEfficiency * circuitPatency,
    5,
    650
  );

  const meanAirwayPressureCmH2O = Math.max(
    0,
    (ventilation.peepCmH2O ?? 0) +
      (ventilation.inspiratoryPressureAbovePeepCmH2O ?? 0) *
        clamp(ventilation.inspiratoryDutyFraction ?? 0.33, 0, 1)
  );
  const intrathoracicPressureDeltaCmH2O =
    parameters.intrathoracicPressureCoupling * meanAirwayPressureCmH2O +
    (ventilation.patientPleuralPressureDeltaCmH2O ?? 0);

  return {
    alveolarVentilationLMin,
    targetPaCO2MmHg,
    targetPaO2MmHg,
    meanAirwayPressureCmH2O,
    intrathoracicPressureDeltaCmH2O,
    circuitPatency,
    gasExchangeEfficiency,
    fio2
  };
}

export function calculateCardiovascularTargets(state, cardiovascular, ventilationTargets) {
  const { baseline, parameters } = state;
  const volumeFactor = clamp(cardiovascular.volumeFactor ?? 1, 0.05, 2);
  const vasomotorFactor = clamp(
    cardiovascular.vasomotorFactor ?? 1,
    parameters.minimumVasomotorFactor,
    parameters.maximumVasomotorFactor
  );
  const contractilityFactor = clamp(
    cardiovascular.contractilityFactor ?? state.contractilityFactor,
    0,
    parameters.maximumContractilityFactor
  );

  const adjustedMeanSystemicFillingPressureMmHg = baseline.meanSystemicFillingPressureMmHg * volumeFactor;
  const rightAtrialPressureMmHg = Math.max(
    0,
    baseline.rightAtrialPressureMmHg + ventilationTargets.intrathoracicPressureDeltaCmH2O * 0.73556
  );
  const venousReturnLMin = Math.max(
    0,
    (adjustedMeanSystemicFillingPressureMmHg - rightAtrialPressureMmHg) /
      baseline.venousResistanceMmHgMinPerL
  );

  const preloadFactor = clamp(
    venousReturnLMin / Math.max(baseline.cardiacOutputLMin, EPSILON),
    0,
    parameters.maximumPreloadFactor
  );
  const systemicVascularResistanceMmHgMinPerL =
    baseline.systemicVascularResistanceMmHgMinPerL * vasomotorFactor;
  const afterloadFactor = Math.max(
    0.2,
    systemicVascularResistanceMmHgMinPerL / baseline.systemicVascularResistanceMmHgMinPerL
  );

  const electricalRateBpm =
    state.rhythm === "asystole"
      ? 0
      : Math.max(0, cardiovascular.electricalRateBpm ?? state.electricalRateBpm);

  const mechanicalContractility =
    state.rhythm === "pea" || state.rhythm === "asystole" ? 0 : contractilityFactor;

  const strokeVolumeMl =
    baseline.strokeVolumeMl *
    (preloadFactor ** 0.7) *
    mechanicalContractility /
    Math.sqrt(afterloadFactor);

  const nativeCardiacOutputLMin =
    state.rhythm === "pea" || state.rhythm === "asystole"
      ? 0
      : (electricalRateBpm * strokeVolumeMl) / 1000;

  const externalPerfusionLMin = Math.max(0, cardiovascular.externalPerfusionLMin ?? 0);
  const effectiveSystemicFlowLMin = nativeCardiacOutputLMin + externalPerfusionLMin;
  const targetMeanArterialPressureMmHg = Math.max(
    0,
    rightAtrialPressureMmHg + effectiveSystemicFlowLMin * systemicVascularResistanceMmHgMinPerL
  );

  return {
    volumeFactor,
    vasomotorFactor,
    contractilityFactor,
    electricalRateBpm,
    rightAtrialPressureMmHg,
    venousReturnLMin,
    preloadFactor,
    systemicVascularResistanceMmHgMinPerL,
    strokeVolumeMl,
    nativeCardiacOutputLMin,
    externalPerfusionLMin,
    effectiveSystemicFlowLMin,
    targetMeanArterialPressureMmHg
  };
}

function approach(current, target, dtSeconds, tauSeconds) {
  if (tauSeconds <= 0) return target;
  const alpha = 1 - Math.exp(-dtSeconds / tauSeconds);
  return current + (target - current) * alpha;
}

export function stepBiomedicalModel(state, inputs, dtSeconds = 0.1) {
  assertFinitePositive(dtSeconds, "dtSeconds");
  const ventilation = inputs?.ventilation ?? {};
  const cardiovascular = inputs?.cardiovascular ?? {};
  const ventilationTargets = calculateVentilationTargets(state, ventilation);
  const cardiovascularTargets = calculateCardiovascularTargets(state, cardiovascular, ventilationTargets);

  const paO2MmHg = approach(
    state.paO2MmHg,
    ventilationTargets.targetPaO2MmHg,
    dtSeconds,
    state.parameters.oxygenTimeConstantSeconds
  );
  const paCO2MmHg = approach(
    state.paCO2MmHg,
    ventilationTargets.targetPaCO2MmHg,
    dtSeconds,
    state.parameters.carbonDioxideTimeConstantSeconds
  );
  const oxygenSaturationFraction = oxygenSaturationFromPaO2(paO2MmHg);
  const meanArterialPressureMmHg = approach(
    state.meanArterialPressureMmHg,
    cardiovascularTargets.targetMeanArterialPressureMmHg,
    dtSeconds,
    state.parameters.arterialPressureTimeConstantSeconds
  );

  const arterialOxygenContent = arterialOxygenContentMlDl({
    hemoglobinGdl: state.baseline.hemoglobinGdl,
    oxygenSaturationFraction,
    paO2MmHg
  });
  const oxygenDeliveryMlMin =
    cardiovascularTargets.effectiveSystemicFlowLMin * 10 * arterialOxygenContent;
  const deliveryRatio = oxygenDeliveryMlMin / Math.max(state.referenceOxygenDeliveryMlMin, EPSILON);
  const debtAccumulation = Math.max(0, 1 - deliveryRatio) * dtSeconds;
  const debtRecovery =
    Math.max(0, deliveryRatio - 1) *
    state.parameters.oxygenDebtRecoveryFractionPerSecond *
    dtSeconds;
  const oxygenDebtIndex = Math.max(0, state.oxygenDebtIndex + debtAccumulation - debtRecovery);
  const mechanicalCirculationPresent = !(state.rhythm === "pea" || state.rhythm === "asystole");

  const observables = {
    respiratory: {
      alveolarVentilationLMin: ventilationTargets.alveolarVentilationLMin,
      paO2MmHg,
      paCO2MmHg,
      oxygenSaturationFraction,
      meanAirwayPressureCmH2O: ventilationTargets.meanAirwayPressureCmH2O,
      intrathoracicPressureDeltaCmH2O: ventilationTargets.intrathoracicPressureDeltaCmH2O,
      circuitPatency: ventilationTargets.circuitPatency,
      gasExchangeEfficiency: ventilationTargets.gasExchangeEfficiency
    },
    cardiovascular: {
      rhythm: state.rhythm,
      electricalRateBpm: cardiovascularTargets.electricalRateBpm,
      mechanicalCirculationPresent,
      rightAtrialPressureMmHg: cardiovascularTargets.rightAtrialPressureMmHg,
      venousReturnLMin: cardiovascularTargets.venousReturnLMin,
      strokeVolumeMl: cardiovascularTargets.strokeVolumeMl,
      nativeCardiacOutputLMin: cardiovascularTargets.nativeCardiacOutputLMin,
      externalPerfusionLMin: cardiovascularTargets.externalPerfusionLMin,
      effectiveSystemicFlowLMin: cardiovascularTargets.effectiveSystemicFlowLMin,
      meanArterialPressureMmHg,
      systemicVascularResistanceMmHgMinPerL:
        cardiovascularTargets.systemicVascularResistanceMmHgMinPerL
    },
    oxygenTransport: {
      arterialOxygenContentMlDl: arterialOxygenContent,
      oxygenDeliveryMlMin,
      referenceOxygenDeliveryMlMin: state.referenceOxygenDeliveryMlMin,
      deliveryRatio,
      oxygenDebtIndex
    }
  };

  return {
    ...state,
    timeSeconds: state.timeSeconds + dtSeconds,
    electricalRateBpm: cardiovascularTargets.electricalRateBpm,
    contractilityFactor: cardiovascularTargets.contractilityFactor,
    paO2MmHg,
    paCO2MmHg,
    oxygenSaturationFraction,
    meanArterialPressureMmHg,
    rightAtrialPressureMmHg: cardiovascularTargets.rightAtrialPressureMmHg,
    venousReturnLMin: cardiovascularTargets.venousReturnLMin,
    strokeVolumeMl: cardiovascularTargets.strokeVolumeMl,
    nativeCardiacOutputLMin: cardiovascularTargets.nativeCardiacOutputLMin,
    effectiveSystemicFlowLMin: cardiovascularTargets.effectiveSystemicFlowLMin,
    arterialOxygenContentMlDl: arterialOxygenContent,
    oxygenDeliveryMlMin,
    oxygenDebtIndex,
    mechanicalCirculationPresent,
    lastInputs: JSON.parse(JSON.stringify(inputs ?? {})),
    observables
  };
}

export function applyCardiovascularEvent(state, event) {
  if (!event || typeof event !== "object") {
    throw new TypeError("A cardiovascular event object is required.");
  }

  const eventType = String(event.type ?? "").toUpperCase();
  let patch;

  if (eventType === "PEA") {
    patch = {
      rhythm: "pea",
      electricalRateBpm: Math.max(1, event.electricalRateBpm ?? state.electricalRateBpm),
      contractilityFactor: 0,
      mechanicalCirculationPresent: false
    };
  } else if (eventType === "ASYSTOLE") {
    patch = {
      rhythm: "asystole",
      electricalRateBpm: 0,
      contractilityFactor: 0,
      mechanicalCirculationPresent: false
    };
  } else if (eventType === "ROSC") {
    if (!Number.isFinite(event.electricalRateBpm) || event.electricalRateBpm <= 0) {
      throw new TypeError("ROSC requires a scenario-provided electricalRateBpm greater than zero.");
    }
    if (!Number.isFinite(event.contractilityFactor) || event.contractilityFactor <= 0) {
      throw new TypeError("ROSC requires a scenario-provided contractilityFactor greater than zero.");
    }
    patch = {
      rhythm: "rosc",
      electricalRateBpm: event.electricalRateBpm,
      contractilityFactor: clamp(event.contractilityFactor, 0, state.parameters.maximumContractilityFactor),
      mechanicalCirculationPresent: true
    };
  } else if (eventType === "SINUS") {
    patch = {
      rhythm: "sinus",
      electricalRateBpm: event.electricalRateBpm ?? state.baseline.heartRateBpm,
      contractilityFactor: clamp(event.contractilityFactor ?? 1, 0, state.parameters.maximumContractilityFactor),
      mechanicalCirculationPresent: true
    };
  } else {
    throw new RangeError(`Unsupported cardiovascular event: ${eventType || "<missing>"}`);
  }

  return {
    ...state,
    ...patch,
    audit: [
      ...state.audit,
      {
        timeSeconds: state.timeSeconds,
        type: "CARDIOVASCULAR_EVENT",
        event: eventType,
        source: event.source ?? "scenario-engine",
        note: event.note ?? null
      }
    ]
  };
}

export function runBiomedicalSimulation({ state, inputs, durationSeconds, dtSeconds = 0.1 }) {
  assertFinitePositive(durationSeconds, "durationSeconds");
  assertFinitePositive(dtSeconds, "dtSeconds");

  let current = state;
  const samples = [];
  const steps = Math.ceil(durationSeconds / dtSeconds);
  for (let i = 0; i < steps; i += 1) {
    current = stepBiomedicalModel(current, inputs, dtSeconds);
    samples.push(current);
  }
  return { state: current, samples };
}
