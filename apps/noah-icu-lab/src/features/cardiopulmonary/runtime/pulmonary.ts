/**
 * NOAH cardiopulmonary teaching model — synthetic adult physiology.
 *
 * Two parallel lung compartments + common airway resistance. No patient-specific
 * calibration, triggering, spontaneous breathing controller or clinical prediction.
 * Positive muscle effort is phase-locked to the machine's mandatory inspiration.
 * All gas kinetics and cardiovascular coefficients are illustrative assumptions.
 */

export interface VentSettings {
  mode: 'PC' | 'VC';
  airway: 'tracheostomy' | 'ett' | 'mask';
  ventilationSource?: 'ventilator' | 'manual-bag';
  fio2: number;
  peep: number;
  rate: number;
  inspiratoryTime: number;
  pressureControl: number;
  tidalVolumeMl: number;
  pressureLimit: number;
}

export interface LungParameters {
  complianceMlPerCmH2O: number;
  resistanceCmH2OPerLPerSec: number;
  leftComplianceFraction: number;
  deadSpaceMl: number;
  shuntFraction: number;
  muscleEffortCmH2O: number;
  co2ProductionMlMin: number;
  cardiacReserve: number;
  secretionBurden: number;
  leakFraction: number;
  disconnected: boolean;
  hemoglobinGdl: number;
  circulationState?: 'perfusing' | 'arrest';
  compressionsActive?: boolean;
  compressionRate?: number;
  compressionDepthMm?: number;
  compressionRecoilFraction?: number;
}

export interface Metrics {
  spo2: number;
  paO2: number;
  paCO2: number;
  etCO2: number | null;
  pH: number;
  heartRate: number;
  map: number;
  systolicBP: number;
  diastolicBP: number;
  cardiacOutput: number;
  tidalVolumeMl: number;
  minuteVentilation: number;
  alveolarVentilation: number;
  peakPressure: number;
  elasticPressure: number;
  meanAirwayPressure: number;
  autoPEEP: number;
  pressure: number;
  /** Circuit sensor flow, L/min; positive = inspiration. */
  flow: number;
  /** Instantaneous inflation above the current breath's end-expiratory volume. */
  volumeMl: number;
  leftVolumeMl: number;
  rightVolumeMl: number;
  oxygenDelivery: number;
  respiratoryRate: number;
  /** True model lung excursion, distinct from the simulated circuit sensor. */
  actualTidalVolumeMl: number;
  manualRespiratoryRate: number;
  intrinsicCardiacOutput: number;
  compressionFlow: number;
  compressionActive: boolean;
  spontaneousPulsePresent: boolean;
  pulseOximeterAvailable: boolean;
}

export interface WaveSample {
  time: number;
  pressure: number;
  flow: number;
  volumeMl: number;
  co2: number | null;
  /** Illustrative sinus ECG, not an electrophysiology model. */
  ecg: number;
  /** Compression motion artifact amplitude; not an intrinsic cardiac beat. */
  compression?: number;
}

interface BreathAccumulator {
  inspirationMl: number;
  expirationMl: number;
  maximumPressure: number;
  pressureIntegral: number;
  duration: number;
  startVolumeL: number;
  endExpirationPressure: number;
  pressureLimited: boolean;
}

export interface ModelState {
  modelVersion: 'noah-physiology-0.3';
  time: number;
  tick: number;
  remainderSeconds: number;
  phase: 'inspiration' | 'expiration';
  /** Elapsed seconds in the current machine cycle. */
  cycleTime: number;
  completedBreaths: number;
  leftVolumeL: number;
  rightVolumeL: number;
  cardiacPhase: number;
  /** True if this breath reached the simulator's configured pressure cap. */
  pressureLimited: boolean;
  ventilationSource: 'ventilator' | 'manual-bag';
  manualBreathActive: boolean;
  manualBreathCount: number;
  manualCycleOpen: boolean;
  manualModeStartedAt: number;
  manualTriggerTimes: number[];
  manualBreaths: { time: number; actualVolumeMl: number; measuredVolumeMl: number }[];
  compressionPhase: number;
  compressionCount: number;
  metrics: Metrics;
  history: WaveSample[];
  breath: BreathAccumulator;
}

export const DEFAULT_SETTINGS: VentSettings = {
  mode: 'PC', airway: 'tracheostomy', ventilationSource: 'ventilator', fio2: 0.35, peep: 5, rate: 16,
  inspiratoryTime: 1, pressureControl: 12, tidalVolumeMl: 420, pressureLimit: 35,
};

export const DEFAULT_PARAMETERS: LungParameters = {
  complianceMlPerCmH2O: 38, resistanceCmH2OPerLPerSec: 8,
  leftComplianceFraction: 0.48, deadSpaceMl: 150, shuntFraction: 0.08,
  muscleEffortCmH2O: 0, co2ProductionMlMin: 200, cardiacReserve: 1,
  secretionBurden: 0.1, leakFraction: 0, disconnected: false, hemoglobinGdl: 12,
  circulationState: 'perfusing', compressionsActive: false, compressionRate: 110,
  compressionDepthMm: 55, compressionRecoilFraction: 1,
};

export const MODEL_STEP_SECONDS = 0.01;
export const MAX_HISTORY_SAMPLES = 1200; // 60 seconds at 20 Hz.
const CO2_BUFFER_L = 20; // Illustrative CO2 capacitance, not fitted to a patient.

function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
function bounded(value: unknown, fallback: number, minimum: number, maximum: number): number {
  return clamp(finite(value, fallback), minimum, maximum);
}
function approach(value: number, target: number, tauSeconds: number, dt: number): number {
  return target + (value - target) * Math.exp(-dt / tauSeconds);
}

/** Bounds are software sandbox limits. They are not clinical recommendations. */
export function normalizeSettings(input: Partial<VentSettings> = {}): VentSettings {
  const safe = input && typeof input === 'object' ? input : {};
  const rate = bounded(safe.rate, DEFAULT_SETTINGS.rate, 4, 40);
  const peep = bounded(safe.peep, DEFAULT_SETTINGS.peep, 0, 20);
  const ventilationSource = safe.ventilationSource === 'manual-bag' ? 'manual-bag' : 'ventilator';
  return {
    mode: safe.mode === 'VC' ? 'VC' : 'PC',
    airway: safe.airway === 'mask' && ventilationSource === 'manual-bag' ? 'mask' : safe.airway === 'ett' ? 'ett' : 'tracheostomy',
    ventilationSource,
    fio2: bounded(safe.fio2, DEFAULT_SETTINGS.fio2, 0.21, 1),
    peep, rate,
    inspiratoryTime: bounded(safe.inspiratoryTime, DEFAULT_SETTINGS.inspiratoryTime, 0.3, ventilationSource === 'manual-bag' ? 2.5 : Math.min(2.5, 60 / rate - 0.25)),
    pressureControl: bounded(safe.pressureControl, DEFAULT_SETTINGS.pressureControl, 2, 35),
    tidalVolumeMl: bounded(safe.tidalVolumeMl, DEFAULT_SETTINGS.tidalVolumeMl, 100, 900),
    pressureLimit: bounded(safe.pressureLimit, DEFAULT_SETTINGS.pressureLimit, Math.max(10, peep + 2), 60),
  };
}

export function normalizeParameters(input: Partial<LungParameters> = {}): LungParameters {
  const safe = input && typeof input === 'object' ? input : {};
  return {
    complianceMlPerCmH2O: bounded(safe.complianceMlPerCmH2O, 38, 10, 100),
    resistanceCmH2OPerLPerSec: bounded(safe.resistanceCmH2OPerLPerSec, 8, 2, 60),
    leftComplianceFraction: bounded(safe.leftComplianceFraction, 0.48, 0.2, 0.8),
    deadSpaceMl: bounded(safe.deadSpaceMl, 150, 50, 400),
    shuntFraction: bounded(safe.shuntFraction, 0.08, 0, 0.65),
    muscleEffortCmH2O: bounded(safe.muscleEffortCmH2O, 0, 0, 15),
    co2ProductionMlMin: bounded(safe.co2ProductionMlMin, 200, 100, 500),
    cardiacReserve: bounded(safe.cardiacReserve, 1, 0.25, 1.4),
    secretionBurden: bounded(safe.secretionBurden, 0.1, 0, 1),
    leakFraction: bounded(safe.leakFraction, 0, 0, 0.95),
    disconnected: safe.disconnected === true,
    hemoglobinGdl: bounded(safe.hemoglobinGdl, 12, 6, 18),
    circulationState: safe.circulationState === 'arrest' ? 'arrest' : 'perfusing',
    compressionsActive: safe.compressionsActive === true,
    compressionRate: bounded(safe.compressionRate, 110, 60, 160),
    compressionDepthMm: bounded(safe.compressionDepthMm, 55, 20, 70),
    compressionRecoilFraction: bounded(safe.compressionRecoilFraction, 1, 0, 1),
  };
}

function circuitDisconnected(s: VentSettings, p: LungParameters): boolean {
  return p.disconnected && s.ventilationSource !== 'manual-bag';
}

function saturation(po2: number): number {
  const p = clamp(po2, 0, 713);
  return Math.pow(p, 2.7) / (Math.pow(26.8, 2.7) + Math.pow(p, 2.7));
}
function oxygenContent(po2: number, hemoglobin: number): number {
  return 1.34 * hemoglobin * saturation(po2) + 0.0031 * po2;
}
function po2ForContent(content: number, hemoglobin: number): number {
  let lo = 0, hi = 713;
  for (let i = 0; i < 16; i += 1) {
    const mid = (lo + hi) / 2;
    if (oxygenContent(mid, hemoglobin) < content) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
function ecgAt(phase: number): number {
  const bell = (centre: number, width: number, amplitude: number) =>
    amplitude * Math.exp(-Math.pow((phase - centre) / width, 2));
  return bell(0.16, 0.045, 0.12) + bell(0.34, 0.016, -0.15) +
    bell(0.37, 0.012, 1.1) + bell(0.40, 0.018, -0.25) + bell(0.66, 0.08, 0.28);
}

function emptyBreath(startVolumeL: number, pressure: number): BreathAccumulator {
  return {
    inspirationMl: 0, expirationMl: 0, maximumPressure: pressure,
    pressureIntegral: 0, duration: 0, startVolumeL,
    endExpirationPressure: pressure, pressureLimited: false,
  };
}

export function createModel(
  settingsInput: Partial<VentSettings> = DEFAULT_SETTINGS,
  parametersInput: Partial<LungParameters> = DEFAULT_PARAMETERS,
): ModelState {
  const s = normalizeSettings(settingsInput), p = normalizeParameters(parametersInput);
  const disconnected = circuitDisconnected(s, p);
  const manual = s.ventilationSource === 'manual-bag';
  const arrest = p.circulationState === 'arrest';
  const c = p.complianceMlPerCmH2O / 1000;
  const resistance = p.resistanceCmH2OPerLPerSec * (1 + 4 * p.secretionBurden);
  const pressure = Math.min(s.pressureControl, s.pressureLimit - s.peep);
  const estimate = s.mode === 'VC' ? Math.min(s.tidalVolumeMl, pressure * c * 1000) :
    pressure * c * 1000 * (1 - Math.exp(-s.inspiratoryTime / (resistance * c)));
  const actualTidalVolumeMl = disconnected || manual ? 0 : estimate * (1 - p.leakFraction);
  const vt = actualTidalVolumeMl * (1 - p.leakFraction);
  const alveolarVentilation = Math.max(0, actualTidalVolumeMl - p.deadSpaceMl) * s.rate / 1000;
  const paCO2 = 44, paO2 = 90;
  const co = arrest ? 0 : 5 * p.cardiacReserve;
  const map = 5 + co * 14;
  const leftVolumeL = c * p.leftComplianceFraction * s.peep;
  const rightVolumeL = c * (1 - p.leftComplianceFraction) * s.peep;
  const metrics: Metrics = {
    spo2: saturation(paO2) * 100, paO2, paCO2, etCO2: disconnected || manual ? null : arrest ? 0 : 40,
    pH: 6.1 + Math.log10(24 / (0.03 * paCO2)), heartRate: arrest ? 0 : 84, map,
    systolicBP: arrest ? map : map + 28, diastolicBP: arrest ? map : map - 14, cardiacOutput: co,
    tidalVolumeMl: vt, actualTidalVolumeMl, minuteVentilation: vt * s.rate / 1000,
    alveolarVentilation, peakPressure: s.peep + pressure,
    elasticPressure: s.peep + actualTidalVolumeMl / p.complianceMlPerCmH2O,
    meanAirwayPressure: s.peep + pressure * s.inspiratoryTime / (60 / s.rate),
    autoPEEP: 0, pressure: disconnected || manual ? 0 : s.peep, flow: 0,
    volumeMl: 0, leftVolumeMl: 0, rightVolumeMl: 0,
    oxygenDelivery: co * oxygenContent(paO2, p.hemoglobinGdl) * 10,
    respiratoryRate: manual ? 0 : s.rate, manualRespiratoryRate: 0,
    intrinsicCardiacOutput: co, compressionFlow: 0, compressionActive: false,
    spontaneousPulsePresent: !arrest, pulseOximeterAvailable: !arrest,
  };
  return {
    modelVersion: 'noah-physiology-0.3', time: 0, tick: 0, remainderSeconds: 0,
    phase: manual ? 'expiration' : 'inspiration', cycleTime: 0, completedBreaths: 0,
    leftVolumeL, rightVolumeL, cardiacPhase: 0, pressureLimited: false,
    ventilationSource: manual ? 'manual-bag' : 'ventilator',
    manualBreathActive: false, manualBreathCount: 0, manualCycleOpen: false,
    manualModeStartedAt: 0, manualTriggerTimes: [], manualBreaths: [], compressionPhase: 0, compressionCount: 0,
    metrics, history: [], breath: emptyBreath(leftVolumeL + rightVolumeL, manual ? 0 : s.peep),
  };
}

function cloneSafeState(input: ModelState, s: VentSettings, p: LungParameters): ModelState {
  const base = createModel(s, p);
  if (!input || typeof input !== 'object' || !input.metrics || !input.breath) return base;
  const result = { ...input, metrics: { ...input.metrics }, breath: { ...input.breath }, history: [] as WaveSample[] };
  for (const key of Object.keys(base.metrics) as (keyof Metrics)[]) {
    if (key === 'etCO2') result.metrics[key] = input.metrics[key] === null ? null : bounded(input.metrics[key], 40, 0, 180);
    else if (key === 'compressionActive' || key === 'spontaneousPulsePresent' || key === 'pulseOximeterAvailable') result.metrics[key] = typeof input.metrics[key] === 'boolean' ? input.metrics[key] : base.metrics[key];
    else result.metrics[key] = finite(input.metrics[key], base.metrics[key] as number);
  }
  result.tick = Math.floor(bounded(input.tick, 0, 0, 1e9));
  result.time = result.tick * MODEL_STEP_SECONDS;
  result.remainderSeconds = bounded(input.remainderSeconds, 0, 0, MODEL_STEP_SECONDS);
  result.cycleTime = bounded(input.cycleTime, 0, 0, input.ventilationSource === 'manual-bag' ? 86400 : 60 / s.rate);
  result.completedBreaths = Math.floor(bounded(input.completedBreaths, 0, 0, 1e8));
  result.leftVolumeL = bounded(input.leftVolumeL, base.leftVolumeL, 0, 4);
  result.rightVolumeL = bounded(input.rightVolumeL, base.rightVolumeL, 0, 4);
  result.cardiacPhase = bounded(input.cardiacPhase, 0, 0, 1);
  result.ventilationSource = input.ventilationSource === 'manual-bag' ? 'manual-bag' : 'ventilator';
  result.manualBreathActive = input.manualBreathActive === true;
  result.manualCycleOpen = input.manualCycleOpen === true;
  result.manualBreathCount = Math.floor(bounded(input.manualBreathCount, 0, 0, 1e8));
  result.manualModeStartedAt = bounded(input.manualModeStartedAt, result.time, 0, result.time);
  result.manualTriggerTimes = Array.isArray(input.manualTriggerTimes) ? input.manualTriggerTimes.filter(value => Number.isFinite(value) && value >= result.time - 60 && value <= result.time).slice(-200) : [];
  result.manualBreaths = Array.isArray(input.manualBreaths) ? input.manualBreaths.filter(value => value && [value.time, value.actualVolumeMl, value.measuredVolumeMl].every(Number.isFinite) && value.time >= result.time - 60 && value.time <= result.time).slice(-200).map(value => ({ ...value })) : [];
  result.compressionPhase = bounded(input.compressionPhase, 0, 0, 1);
  result.compressionCount = Math.floor(bounded(input.compressionCount, 0, 0, 1e9));
  for (const key of Object.keys(base.breath) as (keyof BreathAccumulator)[]) {
    if (key === 'pressureLimited') result.breath[key] = input.breath[key] === true;
    else result.breath[key] = bounded(input.breath[key], base.breath[key] as number, 0, 1e6);
  }
  result.metrics.paCO2 = clamp(result.metrics.paCO2, 15, 180);
  result.metrics.paO2 = clamp(result.metrics.paO2, 5, 713);
  result.metrics.cardiacOutput = clamp(result.metrics.cardiacOutput, 0, 12);
  result.metrics.intrinsicCardiacOutput = clamp(result.metrics.intrinsicCardiacOutput, 0, 12);
  result.metrics.compressionFlow = clamp(result.metrics.compressionFlow, 0, 4);
  result.metrics.heartRate = clamp(result.metrics.heartRate, 40, 180);
  result.metrics.map = clamp(result.metrics.map, 0, 180);
  result.metrics.alveolarVentilation = clamp(result.metrics.alveolarVentilation, 0, 45);
  if (Array.isArray(input.history)) result.history = input.history.slice(-MAX_HISTORY_SAMPLES).filter(sample =>
    sample && [sample.time, sample.pressure, sample.flow, sample.volumeMl, sample.ecg].every(Number.isFinite) &&
    (sample.co2 === null || Number.isFinite(sample.co2)),
  ).map(sample => ({ ...sample }));
  result.modelVersion = 'noah-physiology-0.3';
  return result;
}

function completeBreath(state: ModelState, s: VentSettings, p: LungParameters): void {
  const b = state.breath, m = state.metrics;
  const disconnected = circuitDisconnected(s, p);
  const actual = disconnected ? 0 : Math.max(0, Math.min(b.inspirationMl, b.expirationMl));
  m.actualTidalVolumeMl = actual;
  m.tidalVolumeMl = actual * (1 - p.leakFraction);
  m.minuteVentilation = m.tidalVolumeMl * s.rate / 1000;
  m.alveolarVentilation = Math.max(0, actual - p.deadSpaceMl) * s.rate / 1000;
  m.peakPressure = b.maximumPressure;
  m.meanAirwayPressure = b.duration > 0 ? b.pressureIntegral / b.duration : s.peep;
  m.autoPEEP = disconnected ? 0 : Math.max(0, b.endExpirationPressure - s.peep);
  m.elasticPressure = disconnected ? 0 : s.peep + m.autoPEEP + actual / p.complianceMlPerCmH2O;
  state.completedBreaths += 1;
  state.pressureLimited = b.pressureLimited;
  if (s.ventilationSource === 'manual-bag') {
    state.manualBreaths.push({ time: state.time, actualVolumeMl: actual, measuredVolumeMl: m.tidalVolumeMl });
    state.manualCycleOpen = false;
  }
  state.breath = emptyBreath(state.leftVolumeL + state.rightVolumeL, disconnected ? 0 : s.peep);
}

function selectSource(state: ModelState, s: VentSettings): void {
  const source = s.ventilationSource === 'manual-bag' ? 'manual-bag' : 'ventilator';
  if (source === state.ventilationSource) return;
  state.ventilationSource = source;
  state.cycleTime = 0;
  state.manualBreathActive = false;
  state.manualCycleOpen = false;
  state.manualModeStartedAt = state.time;
  state.manualTriggerTimes = [];
  state.manualBreaths = [];
  state.breath = emptyBreath(state.leftVolumeL + state.rightVolumeL, s.peep);
  // Discard stale prior-source delivery estimates. Gas concentrations are preserved.
  state.metrics.tidalVolumeMl = 0;
  state.metrics.actualTidalVolumeMl = 0;
  state.metrics.minuteVentilation = 0;
  state.metrics.alveolarVentilation = 0;
  state.metrics.manualRespiratoryRate = 0;
}

function updateManualVentilation(state: ModelState, p: LungParameters): void {
  const cutoff = state.time - 60;
  state.manualBreaths = state.manualBreaths.filter(breath => breath.time > cutoff);
  state.manualTriggerTimes = state.manualTriggerTimes.filter(time => time > cutoff);
  const windowSeconds = clamp(state.time - state.manualModeStartedAt, 10, 60);
  const currentActual = state.manualCycleOpen ? state.breath.inspirationMl : 0;
  const currentMeasured = state.manualCycleOpen ? state.breath.expirationMl * (1 - p.leakFraction) : 0;
  const allMeasured = state.manualBreaths.reduce((sum, breath) => sum + breath.measuredVolumeMl, 0) + currentMeasured;
  const allAlveolar = state.manualBreaths.reduce((sum, breath) => sum + Math.max(0, breath.actualVolumeMl - p.deadSpaceMl), 0) + Math.max(0, currentActual - p.deadSpaceMl);
  state.metrics.minuteVentilation = allMeasured / 1000 * 60 / windowSeconds;
  state.metrics.alveolarVentilation = allAlveolar / 1000 * 60 / windowSeconds;
  state.metrics.manualRespiratoryRate = state.manualTriggerTimes.length * 60 / windowSeconds;
  state.metrics.respiratoryRate = state.metrics.manualRespiratoryRate;
  if (state.manualCycleOpen) {
    state.metrics.actualTidalVolumeMl = currentActual;
    state.metrics.tidalVolumeMl = currentMeasured;
  }
}

function syncCirculationState(state: ModelState, s: VentSettings, p: LungParameters): void {
  const m = state.metrics, arrest = p.circulationState === 'arrest';
  const restoring = !arrest && m.spontaneousPulsePresent === false;
  if (arrest) {
    m.intrinsicCardiacOutput = 0;
    m.heartRate = 0;
    m.cardiacOutput = m.compressionFlow;
    if (m.etCO2 !== null && m.cardiacOutput === 0) m.etCO2 = 0;
  } else {
    if (restoring) {
      // This is a deliberate facilitator restoration, never an engine outcome.
      // Restore partial synthetic forward flow without normalizing blood gases.
      m.intrinsicCardiacOutput = Math.max(0.5, 2.5 * p.cardiacReserve);
      m.heartRate = 84;
    }
    m.compressionFlow = 0;
    m.cardiacOutput = m.intrinsicCardiacOutput;
  }
  m.spontaneousPulsePresent = !arrest;
  m.pulseOximeterAvailable = !arrest;
  m.compressionActive = arrest && p.compressionsActive === true && !(s.ventilationSource === 'manual-bag' && s.airway === 'mask' && state.manualBreathActive);
  m.oxygenDelivery = m.cardiacOutput * oxygenContent(m.paO2, p.hemoglobinGdl) * 10;
}

/** Requests one manual inspiration. No gas, volume or circulation is reset. */
export function deliverManualBreath(
  input: ModelState,
  settingsInput: Partial<VentSettings>,
  parametersInput: Partial<LungParameters>,
): ModelState {
  const s = normalizeSettings(settingsInput), p = normalizeParameters(parametersInput);
  const state = cloneSafeState(input, s, p);
  if (s.ventilationSource !== 'manual-bag') return state;
  selectSource(state, s);
  syncCirculationState(state, s, p);
  // Natural-airway mask ventilation belongs in a compression pause. Existing ETT
  // and tracheostomy routes can be ventilated while compressions continue.
  if (s.airway === 'mask' && p.circulationState === 'arrest' && p.compressionsActive) return state;
  if (state.manualBreathActive) return state;
  if (state.manualCycleOpen) completeBreath(state, s, p);
  state.cycleTime = 0;
  state.manualBreathActive = true;
  state.manualCycleOpen = true;
  state.manualBreathCount += 1;
  state.manualTriggerTimes.push(state.time);
  state.phase = 'inspiration';
  state.breath = emptyBreath(state.leftVolumeL + state.rightVolumeL, s.peep);
  return state;
}

function integrate(state: ModelState, s: VentSettings, p: LungParameters): void {
  const dt = MODEL_STEP_SECONDS, period = 60 / s.rate;
  const manual = s.ventilationSource === 'manual-bag';
  const disconnected = circuitDisconnected(s, p);
  if (!manual && state.cycleTime >= period - 1e-9) {
    completeBreath(state, s, p);
    state.cycleTime = Math.max(0, state.cycleTime - period);
  }
  if (manual && state.cycleTime >= s.inspiratoryTime - 1e-9) state.manualBreathActive = false;
  const inspiring = manual ? state.manualBreathActive : state.cycleTime < s.inspiratoryTime - 1e-9;
  state.phase = inspiring ? 'inspiration' : 'expiration';
  const cTotal = p.complianceMlPerCmH2O / 1000;
  const cL = cTotal * p.leftComplianceFraction, cR = cTotal * (1 - p.leftComplianceFraction);
  const rTotal = p.resistanceCmH2OPerLPerSec * (1 + 4 * p.secretionBurden);
  const rCommon = rTotal * 0.3, rBranch = rTotal * 1.4;
  // Implicit Euler solves the R-C network without an unstable explicit pressure step.
  const gL = 1 / (rBranch + dt / cL), gR = 1 / (rBranch + dt / cR);
  const muscle = inspiring && !disconnected && p.circulationState !== 'arrest' ?
    p.muscleEffortCmH2O * Math.sin(Math.PI * state.cycleTime / s.inspiratoryTime) : 0;
  const oldElasticL = state.leftVolumeL / cL - muscle;
  const oldElasticR = state.rightVolumeL / cR - muscle;
  const gain = gL + gR, offset = gL * oldElasticL + gR * oldElasticR;
  let sourcePressure: number;
  let qL: number;
  let qR: number;
  let pressureLimited = false;
  if (inspiring && s.mode === 'VC' && !manual && !disconnected) {
    const requestedFlow = (s.tidalVolumeMl / 1000 / s.inspiratoryTime) * (1 - p.leakFraction);
    const requiredNode = (requestedFlow + offset) / gain;
    const requiredSource = requiredNode + rCommon * requestedFlow;
    sourcePressure = Math.min(s.pressureLimit, Math.max(s.peep, requiredSource));
    pressureLimited = requiredSource > s.pressureLimit + 0.001;
  } else {
    const requested = disconnected ? 0 : s.peep + (inspiring ? s.pressureControl * (1 - p.leakFraction) : 0);
    sourcePressure = Math.min(s.pressureLimit, requested);
    pressureLimited = requested > s.pressureLimit + 0.001;
  }
  const qTotal = (sourcePressure * gain - offset) / (1 + rCommon * gain);
  const node = sourcePressure - rCommon * qTotal;
  qL = gL * (node - oldElasticL);
  qR = gR * (node - oldElasticR);
  const prevTotal = state.leftVolumeL + state.rightVolumeL;
  state.leftVolumeL = clamp(state.leftVolumeL + dt * qL, 0, 4);
  state.rightVolumeL = clamp(state.rightVolumeL + dt * qR, 0, 4);
  const actualFlow = (state.leftVolumeL + state.rightVolumeL - prevTotal) / dt;
  const b = state.breath, m = state.metrics;
  if (actualFlow > 0) b.inspirationMl += actualFlow * dt * 1000;
  else b.expirationMl -= actualFlow * dt * 1000;
  b.maximumPressure = Math.max(b.maximumPressure, sourcePressure);
  b.pressureIntegral += sourcePressure * dt;
  b.duration += dt;
  b.pressureLimited ||= pressureLimited;
  if (!inspiring) b.endExpirationPressure = (state.leftVolumeL + state.rightVolumeL) / cTotal;
  state.pressureLimited = b.pressureLimited;

  m.pressure = disconnected ? 0 : sourcePressure;
  m.flow = disconnected ? 0 : actualFlow * 60 * (actualFlow < 0 ? (1 - p.leakFraction) : 1);
  m.volumeMl = disconnected ? 0 : Math.max(0, (state.leftVolumeL + state.rightVolumeL - b.startVolumeL) * 1000);
  m.leftVolumeMl = Math.max(0, (state.leftVolumeL - cL * s.peep) * 1000);
  m.rightVolumeMl = Math.max(0, (state.rightVolumeL - cR * s.peep) * 1000);
  m.respiratoryRate = manual ? m.manualRespiratoryRate : s.rate;
  if (manual) {
    if (state.manualCycleOpen && !inspiring && state.cycleTime >= s.inspiratoryTime + 0.25 && (Math.abs(actualFlow) < 0.005 || state.cycleTime >= s.inspiratoryTime + 8)) completeBreath(state, s, p);
    updateManualVentilation(state, p);
  }
  if (disconnected) {
    m.tidalVolumeMl = 0; m.actualTidalVolumeMl = 0;
    m.minuteVentilation = 0; m.alveolarVentilation = 0;
  }
  // CO2 mass balance: dP/dt = (0.863 VCO2 - VA P)/(buffer * 60).
  // VCO2 in mL/min, VA in L/min, PaCO2 in mmHg. FiO2 is absent by design.
  const va = disconnected ? 0 : m.alveolarVentilation;
  const co2Slope = (0.863 * p.co2ProductionMlMin - va * m.paCO2) / (CO2_BUFFER_L * 60);
  m.paCO2 = clamp(m.paCO2 + co2Slope * dt, 15, 180);
  m.pH = 6.1 + Math.log10(24 / (0.03 * m.paCO2)); // Fixed bicarbonate; acute respiratory approximation only.

  // Alveolar gas + O2-content mixing. No recruitment, V/Q distribution or diffusion model.
  const alveolarPO2 = clamp(s.fio2 * 713 - m.paCO2 / 0.8, 5, 713);
  const capillaryContent = oxygenContent(alveolarPO2, p.hemoglobinGdl);
  const arterialContent = oxygenContent(m.paO2, p.hemoglobinGdl);
  const extraction = 250 / (Math.max(0.5, m.cardiacOutput) * 10);
  const venousContent = Math.max(0, arterialContent - extraction);
  const mixedContent = capillaryContent * (1 - p.shuntFraction) + venousContent * p.shuntFraction;
  const oxygenSupplyFactor = 1 - Math.exp(-va / 0.9);
  const targetPO2 = Math.max(5, po2ForContent(mixedContent, p.hemoglobinGdl) * oxygenSupplyFactor);
  m.paO2 = approach(m.paO2, targetPO2, 14, dt);
  m.spo2 = saturation(m.paO2) * 100;

  // Preload-dominant illustration. PEEP can also reduce LV afterload in real life;
  // that benefit and RV geometry are NOT modeled. This is not a universal PEEP effect.
  const arrest = p.circulationState === 'arrest';
  const targetHeartRate = clamp(84 + Math.max(0, 94 - m.spo2) * 1.8 + Math.max(0, m.paCO2 - 45) * 0.45, 60, 170);
  m.heartRate = arrest ? 0 : approach(m.heartRate, targetHeartRate, 9, dt);
  const preload = clamp(1 - Math.max(0, m.meanAirwayPressure - 8) * 0.018, 0.5, 1);
  const depression = clamp(1 - Math.max(0, 82 - m.spo2) * 0.012, 0.4, 1);
  const compensation = 1 + Math.min(0.15, Math.max(0, m.heartRate - 84) / 350);
  const targetCO = 5 * p.cardiacReserve * preload * depression * compensation;
  m.compressionActive = arrest && p.compressionsActive === true && !(manual && s.airway === 'mask' && inspiring);
  m.spontaneousPulsePresent = !arrest;
  // Pulse oximetry is not a dependable displayed measurement during arrest/CPR.
  // m.spo2 remains synthetic arterial saturation for an explicitly labeled model lens.
  m.pulseOximeterAvailable = !arrest;
  m.intrinsicCardiacOutput = arrest ? 0 : approach(m.intrinsicCardiacOutput, targetCO, 8, dt);
  const compressionRate = p.compressionRate ?? 110;
  const rateFactor = Math.exp(-Math.pow((compressionRate - 110) / 55, 2));
  const depthFactor = Math.min((p.compressionDepthMm ?? 55) / 55, 1);
  // An illustrative forward-flow contribution, not a CPR efficacy predictor.
  const targetCompressionFlow = m.compressionActive ? 1.6 * rateFactor * depthFactor * (p.compressionRecoilFraction ?? 1) : 0;
  m.compressionFlow = arrest ? approach(m.compressionFlow, targetCompressionFlow, 0.8, dt) : 0;
  if (m.compressionFlow < 1e-6) m.compressionFlow = 0;
  m.cardiacOutput = m.intrinsicCardiacOutput + m.compressionFlow;
  if (m.compressionActive) {
    const nextPhase = state.compressionPhase + compressionRate * dt / 60;
    state.compressionCount += Math.floor(nextPhase);
    state.compressionPhase = nextPhase % 1;
  }
  const compressionArtifact = m.compressionActive ? 0.3 * Math.sin(2 * Math.PI * state.compressionPhase) : 0;
  m.map = approach(m.map, 5 + m.cardiacOutput * 14, 7, dt);
  const pulsePressure = m.cardiacOutput * 1000 / Math.max(40, arrest ? compressionRate : m.heartRate) * 0.65;
  m.systolicBP = m.map + pulsePressure * 2 / 3;
  m.diastolicBP = m.map - pulsePressure / 3;
  m.oxygenDelivery = m.cardiacOutput * oxygenContent(m.paO2, p.hemoglobinGdl) * 10;
  const gradient = 3 + Math.max(0, p.deadSpaceMl / Math.max(1, m.actualTidalVolumeMl) - 0.3) * 20 + Math.max(0, 4 - m.cardiacOutput) * 3;
  const co2PerfusionFactor = arrest ? clamp(m.cardiacOutput / 3.5, 0, 1) : 1;
  m.etCO2 = disconnected || m.actualTidalVolumeMl < 30 || (manual && !state.manualCycleOpen) ? null : Math.max(0, m.paCO2 - gradient) * co2PerfusionFactor;
  state.cardiacPhase = (state.cardiacPhase + m.heartRate * dt / 60) % 1;
  state.tick += 1;
  state.time = state.tick * dt;
  state.cycleTime += dt;
  if (state.tick % 5 === 0) {
    const expirationScale = manual ? Math.max(0.25, 3 * rTotal * cTotal) : Math.max(0.25, period - s.inspiratoryTime);
    const expFraction = inspiring ? 0 : clamp((state.cycleTime - s.inspiratoryTime) / expirationScale, 0, 1);
    const expRise = clamp((expFraction - 0.06) / 0.18, 0, 1);
    const co2 = m.etCO2 === null ? null : inspiring ? 0 : m.etCO2 * expRise;
    state.history.push({ time: state.time, pressure: m.pressure, flow: m.flow,
      volumeMl: m.volumeMl, co2, ecg: arrest ? compressionArtifact : ecgAt(state.cardiacPhase), compression: compressionArtifact });
  }
}

/**
 * Advances ONLY explicit simulation time. Never reads Date/performance/wall time.
 * Returns a new state and bounded history; the caller owns play, pause and access.
 * Finite nonpositive elapsed time performs no integration. One call is capped at
 * 600 seconds as a resource guard, not a physiologic statement.
 */
export function advanceModel(
  input: ModelState,
  settingsInput: Partial<VentSettings>,
  parametersInput: Partial<LungParameters>,
  seconds: number,
): ModelState {
  const s = normalizeSettings(settingsInput), p = normalizeParameters(parametersInput);
  const state = cloneSafeState(input, s, p);
  selectSource(state, s);
  syncCirculationState(state, s, p);
  const total = bounded(seconds, 0, 0, 600) + state.remainderSeconds;
  const steps = Math.floor((total + 1e-10) / MODEL_STEP_SECONDS);
  state.remainderSeconds = Math.max(0, total - steps * MODEL_STEP_SECONDS);
  for (let i = 0; i < steps; i += 1) integrate(state, s, p);
  if (state.history.length > MAX_HISTORY_SAMPLES) state.history = state.history.slice(-MAX_HISTORY_SAMPLES);
  return state;
}

export function getWaveSamples(state: ModelState): WaveSample[] {
  if (!state || !Array.isArray(state.history)) return [];
  return state.history.slice(-MAX_HISTORY_SAMPLES).filter(sample => sample &&
    [sample.time, sample.pressure, sample.flow, sample.volumeMl, sample.ecg].every(Number.isFinite) &&
    (sample.co2 === null || Number.isFinite(sample.co2))).map(sample => ({ ...sample }));
}
