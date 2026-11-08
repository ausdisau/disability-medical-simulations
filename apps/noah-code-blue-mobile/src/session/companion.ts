import { modules, type CurriculumProfileId } from '../../../../shared/noah-resuscitation/curriculum';
import { createRoomsState, dispatchRooms, type RoomId, type RoomsAction, type RoomsState } from './rooms';

export type SimulationTab = 'Bedside' | 'Support' | 'Team & AAC' | 'Debrief';
export const profileRooms: Record<CurriculumProfileId, RoomId> = { cp: 'icu-01', dmd: 'icu-02', adult: 'skills-03' };
const roomProfiles: Record<RoomId, CurriculumProfileId> = { 'icu-01': 'cp', 'icu-02': 'dmd', 'skills-03': 'adult' };

export interface LearningState {
  moduleIndex: number;
  selectedAnswer: number | null;
  profileId: CurriculumProfileId;
}
export interface CompanionState {
  screen: 'learning' | 'simulation';
  tab: SimulationTab;
  learning: LearningState;
  rooms: RoomsState;
}
export type LearningAction =
  | { type: 'choose-module'; index: number }
  | { type: 'choose-case'; profileId: CurriculumProfileId }
  | { type: 'answer'; index: number }
  | { type: 'practise'; tab: 'Bedside' | 'Support' }
  | { type: 'choose-rooms' };
export type CompanionAction = LearningAction
  | { type: 'open-learning' }
  | { type: 'tab'; tab: SimulationTab }
  | { type: 'simulation'; action: RoomsAction };

export function createCompanionState(): CompanionState {
  return {
    screen: 'learning', tab: 'Bedside',
    learning: { moduleIndex: 0, selectedAnswer: null, profileId: 'cp' },
    rooms: createRoomsState(),
  };
}

/** Reading and reasoning never dispatch clinical-model actions or accrue a score.
 * All crossings park time, including a late timer event after leaving a room.
 * The room coordinator retains holds, queued support, roles and reflections.
 */
export function dispatchCompanion(state: CompanionState, action: CompanionAction): CompanionState {
  switch (action.type) {
    case 'open-learning':
      return { ...state, screen: 'learning', rooms: dispatchRooms(state.rooms, { type: 'lobby' }) };
    case 'choose-module':
      if (state.screen !== 'learning' || !Number.isInteger(action.index) || !modules[action.index]) return state;
      return { ...state, learning: { ...state.learning, moduleIndex: action.index, selectedAnswer: null } };
    case 'choose-case':
      if (state.screen !== 'learning' || !Object.hasOwn(profileRooms, action.profileId)) return state;
      return { ...state, learning: { ...state.learning, profileId: action.profileId, selectedAnswer: null } };
    case 'answer':
      if (state.screen !== 'learning' || !Number.isInteger(action.index) || !modules[state.learning.moduleIndex].options[action.index]) return state;
      return { ...state, learning: { ...state.learning, selectedAnswer: action.index } };
    case 'practise':
      return {
        ...state, screen: 'simulation', tab: action.tab,
        rooms: dispatchRooms(state.rooms, { type: 'enter-room', id: profileRooms[state.learning.profileId] }),
      };
    case 'choose-rooms':
      return { ...state, screen: 'simulation', rooms: dispatchRooms(state.rooms, { type: 'lobby' }) };
    case 'tab':
      if (state.screen !== 'simulation') return state;
      return { ...state, tab: action.tab, rooms: dispatchRooms(state.rooms, { type: 'pause' }) };
    case 'simulation': {
      // Background events can always park rooms. All other simulation actions
      // (including already queued timer callbacks) are inert while learning.
      if (state.screen === 'learning' && action.action.type !== 'background') return state;
      const roomAction = action.action;
      const profileId = roomAction.type === 'enter-room' ? roomProfiles[roomAction.id] : state.learning.profileId;
      return {
        ...state, rooms: dispatchRooms(state.rooms, roomAction),
        tab: roomAction.type === 'enter-room' ? 'Bedside' : state.tab,
        learning: profileId === state.learning.profileId ? state.learning : { ...state.learning, profileId, selectedAnswer: null },
      };
    }
  }
}
