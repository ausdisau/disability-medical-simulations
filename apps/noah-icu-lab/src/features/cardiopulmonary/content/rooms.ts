import type { ProfileId, ScenarioId } from './cases';

export type RoomId = 'icu-01' | 'icu-02' | 'skills-03';
export type TeamRoleId = 'bedside' | 'lead' | 'airway' | 'compressions' | 'monitor' | 'recorder';

export interface RoomConfig {
  id: RoomId;
  title: string;
  profileId: ProfileId;
  scenarioId: ScenarioId;
  airway: 'tracheostomy' | 'ett' | 'mask';
  ventilationSource: 'ventilator' | 'manual-bag';
  summary: string;
  focus: string;
}

/** Fictional adult rooms. Entering a room and parking its model are parent-owned actions. */
export const rooms: readonly RoomConfig[] = [
  {
    id: 'icu-01',
    title: 'ICU 01 · CP airway review',
    profileId: 'cp',
    scenarioId: 'secretions',
    airway: 'tracheostomy',
    ventilationSource: 'ventilator',
    summary: 'Fictional adult with cerebral palsy and retained secretions, using an existing tracheostomy.',
    focus: 'Airway assessment · communication access · reassessment',
  },
  {
    id: 'icu-02',
    title: 'ICU 02 · DMD arrest drill',
    profileId: 'dmd',
    scenarioId: 'arrest',
    airway: 'ett',
    ventilationSource: 'ventilator',
    summary: 'Fictional adult with Duchenne muscular dystrophy in a deliberately loaded cardiac-arrest scenario.',
    focus: 'Arrest recognition · existing ETT · parallel teamwork',
  },
  {
    id: 'skills-03',
    title: 'Skills 03 · BVM arrest drill',
    profileId: 'adult',
    scenarioId: 'arrest',
    airway: 'mask',
    ventilationSource: 'manual-bag',
    summary: 'Generic adult skills scenario with a face mask and manual bag, without an advanced airway.',
    focus: 'Bag–valve–mask · compression/ventilation coordination',
  },
];

export const roomConfigs: Record<RoomId, RoomConfig> = Object.fromEntries(
  rooms.map(room => [room.id, room]),
) as Record<RoomId, RoomConfig>;

export const teamRoles: readonly {
  id: TeamRoleId;
  label: string;
  description: string;
}[] = [
  { id: 'bedside', label: 'Bedside nurse', description: 'Maintain the patient overview, communicate needs and share the baseline.' },
  { id: 'lead', label: 'Team lead', description: 'Name priorities, allocate tasks and confirm who is doing what.' },
  { id: 'airway', label: 'Airway responder', description: 'Coordinate the existing airway and ventilation within the training role.' },
  { id: 'compressions', label: 'Compression responder', description: 'Coordinate compressions and relief when arrest is recognised.' },
  { id: 'monitor', label: 'Monitoring responder', description: 'Report observations, equipment status and signal quality.' },
  { id: 'recorder', label: 'Recorder', description: 'Capture events, times and action read-backs for debrief.' },
];

export interface RoomCoordination {
  activatedAt: number | null;
  roles: Record<string, boolean>;
  closedLoopCount: number;
  reassessments: number;
}

/** Always return fresh records: readiness in one room never assigns another room's team. */
export function initialRoomCoordination(): RoomCoordination {
  return {
    activatedAt: null,
    roles: Object.fromEntries(teamRoles.map(role => [role.id, false])),
    closedLoopCount: 0,
    reassessments: 0,
  };
}

/** Primary guidance checked 29 October 2026. The role layout is a simulation design choice. */
export const roomReferences = [
  {
    label: 'ANZCOR 8 · CPR',
    url: 'https://www.anzcor.org/home/basic-life-support/guideline-8-cardiopulmonary-resuscitation-cpr',
  },
  {
    label: 'ANZCOR 11.2 · Adult ALS',
    url: 'https://www.anzcor.org/home/adult-advanced-life-support/guideline-11-2-protocols-for-adult-advanced-life-support',
  },
  {
    label: 'ANZCOR 11.6 · Equipment and techniques',
    url: 'https://www.anzcor.org/home/adult-advanced-life-support/guideline-11-6-equipment-and-techniques-in-adult-advanced-life-support',
  },
  {
    label: 'ANZCOR 10.2 · Team training',
    url: 'https://www.anzcor.org/home/education-and-implementation/guideline-10-2-advanced-life-support-als-training',
  },
] as const;
