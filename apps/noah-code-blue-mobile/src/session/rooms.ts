import {
  advanceModel, createModel, deliverManualBreath, normalizeParameters, normalizeSettings,
  DEFAULT_PARAMETERS, DEFAULT_SETTINGS,
  type LungParameters, type ModelState, type VentSettings,
} from '../model/pulmonary';

export type RoomId = 'icu-01' | 'icu-02' | 'skills-03';
export type TeamRole = 'bedside' | 'lead' | 'airway' | 'compressions' | 'monitor' | 'recorder';
export type SettingKey = 'fio2' | 'peep' | 'rate' | 'inspiratoryTime' | 'pressureControl' | 'tidalVolumeMl' | 'pressureLimit';
export type CompressionKey = 'compressionRate' | 'compressionDepthMm' | 'compressionRecoilFraction';

export const roleLabels: Record<TeamRole, string> = {
  bedside: 'Bedside nurse · 1:1 responsibility',
  lead: 'Clinical team lead',
  airway: 'Airway and ventilation responder',
  compressions: 'Compression responder',
  monitor: 'Monitoring and circulation responder',
  recorder: 'Recorder and handover',
};

// Authored inputs mirrored from the web lab's content/cases.ts (29 Oct 2026).
// These are synthetic adult case assumptions, never diagnosis-specific norms.
// See docs/mobile-web-consistency.md for provenance and the skills-room warmup distinction.
const authoredSettings = normalizeSettings({ ...DEFAULT_SETTINGS, pressureControl: 14 });
const authoredParameters = normalizeParameters({
  ...DEFAULT_PARAMETERS, complianceMlPerCmH2O: 40, leftComplianceFraction: 0.45,
  muscleEffortCmH2O: 1, secretionBurden: 0.08, hemoglobinGdl: 13,
});
const baselineParameters: Record<RoomId, LungParameters> = {
  'icu-01': normalizeParameters({ ...authoredParameters, complianceMlPerCmH2O: 34, muscleEffortCmH2O: 2, shuntFraction: 0.12 }),
  'icu-02': normalizeParameters({ ...authoredParameters, muscleEffortCmH2O: 0.5, co2ProductionMlMin: 180, cardiacReserve: 0.82 }),
  'skills-03': normalizeParameters({ ...authoredParameters, muscleEffortCmH2O: 0 }),
};

export interface RoomDefinition {
  id: RoomId; title: string; name: string; age: number; diagnosis: string;
  baseline: string; opening: string; communication: string; priorities: string;
  settings: VentSettings; parameters: LungParameters; initialArrest: boolean;
}

export const roomDefinitions: RoomDefinition[] = [
  {
    id: 'icu-01', title: 'ICU 01 · airway obstruction', name: 'Maya Chen', age: 26,
    diagnosis: 'Cerebral palsy · fictional adult',
    baseline: 'Maya directs her care using eye-gaze AAC. Her respiratory support and positioning are individual to this case; CP does not prescribe a universal respiratory state.',
    opening: 'New secretion burden raises airway resistance. The established tracheostomy is connected to the ventilator. Assess the person and the delivered support; a bag does not remove obstruction.',
    communication: 'Eye-gaze AAC with a reliable partner-assisted yes/no backup. Allow response time and address Maya first.',
    priorities: 'Keep my communication visible. Explain what you are checking. Ask what is usual for me.',
    settings: normalizeSettings({ ...authoredSettings, airway: 'tracheostomy' }),
    parameters: normalizeParameters({ ...baselineParameters['icu-01'], secretionBurden: 0.8 }),
    initialArrest: false,
  },
  {
    id: 'icu-02', title: 'ICU 02 · DMD arrest exercise', name: 'Kai Morgan', age: 19,
    diagnosis: 'Duchenne muscular dystrophy · fictional adult',
    baseline: 'Kai normally directs his care. Respiratory weakness, secretion clearance and cardiac reserve are separate case assumptions. The ETT is already established in this authored ICU scenario.',
    opening: 'This exercise explicitly starts with unresponsiveness and absent normal breathing. Recognise the authored arrest, request the team and coordinate support through the existing ETT.',
    communication: 'Preserve the AAC device and continue respectful narration. No patient response is inferred during the authored unresponsive state.',
    priorities: 'Personal authority and communication equipment remain part of care during emergencies and recovery.',
    settings: normalizeSettings({ ...authoredSettings, airway: 'ett', pressureControl: 13 }),
    parameters: normalizeParameters({ ...baselineParameters['icu-02'], muscleEffortCmH2O: 0, circulationState: 'arrest', compressionsActive: false }),
    initialArrest: true,
  },
  {
    id: 'skills-03', title: 'Skills 03 · bag–valve–mask', name: 'Alex Taylor', age: 35,
    diagnosis: 'Generic fictional adult skills case',
    baseline: 'A separate natural-airway teaching configuration. No CP, muscular dystrophy or invasive-airway history is inferred for Alex.',
    opening: 'An explicit adult arrest drill with a face-mask interface. Rehearse 30 compressions and two manual breaths, with a compression pause for those breaths.',
    communication: 'The scenario states unresponsiveness. Narrate care respectfully and preserve communication access for recovery; do not manufacture a reply.',
    priorities: 'Clear team roles, observable delivery and a reviewable sequence. This is not a full ALS or skills-certification tool.',
    settings: normalizeSettings({ ...authoredSettings, ventilationSource: 'manual-bag', airway: 'mask' }),
    parameters: normalizeParameters({ ...baselineParameters['skills-03'], muscleEffortCmH2O: 0, circulationState: 'arrest', compressionsActive: false }),
    initialArrest: true,
  },
];

export interface RoomEvent { id: number; time: number; title: string; detail: string }
export interface RoomState {
  id: RoomId; settings: VentSettings; parameters: LungParameters; model: ModelState;
  startedAt: number; running: boolean; accessHold: boolean; codeBlueActive: boolean;
  helpRequested: boolean; arrestRecognised: boolean; bagReady: boolean;
  roles: Record<TeamRole, boolean>; aacAvailable: boolean; patientMessage: string;
  reflection: string; events: RoomEvent[]; lastMessage: string; limitNoted: boolean;
}
export interface RoomsState { activeRoomId: RoomId | null; rooms: Record<RoomId, RoomState> }

export type RoomAction =
  | { type: 'run' | 'pause' | 'step' | 'toggle-access-hold' | 'activate-code-blue' | 'recognise-arrest' | 'start-compressions' | 'stop-compressions' | 'bag-breath' | 'reassess' | 'reset-room' | 'load-arrest' }
  | { type: 'source'; source: 'ventilator' | 'manual-bag'; airway: VentSettings['airway'] }
  | { type: 'mode'; mode: VentSettings['mode'] }
  | { type: 'setting'; key: SettingKey; value: number }
  | { type: 'compression-setting'; key: CompressionKey; value: number }
  | { type: 'role'; role: TeamRole; ready: boolean }
  | { type: 'bag-ready' | 'aac-available'; ready: boolean }
  | { type: 'patient-message'; message: string }
  | { type: 'reflection'; text: string };
export type RoomsAction = RoomAction
  | { type: 'enter-room'; id: RoomId }
  | { type: 'lobby' }
  | { type: 'background'; reason?: string }
  | { type: 'tick'; seconds: number };

export function definitionFor(id: RoomId): RoomDefinition {
  return roomDefinitions.find(room => room.id === id)!;
}
export function sourceDescription(s: RoomState): string {
  const route = s.settings.airway === 'mask' ? 'natural-airway face mask' : s.settings.airway === 'ett' ? 'existing ETT' : 'existing tracheostomy';
  return `${s.settings.ventilationSource === 'manual-bag' ? 'Manual bag' : `${s.settings.mode} ventilator`} via ${route}`;
}
export function elapsedLabel(room: RoomState): string {
  const elapsed = Math.max(0, Math.floor(room.model.time - room.startedAt));
  return `${Math.floor(elapsed / 60).toString().padStart(2, '0')}:${(elapsed % 60).toString().padStart(2, '0')}`;
}

function record(room: RoomState, title: string, detail: string): RoomState {
  const model = advanceModel(room.model, room.settings, room.parameters, 0);
  return { ...room, model, lastMessage: detail, events: [...room.events, {
    id: (room.events.at(-1)?.id ?? 0) + 1, time: model.time - room.startedAt, title, detail,
  }].slice(-150) };
}

export function createRoom(id: RoomId): RoomState {
  const def = definitionFor(id);
  const settings = { ...def.settings }, parameters = { ...def.parameters };
  let model: ModelState;
  if (id === 'skills-03') model = createModel(settings, parameters);
  else {
    const base = { ...baselineParameters[id] };
    model = advanceModel(createModel(settings, base), settings, base, 120);
    model = advanceModel(model, settings, parameters, 0.1);
  }
  const room: RoomState = {
    id, settings, parameters, model, startedAt: model.time, running: false, accessHold: false,
    codeBlueActive: false, helpRequested: false, arrestRecognised: false, bagReady: false,
    roles: { bedside: true, lead: false, airway: false, compressions: false, monitor: false, recorder: false },
    aacAvailable: true, patientMessage: def.initialArrest ? 'Response unknown in the authored arrest state.' : 'Please ask me directly and keep my communication in reach.',
    reflection: '', events: [], lastMessage: '', limitNoted: false,
  };
  return record(room, 'Room prepared', def.opening);
}

export function createRoomsState(): RoomsState {
  return { activeRoomId: null, rooms: { 'icu-01': createRoom('icu-01'), 'icu-02': createRoom('icu-02'), 'skills-03': createRoom('skills-03') } };
}

function advanceRoom(room: RoomState, seconds: number): RoomState {
  const model = advanceModel(room.model, room.settings, room.parameters, seconds);
  const next = { ...room, model };
  if (!room.limitNoted && room.parameters.circulationState !== 'arrest' && (model.metrics.spo2 < 65 || model.metrics.map < 30 || model.metrics.paCO2 > 140)) {
    return record({ ...next, running: false, limitNoted: true }, 'Facilitator pause', 'The synthetic model is outside its intended teaching range. Review the scenario and assumptions; these values do not predict an outcome.');
  }
  return next;
}

export function roomSummary(room: RoomState): string {
  const m = room.model.metrics;
  const arrest = room.parameters.circulationState === 'arrest';
  return `${sourceDescription(room)}. Expired volume ${Math.round(m.tidalVolumeMl)} mL. ` +
    (arrest ? `Clinical pulse oximetry and blood-pressure readings unavailable. Compression-generated flow ${m.compressionFlow.toFixed(2)} L/min; spontaneous circulation remains absent. Synthetic gas state CO₂ ${m.paCO2.toFixed(1)} mmHg is outside arterial-gas interpretation during arrest.`
      : `Synthetic saturation ${m.spo2.toFixed(1)}%; modeled arterial CO₂ ${m.paCO2.toFixed(1)} mmHg; modeled mean pressure ${m.map.toFixed(1)} mmHg.`) +
    ` AAC ${room.aacAvailable ? 'equipment available' : 'unavailable; response unknown'}.`;
}

function reduceRoom(room: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    case 'run': return room.accessHold ? record(room, 'Access hold', 'The training clock remains frozen until the access hold is released.') : record({ ...room, running: true }, 'Simulation running', 'Only this active room advances. You can pause at any time.');
    case 'pause': return record({ ...room, running: false }, 'Paused', 'Model time is paused. Queued support waits for Run or Step.');
    case 'step': return room.accessHold ? record(room, 'Access hold', 'No physiological time is consumed during the access hold.') : advanceRoom({ ...room, running: false }, 5);
    case 'toggle-access-hold': return record({ ...room, accessHold: !room.accessHold, running: false }, room.accessHold ? 'Access hold released' : 'AAC / reading pause', room.accessHold ? 'Time stays paused. Use Run or Step when ready; queued actions have not consumed time.' : 'Time is frozen for communication, reading or assistive input. Emergency work can be queued without losing physiological time.');
    case 'activate-code-blue': return record({ ...room, codeBlueActive: true, helpRequested: true }, 'Simulated Code Blue activated', 'The fictional response team has been requested. No real alert or message is sent. Confirm responder readiness separately; do not wait for a complete team before indicated rescue.');
    case 'recognise-arrest':
      if (room.parameters.circulationState !== 'arrest') return record(room, 'Arrest not established', 'This room currently has spontaneous circulation. Disability, ventilator dependence and low pressure alone are not arrest indications.');
      return record({ ...room, arrestRecognised: true, codeBlueActive: true, helpRequested: true, patientMessage: 'Response unknown in the authored arrest state.' }, 'Authored arrest recognised', 'Rapid assessment confirms the scenario’s unresponsiveness and absent normal breathing; help is requested. Pulse certainty and AAC agreement are not prerequisites for this emergency response.');
    case 'start-compressions': {
      if (room.parameters.circulationState !== 'arrest' || !room.arrestRecognised) return record(room, 'Compressions remain gated', 'Recognise the explicit arrest scenario first. A numerical observation alone does not establish arrest.');
      if (!room.roles.bedside && !room.roles.compressions) return record(room, 'Responder readiness', 'A trained bedside nurse or compression responder must be available in the scenario; a complete team is not required to start.');
      if (room.settings.ventilationSource === 'manual-bag' && room.settings.airway === 'mask' && room.model.manualBreathActive) return record(room, 'Mask inspiration active', 'Finish the current mask inspiration before resuming simulated compressions.');
      return record({ ...room, parameters: { ...room.parameters, compressionsActive: true }, running: !room.accessHold, helpRequested: true }, room.accessHold ? 'Compressions queued' : 'Simulated compressions started', room.accessHold ? 'The compression control is configured, but counts and flow will not evolve until the training clock resumes.' : 'Generated forward flow is not spontaneous circulation. The model never produces automatic ROSC.');
    }
    case 'stop-compressions': return record({ ...room, parameters: { ...room.parameters, compressionsActive: false } }, 'Simulated compressions paused', 'Cycle counts stop. Generated flow decays only as model time advances; a frozen value during an access hold is not continuing compression activity.');
    case 'source': {
      if (room.model.manualBreathActive) return record(room, 'Breath in progress', 'Finish the active or queued manual inspiration before changing its interface or source.');
      if (action.airway === 'mask' && action.source !== 'manual-bag') return record(room, 'Separate mask configuration', 'Select an ETT or tracheostomy explicitly before returning to the ventilator. The model does not perform an airway exchange.');
      const settings = normalizeSettings({ ...room.settings, ventilationSource: action.source, airway: action.airway });
      const parameters = { ...room.parameters, compressionsActive: action.airway === 'mask' ? false : room.parameters.compressionsActive };
      return record({ ...room, settings, parameters, running: false, bagReady: false }, 'Support configured', 'This changes the fictional configuration, not an airway procedure. Bag readiness must be checked again. A mask configuration pauses compressions.');
    }
    case 'bag-ready': return record({ ...room, bagReady: action.ready }, 'Bag readiness recorded', action.ready ? 'A compatible bag, interface and oxygen source are ready in the scenario. Readiness does not prove airway patency or effective delivery.' : 'Manual bag readiness is unconfirmed.');
    case 'bag-breath': {
      if (room.settings.ventilationSource !== 'manual-bag' || !room.bagReady || (!room.roles.bedside && !room.roles.airway)) return record(room, 'Bag not ready', 'Choose the manual source and confirm compatible equipment plus a trained bedside or airway responder.');
      if (room.model.manualBreathActive) return record(room, 'Breath already requested', 'The existing inspiration must finish before another activation.');
      if (room.settings.airway === 'mask' && room.parameters.compressionsActive) return record(room, 'Mask sequence', 'Pause compressions for the two mask breaths in the natural-airway 30:2 exercise.');
      const model = deliverManualBreath(room.model, room.settings, room.parameters);
      if (model.manualBreathCount === room.model.manualBreathCount) return record(room, 'No breath queued', 'Reassess the source and compression state.');
      let next = { ...room, model };
      if (!room.running && !room.accessHold) next = advanceRoom(next, room.settings.inspiratoryTime + 0.6);
      return record(next, room.accessHold ? 'One bag breath queued' : 'One timed bag breath', room.accessHold ? 'No gas or volume change occurs until the training clock resumes.' : 'One inspiration evolves through the existing lung mechanics. Obstruction and stiffness remain; no automatic next breath or recovery is produced.');
    }
    case 'setting': {
      if (!Number.isFinite(action.value)) return record(room, 'Input unchanged', 'Enter a finite number.');
      if (room.model.manualBreathActive) return record(room, 'Breath in progress', 'Finish the requested bag inspiration before changing its assumptions.');
      const settings = normalizeSettings({ ...room.settings, [action.key]: action.value });
      return record({ ...room, settings }, 'Support assumption changed', `${action.key} = ${settings[action.key]}. Synthetic experiment input; reassess delivered effects. These bounds are not treatment recommendations.`);
    }
    case 'mode':
      if (room.model.manualBreathActive) return record(room, 'Breath in progress', 'Finish the active or queued bag inspiration before changing mode.');
      return record({ ...room, settings: normalizeSettings({ ...room.settings, mode: action.mode }), running: false }, 'Mandatory mode changed', `${action.mode === 'PC' ? 'Pressure' : 'Volume'} control selected. The training clock is paused for review. Manual bag breaths continue to use the pressure-control assumption.`);
    case 'compression-setting': {
      if (!Number.isFinite(action.value)) return record(room, 'Input unchanged', 'Enter a finite number.');
      const parameters = normalizeParameters({ ...room.parameters, [action.key]: action.value });
      return record({ ...room, parameters }, 'Compression assumption changed', `${action.key} = ${parameters[action.key]}. The generated flow is an illustrative approximation, not a quality score or clinical prediction.`);
    }
    case 'role': return record({ ...room, roles: { ...room.roles, [action.role]: action.ready } }, 'Team readiness updated', `${roleLabels[action.role]}: ${action.ready ? 'assigned and ready in this scenario' : 'not yet ready'}. This does not contact a real person.`);
    case 'aac-available': return record({ ...room, aacAvailable: action.ready, patientMessage: !action.ready || room.parameters.circulationState === 'arrest' ? 'Response unknown; do not infer agreement or incapacity.' : room.patientMessage }, 'Communication equipment updated', action.ready ? 'AAC or a reliable backup is available. Equipment availability does not establish a response during arrest.' : 'Communication access is interrupted. Restore access in parallel with urgent clinical work.');
    case 'patient-message':
      if (room.parameters.circulationState === 'arrest' || !room.aacAvailable) return record(room, 'Response unknown', 'No patient reply is manufactured during unresponsiveness or failed communication access.');
      return record({ ...room, patientMessage: action.message, accessHold: true, running: false }, 'Fictional patient communication', action.message + ' The training clock is paused for access.');
    case 'reassess': return record(room, 'Four-domain reassessment', roomSummary(room) + ' Compare with the person’s baseline and carry unresolved risks into handover.');
    case 'reflection': return { ...room, reflection: action.text.slice(0, 5000) };
    case 'load-arrest': return record({ ...room, running: false, parameters: { ...room.parameters, circulationState: 'arrest', compressionsActive: false }, arrestRecognised: false, patientMessage: 'Response unknown in the authored arrest state.' }, 'Explicit arrest change loaded', 'The facilitator-authored change establishes unresponsiveness and absent normal breathing. It is not inferred from disability or a monitor value.');
    case 'reset-room': return createRoom(room.id);
  }
}

/** Pure room coordinator. Only the selected room advances; background/lobby are parked. */
export function dispatchRooms(state: RoomsState, action: RoomsAction): RoomsState {
  if (action.type === 'enter-room') {
    const rooms = { ...state.rooms };
    if (state.activeRoomId && state.activeRoomId !== action.id) rooms[state.activeRoomId] = record({ ...rooms[state.activeRoomId], running: false }, 'Room parked', 'This room is inactive and consumes no model time.');
    rooms[action.id] = record({ ...rooms[action.id], running: false }, 'Room opened', 'The case state is preserved. Resume the training clock when ready.');
    return { rooms, activeRoomId: action.id };
  }
  if (action.type === 'lobby' || action.type === 'background') {
    const rooms = { ...state.rooms };
    for (const id of Object.keys(rooms) as RoomId[]) if (rooms[id].running) rooms[id] = record({ ...rooms[id], running: false }, action.type === 'background' ? 'App backgrounded' : 'Room parked', action.type === 'background' ? 'AppState paused the training clock. There is no background catch-up or automatic resume.' : 'Inactive rooms do not advance.');
    return { rooms, activeRoomId: action.type === 'lobby' ? null : state.activeRoomId };
  }
  if (!state.activeRoomId) return state;
  const id = state.activeRoomId, room = state.rooms[id];
  if (action.type === 'tick') {
    if (!room.running || room.accessHold) return state;
    return { ...state, rooms: { ...state.rooms, [id]: advanceRoom(room, Math.max(0, Math.min(1, Number.isFinite(action.seconds) ? action.seconds : 0))) } };
  }
  return { ...state, rooms: { ...state.rooms, [id]: reduceRoom(room, action) } };
}
