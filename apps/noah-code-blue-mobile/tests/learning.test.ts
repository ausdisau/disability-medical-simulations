import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCompanionState, dispatchCompanion, profileRooms, type CompanionAction, type CompanionState } from '../src/session/companion.ts';
import { modules } from '../../../shared/noah-resuscitation/curriculum.ts';

const act = (state: CompanionState, ...actions: CompanionAction[]) => actions.reduce(dispatchCompanion, state);
const simulate = (action: Extract<CompanionAction, { type: 'simulation' }>['action']): CompanionAction => ({ type: 'simulation', action });

test('learning starts with six freely navigable modules, no active room and no running clock', () => {
  let state = createCompanionState();
  const rooms = state.rooms;
  assert.equal(state.screen, 'learning');
  assert.equal(state.rooms.activeRoomId, null);
  assert.ok(Object.values(state.rooms.rooms).every(room => !room.running));
  for (const index of [5, 0, 3, 1, 4, 2]) {
    state = act(state, { type: 'choose-module', index }, { type: 'answer', index: 2 });
    assert.equal(state.learning.moduleIndex, index);
    assert.equal(state.learning.selectedAnswer, 2);
    assert.strictEqual(state.rooms, rooms, 'reasoning must not touch simulation state');
  }
  for (const index of [-1, 6, NaN, Infinity, 0.5]) {
    assert.strictEqual(dispatchCompanion(state, { type: 'choose-module', index }), state);
  }
  for (const index of [-1, 3, NaN, 1.5]) {
    assert.strictEqual(dispatchCompanion(state, { type: 'answer', index }), state);
  }
});

test('answers are repeatable formative choices, clear on navigation/case change and never accumulate a grade', () => {
  let state = createCompanionState();
  for (let index = 0; index < modules.length; index++) {
    state = act(state, { type: 'choose-module', index });
    assert.equal(state.learning.selectedAnswer, null);
    for (const answer of [0, 1, 2, 0]) {
      state = act(state, { type: 'answer', index: answer });
      assert.deepEqual(state.learning, { moduleIndex: index, selectedAnswer: answer, profileId: 'cp' });
    }
  }
  state = act(state, { type: 'choose-case', profileId: 'dmd' });
  assert.equal(state.learning.selectedAnswer, null);
  assert.equal(state.learning.moduleIndex, 5);
});

test('every learning case opens its matching existing room paused at either practice destination', () => {
  for (const [profileId, roomId] of Object.entries(profileRooms)) {
    for (const tab of ['Bedside', 'Support'] as const) {
      const initial = createCompanionState();
      const state = act(initial, { type: 'choose-case', profileId: profileId as keyof typeof profileRooms }, { type: 'practise', tab });
      assert.equal(state.screen, 'simulation');
      assert.equal(state.tab, tab);
      assert.equal(state.rooms.activeRoomId, roomId);
      assert.equal(state.rooms.rooms[roomId].running, false);
      assert.deepEqual(state.rooms.rooms[roomId].model, initial.rooms.rooms[roomId].model);
      assert.deepEqual(state.rooms.rooms[roomId].settings, initial.rooms.rooms[roomId].settings);
    }
  }
});

test('leaving a running simulation parks time; delayed timer and support actions cannot run in learning', () => {
  let state = act(createCompanionState(), { type: 'practise', tab: 'Bedside' }, simulate({ type: 'run' }), simulate({ type: 'tick', seconds: 0.25 }));
  const before = state.rooms.rooms['icu-01'];
  state = act(state, { type: 'open-learning' });
  assert.equal(state.rooms.activeRoomId, null);
  assert.equal(state.rooms.rooms['icu-01'].running, false);
  assert.deepEqual(state.rooms.rooms['icu-01'].model, before.model);
  for (const action of [{ type: 'tick', seconds: 1 }, { type: 'run' }, { type: 'step' }, { type: 'bag-breath' }, { type: 'reset-room' }] as const) {
    assert.strictEqual(dispatchCompanion(state, simulate(action)), state);
  }
  state = act(state, { type: 'practise', tab: 'Bedside' });
  assert.equal(state.rooms.rooms['icu-01'].running, false);
  assert.deepEqual(state.rooms.rooms['icu-01'].model, before.model);
  state = act(state, simulate({ type: 'step' }));
  assert.equal(state.rooms.rooms['icu-01'].model.time, before.model.time + 5);
});

test('AAC hold, queued breath, roles, reflection and lesson selection survive learning round trips', () => {
  let state = act(createCompanionState(), { type: 'choose-module', index: 4 }, { type: 'answer', index: 2 }, { type: 'practise', tab: 'Support' },
    simulate({ type: 'role', role: 'airway', ready: true }), simulate({ type: 'reflection', text: 'Fictional practice reflection' }),
    simulate({ type: 'source', source: 'manual-bag', airway: 'tracheostomy' }), simulate({ type: 'bag-ready', ready: true }),
    simulate({ type: 'toggle-access-hold' }), simulate({ type: 'bag-breath' }));
  const before = state.rooms.rooms['icu-01'];
  assert.equal(before.model.manualBreathActive, true);
  state = act(state, { type: 'open-learning' }, { type: 'choose-rooms' }, simulate({ type: 'enter-room', id: 'icu-01' }), { type: 'open-learning' }, { type: 'practise', tab: 'Support' });
  const after = state.rooms.rooms['icu-01'];
  assert.equal(after.accessHold, true);
  assert.equal(after.running, false);
  assert.deepEqual(after.model, before.model);
  assert.deepEqual(after.roles, before.roles);
  assert.equal(after.reflection, before.reflection);
  assert.equal(after.bagReady, true);
  assert.equal(state.learning.moduleIndex, 4);
  assert.equal(state.learning.selectedAnswer, 2);
  for (const event of before.events) assert.ok(after.events.includes(event));
});

test('room browsing selects the corresponding adaptation and tab/background transitions never resume time', () => {
  let state = act(createCompanionState(), { type: 'choose-rooms' }, simulate({ type: 'enter-room', id: 'icu-02' }), simulate({ type: 'run' }), { type: 'tab', tab: 'Debrief' });
  assert.equal(state.learning.profileId, 'dmd');
  assert.equal(state.tab, 'Debrief');
  assert.equal(state.rooms.rooms['icu-02'].running, false);
  state = act(state, simulate({ type: 'run' }), simulate({ type: 'background', reason: 'inactive' }));
  const before = state.rooms.rooms['icu-02'];
  state = act(state, { type: 'open-learning' }, simulate({ type: 'background' }), { type: 'practise', tab: 'Bedside' });
  assert.equal(state.rooms.rooms['icu-02'].running, false);
  assert.deepEqual(state.rooms.rooms['icu-02'].model, before.model);
});
