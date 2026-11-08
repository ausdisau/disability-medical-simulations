import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRoomsState, definitionFor, dispatchRooms, roomSummary, sourceDescription, type RoomId, type RoomsAction, type RoomsState } from '../src/session/rooms.ts';

const start = (id: RoomId = 'icu-01') => dispatchRooms(createRoomsState(), { type: 'enter-room', id });
const act = (state: RoomsState, ...actions: RoomsAction[]) => actions.reduce(dispatchRooms, state);
const current = (state: RoomsState) => state.rooms[state.activeRoomId!];

test('three adult rooms have separate personas, airway histories and circulation assumptions', () => {
  const state = createRoomsState();
  assert.deepEqual(Object.keys(state.rooms), ['icu-01', 'icu-02', 'skills-03']);
  assert.equal(definitionFor('skills-03').name, 'Alex Taylor');
  assert.equal(definitionFor('skills-03').age, 35);
  assert.equal(definitionFor('icu-02').age, 19);
  assert.match(definitionFor('skills-03').diagnosis, /Generic fictional adult/);
  assert.equal(state.rooms['icu-01'].settings.airway, 'tracheostomy');
  assert.equal(state.rooms['icu-01'].parameters.circulationState, 'perfusing');
  assert.equal(state.rooms['icu-02'].settings.airway, 'ett');
  assert.equal(state.rooms['icu-02'].parameters.circulationState, 'arrest');
  assert.equal(state.rooms['skills-03'].settings.airway, 'mask');
  assert.equal(state.rooms['skills-03'].model.completedBreaths, 0, 'natural-airway case does not import invasive ventilation history');
  assert.equal(state.rooms['icu-01'].parameters.secretionBurden, 0.8);
  assert.equal(state.rooms['icu-01'].parameters.shuntFraction, 0.12);
  assert.equal(state.rooms['icu-01'].parameters.muscleEffortCmH2O, 2);
  assert.equal(state.rooms['icu-02'].parameters.cardiacReserve, 0.82);
  assert.equal(state.rooms['icu-02'].parameters.co2ProductionMlMin, 180);
  assert.equal(state.rooms['icu-02'].parameters.muscleEffortCmH2O, 0);
  assert.equal(state.rooms['icu-02'].settings.pressureControl, 13);
  for (const room of Object.values(state.rooms)) {
    assert.equal(room.settings.fio2, 0.35);
    assert.equal(room.settings.peep, 5);
    assert.equal(room.parameters.hemoglobinGdl, 13);
    assert.equal(room.parameters.leftComplianceFraction, 0.45);
    assert.equal(room.running, false);
    assert.equal(room.roles.bedside, true);
    assert.equal(Object.values(room.roles).filter(Boolean).length, 1);
  }
});

test('only the active room advances and changing rooms parks its exact state', () => {
  let state = start();
  const initialTime = current(state).model.time;
  const other = state.rooms['icu-02'];
  state = act(state, { type: 'run' }, { type: 'tick', seconds: 0.25 });
  assert.equal(current(state).model.time, initialTime + 0.25);
  assert.strictEqual(state.rooms['icu-02'], other);
  state = act(state, { type: 'enter-room', id: 'icu-02' }, { type: 'run' }, { type: 'tick', seconds: 1 });
  assert.equal(state.rooms['icu-01'].running, false);
  assert.equal(state.rooms['icu-01'].model.time, initialTime + 0.25);
  state = dispatchRooms(state, { type: 'lobby' });
  assert.equal(state.activeRoomId, null);
  assert.ok(Object.values(state.rooms).every(room => !room.running));
  assert.strictEqual(dispatchRooms(state, { type: 'tick', seconds: 1 }), state);
});

test('background pauses without catch-up or automatic resume; invalid ticks cannot advance', () => {
  let state = act(start(), { type: 'run' }, { type: 'tick', seconds: 0.25 });
  const time = current(state).model.time;
  state = act(state, { type: 'background', reason: 'inactive' }, { type: 'tick', seconds: 30 });
  assert.equal(current(state).model.time, time);
  assert.equal(current(state).running, false);
  state = act(state, { type: 'run' }, { type: 'tick', seconds: Number.NaN }, { type: 'tick', seconds: -1 });
  assert.equal(current(state).model.time, time);
  state = dispatchRooms(state, { type: 'tick', seconds: 1000 });
  assert.equal(current(state).model.time, time + 1, 'one timer action is bounded to one explicit model second');
});

test('access hold freezes Run, Step, ticks and a queued mask breath until explicit release', () => {
  let state = act(start('skills-03'), { type: 'toggle-access-hold' }, { type: 'bag-ready', ready: true });
  const before = current(state).model;
  state = act(state, { type: 'bag-breath' }, { type: 'run' }, { type: 'step' }, { type: 'tick', seconds: 1 });
  const queued = current(state);
  assert.equal(queued.model.time, before.time);
  assert.equal(queued.model.metrics.paCO2, before.metrics.paCO2);
  assert.equal(queued.model.leftVolumeL, before.leftVolumeL);
  assert.equal(queued.model.manualBreathActive, true);
  assert.equal(queued.model.manualBreathCount, 1);
  assert.equal(queued.running, false);
  state = dispatchRooms(state, { type: 'toggle-access-hold' });
  assert.equal(current(state).running, false);
  assert.equal(current(state).model.time, before.time);
  state = dispatchRooms(state, { type: 'step' });
  assert.equal(current(state).model.time, before.time + 5);
  assert.ok(current(state).model.metrics.actualTidalVolumeMl > 0);
});

test('compression request during access hold configures support but produces no cycles or flow', () => {
  let state = act(start('icu-02'), { type: 'recognise-arrest' }, { type: 'toggle-access-hold' });
  const before = current(state).model;
  state = act(state, { type: 'start-compressions' }, { type: 'step' }, { type: 'tick', seconds: 1 });
  assert.equal(current(state).parameters.compressionsActive, true);
  assert.equal(current(state).model.time, before.time);
  assert.equal(current(state).model.compressionCount, before.compressionCount);
  assert.equal(current(state).model.metrics.compressionFlow, before.metrics.compressionFlow);
  assert.equal(current(state).running, false);
  state = act(state, { type: 'toggle-access-hold' }, { type: 'step' });
  assert.ok(current(state).model.compressionCount > 0);
  assert.ok(current(state).model.metrics.compressionFlow > 0);
  assert.equal(current(state).model.metrics.spontaneousPulsePresent, false);
});

test('arrest recognition and a trained responder gate compressions without requiring all roles', () => {
  let state = act(start('icu-02'), { type: 'start-compressions' });
  assert.equal(current(state).parameters.compressionsActive, false);
  state = act(state, { type: 'recognise-arrest' }, { type: 'role', role: 'bedside', ready: false }, { type: 'start-compressions' });
  assert.equal(current(state).parameters.compressionsActive, false);
  state = act(state, { type: 'role', role: 'compressions', ready: true }, { type: 'start-compressions' });
  assert.equal(current(state).parameters.compressionsActive, true);
  assert.equal(current(state).roles.lead, false);
  assert.equal(current(state).helpRequested, true);
});

test('perfusing room cannot acquire arrest or CPR from activation or parameter values alone', () => {
  let state = start();
  state = act(state, { type: 'activate-code-blue' }, { type: 'recognise-arrest' }, { type: 'start-compressions' });
  assert.equal(current(state).parameters.circulationState, 'perfusing');
  assert.equal(current(state).parameters.compressionsActive, false);
  assert.equal(current(state).arrestRecognised, false);
  const gas = current(state).model.metrics.paCO2;
  const time = current(state).model.time;
  state = dispatchRooms(state, { type: 'load-arrest' });
  assert.equal(current(state).parameters.circulationState, 'arrest');
  assert.equal(current(state).model.metrics.pulseOximeterAvailable, false);
  assert.equal(current(state).model.metrics.intrinsicCardiacOutput, 0);
  assert.equal(current(state).model.metrics.paCO2, gas);
  assert.equal(current(state).model.time, time);
});

test('mask inspiration and compressions are guarded in both action orders', () => {
  let state = act(start('skills-03'), { type: 'recognise-arrest' }, { type: 'bag-ready', ready: true }, { type: 'start-compressions' });
  state = dispatchRooms(state, { type: 'bag-breath' });
  assert.equal(current(state).model.manualBreathCount, 0);
  state = act(state, { type: 'stop-compressions' }, { type: 'toggle-access-hold' }, { type: 'bag-breath' }, { type: 'start-compressions' });
  assert.equal(current(state).model.manualBreathActive, true);
  assert.equal(current(state).parameters.compressionsActive, false);
  const settings = current(state).settings;
  state = dispatchRooms(state, { type: 'source', source: 'ventilator', airway: 'ett' });
  assert.deepEqual(current(state).settings, settings, 'active or held inspiration cannot be switched away');
  state = act(state, { type: 'toggle-access-hold' }, { type: 'step' }, { type: 'start-compressions' });
  assert.equal(current(state).parameters.compressionsActive, true);
});

test('advanced-airway bag breath can accompany compressions without changing impairment', () => {
  let state = act(start('icu-02'), { type: 'recognise-arrest' }, { type: 'source', source: 'manual-bag', airway: 'ett' }, { type: 'bag-ready', ready: true }, { type: 'start-compressions' });
  const p = current(state).parameters;
  state = dispatchRooms(state, { type: 'bag-breath' });
  assert.equal(current(state).model.manualBreathActive, true);
  assert.equal(current(state).parameters.compressionsActive, true);
  assert.equal(current(state).parameters.secretionBurden, p.secretionBurden);
  assert.equal(current(state).parameters.complianceMlPerCmH2O, p.complianceMlPerCmH2O);
  assert.equal(current(state).parameters.shuntFraction, p.shuntFraction);
  state = dispatchRooms(state, { type: 'tick', seconds: 1 });
  assert.ok(current(state).model.compressionCount > 0);
  assert.ok(current(state).model.metrics.volumeMl > 0);
});

test('switch to mask pauses compressions and invalidates bag readiness without time or gas reset', () => {
  let state = act(start('icu-02'), { type: 'recognise-arrest' }, { type: 'start-compressions' }, { type: 'tick', seconds: 1 }, { type: 'bag-ready', ready: true });
  const before = current(state).model;
  state = dispatchRooms(state, { type: 'source', source: 'manual-bag', airway: 'mask' });
  const room = current(state);
  assert.equal(room.parameters.compressionsActive, false);
  assert.equal(room.model.metrics.compressionActive, false);
  assert.equal(room.model.ventilationSource, 'manual-bag');
  assert.equal(room.running, false);
  assert.equal(room.bagReady, false);
  assert.equal(room.model.time, before.time);
  assert.equal(room.model.metrics.paCO2, before.metrics.paCO2);
  const beforeSettings = room.settings;
  state = dispatchRooms(state, { type: 'source', source: 'ventilator', airway: 'mask' });
  assert.deepEqual(current(state).settings, beforeSettings, 'invalid route is rejected, not silently exchanged');
  assert.match(sourceDescription(current(state)), /natural-airway face mask/);
});

test('bag command requires readiness and finite real time; paused activation advances one breath only', () => {
  let state = start('skills-03');
  state = dispatchRooms(state, { type: 'bag-breath' });
  assert.equal(current(state).model.manualBreathCount, 0);
  state = act(state, { type: 'bag-ready', ready: true }, { type: 'role', role: 'bedside', ready: false }, { type: 'bag-breath' });
  assert.equal(current(state).model.manualBreathCount, 0);
  state = act(state, { type: 'role', role: 'airway', ready: true }, { type: 'bag-breath' });
  const room = current(state);
  assert.equal(room.model.manualBreathCount, 1);
  assert.equal(room.running, false);
  assert.equal(room.model.manualBreathActive, false);
  assert.ok(Math.abs(room.model.time - room.settings.inspiratoryTime - 0.6) < 1e-8);
  state = dispatchRooms(state, { type: 'step' });
  assert.equal(current(state).model.manualBreathCount, 1, 'Step does not invent another manual breath');
});

test('AAC equipment cannot manufacture a response in arrest; awake authored WAIT freezes time', () => {
  let state = act(start('icu-02'), { type: 'aac-available', ready: true }, { type: 'patient-message', message: 'Yes' });
  assert.notEqual(current(state).patientMessage, 'Yes');
  assert.match(current(state).lastMessage, /No patient reply/);
  state = act(state, { type: 'enter-room', id: 'icu-01' }, { type: 'run' }, { type: 'patient-message', message: 'WAIT' });
  assert.equal(current(state).patientMessage, 'WAIT');
  assert.equal(current(state).running, false);
  assert.equal(current(state).accessHold, true);
  state = act(state, { type: 'aac-available', ready: false }, { type: 'patient-message', message: 'Agree' });
  assert.match(current(state).patientMessage, /Response unknown/);
});

test('arrest debrief labels unavailable sensors and synthetic gas validity without inferring ROSC', () => {
  let state = act(start('icu-02'), { type: 'recognise-arrest' }, { type: 'start-compressions' });
  for (let i = 0; i < 10; i++) state = dispatchRooms(state, { type: 'tick', seconds: 1 });
  assert.equal(current(state).model.metrics.pulseOximeterAvailable, false);
  assert.equal(current(state).model.metrics.spontaneousPulsePresent, false);
  const summary = roomSummary(current(state));
  assert.match(summary, /blood-pressure readings unavailable/);
  assert.match(summary, /outside arterial-gas interpretation/);
  assert.match(summary, /spontaneous circulation remains absent/);
});

test('support assumptions clamp to software bounds and reject nonfinite input; state remains immutable', () => {
  let state = start();
  const old = state;
  const snapshot = JSON.stringify(state);
  state = act(state, { type: 'setting', key: 'fio2', value: 10 }, { type: 'setting', key: 'rate', value: Number.NaN }, { type: 'compression-setting', key: 'compressionRate', value: 1000 });
  assert.equal(current(state).settings.fio2, 1);
  assert.equal(current(state).settings.rate, current(old).settings.rate);
  assert.equal(current(state).parameters.compressionRate, 160);
  assert.equal(JSON.stringify(old), snapshot);
});

test('reset clears only the selected room while bounded event history and reflection preserve other rooms', () => {
  let state = act(start('icu-01'), { type: 'reflection', text: 'Maya reflection' }, { type: 'enter-room', id: 'icu-02' });
  for (let i = 0; i < 160; i++) state = dispatchRooms(state, { type: 'reassess' });
  assert.equal(current(state).events.length, 150);
  state = dispatchRooms(state, { type: 'reflection', text: 'x'.repeat(6000) });
  assert.equal(current(state).reflection.length, 5000);
  state = dispatchRooms(state, { type: 'reset-room' });
  assert.equal(current(state).events.length, 1);
  assert.equal(current(state).reflection, '');
  assert.equal(state.rooms['icu-01'].reflection, 'Maya reflection');
  assert.equal(current(state).parameters.circulationState, 'arrest', 'reset restores authored initial arrest rather than awarding ROSC');
});
