import { roomConfigs, roomReferences, rooms, teamRoles } from '../content/rooms';
import type { RoomCoordination, RoomId } from '../content/rooms';
import './code-blue.css';

export interface RoomStatus {
  visited: boolean;
  activated: boolean;
  time: number;
  arrest: boolean;
}

export interface CodeBlueRoomsProps {
  currentRoomId: RoomId;
  roomStatuses: Record<RoomId, RoomStatus>;
  coordination: RoomCoordination;
  modelTime: number;
  running: boolean;
  onEnterRoom: (id: RoomId) => void;
  onActivate: () => void;
  onRoleToggle: (roleId: string) => void;
  onClosedLoop: () => void;
  onReassess: () => void;
  onOpenBedside: () => void;
  onOpenResus: () => void;
  onOpenDebrief: () => void;
}

const safeSeconds = (seconds: number) => Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
const clock = (seconds: number) => {
  const whole = Math.floor(safeSeconds(seconds));
  return `${Math.floor(whole / 60).toString().padStart(2, '0')}:${(whole % 60).toString().padStart(2, '0')}`;
};
const airwayLabel = (airway: 'tracheostomy' | 'ett' | 'mask') => airway === 'tracheostomy'
  ? 'Tracheostomy tube' : airway === 'ett' ? 'Endotracheal tube' : 'Face mask · natural airway';

/**
 * Controlled coordination view only. No clocks, physics, alerts, networking or clinical gates
 * are created here. All callbacks act on the current room through the parent application.
 */
export function CodeBlueRooms({
  currentRoomId, roomStatuses, coordination, modelTime, running, onEnterRoom, onActivate,
  onRoleToggle, onClosedLoop, onReassess, onOpenBedside, onOpenResus, onOpenDebrief,
}: CodeBlueRoomsProps) {
  const currentRoom = roomConfigs[currentRoomId];
  const active = coordination.activatedAt !== null;
  const elapsed = active ? safeSeconds(modelTime - coordination.activatedAt!) : 0;
  const cycleElapsed = elapsed % 120;
  const cycle = Math.floor(elapsed / 120) + 1;
  const readyCount = teamRoles.filter(role => coordination.roles[role.id]).length;

  return (
    <section className="cb-rooms" aria-labelledby="cb-rooms-heading">
      <header className="cb-header">
        <div>
          <p className="cb-eyebrow">NOAH · ADULT TEAM SIMULATION</p>
          <h2 id="cb-rooms-heading">Code Blue rooms</h2>
          <p className="cb-intro">Choose a room, keep the bedside in view, and rehearse a coordinated response.</p>
        </div>
        <div className="cb-session-badges" aria-label="Session scope">
          <span>Adult scenarios</span>
          <span>1:1 active room</span>
          <span>Local session</span>
        </div>
      </header>

      <p className="cb-parking-note">
        <strong>One room advances at a time.</strong> The active room uses the simulation clock;
        other rooms stay parked. Team readiness is recorded in this local session.
      </p>

      <div className="cb-room-grid" aria-label="Available adult training rooms">
        {rooms.map((room, index) => {
          const status = roomStatuses[room.id];
          const current = currentRoomId === room.id;
          const roomClock = current ? modelTime : status.time;
          const state = current ? running ? 'Active · clock running' : 'Active · clock paused'
            : status.visited ? 'Parked · clock stopped' : 'Not yet entered';
          return (
            <article className={`cb-room-card${current ? ' cb-room-current' : ''}`} key={room.id} aria-labelledby={`cb-title-${room.id}`}>
              <div className="cb-room-topline">
                <span className="cb-room-number" aria-hidden="true">0{index + 1}</span>
                <span className={`cb-state${current ? ' cb-state-current' : ''}`}>
                  {current && <span aria-hidden="true">● </span>}{state}
                </span>
              </div>
              <h3 id={`cb-title-${room.id}`}>{room.title}</h3>
              <p className="cb-room-summary">{room.summary}</p>
              <dl className="cb-room-details">
                <div><dt>Entry airway</dt><dd>{airwayLabel(room.airway)}</dd></div>
                <div><dt>Entry source</dt><dd>{room.ventilationSource === 'manual-bag' ? 'Manual bag' : 'Ventilator'}</dd></div>
                <div><dt>Model time</dt><dd className="cb-numeric">{clock(roomClock)}</dd></div>
              </dl>
              <div className="cb-room-flags">
                <span className={`cb-tag${status.arrest ? ' cb-tag-arrest' : ''}`}>
                  {status.arrest ? 'Arrest scenario' : 'Spontaneous circulation'}
                </span>
                <span className="cb-tag">{status.activated ? 'Drill activated' : 'Drill not activated'}</span>
              </div>
              <p className="cb-room-focus">{room.focus}</p>
              <button type="button" className={`cb-button${current ? ' cb-button-primary' : ''}`} data-scan="true"
                aria-label={`${current ? 'Open bedside for' : 'Enter'} ${room.title}`}
                onClick={() => current ? onOpenBedside() : onEnterRoom(room.id)}>
                {current ? 'Open active bedside' : status.visited ? 'Return to room' : 'Enter room'}
                <span aria-hidden="true">↗</span>
              </button>
            </article>
          );
        })}
      </div>

      <section className="cb-console" aria-labelledby="cb-console-heading">
        <div className="cb-console-main">
          <div className="cb-console-heading">
            <div><p className="cb-eyebrow">ACTIVE ROOM · COORDINATION</p><h3 id="cb-console-heading">{currentRoom.title}</h3></div>
            <span className={`cb-tag${active ? ' cb-tag-activated' : ''}`}>{active ? 'Simulated Code Blue active' : 'Ready for a drill'}</span>
          </div>

          <div className="cb-activation">
            <div>
              <h4>Activate help in the scenario</h4>
              <p>Record a simulated emergency call and allocate roles in parallel. Role readiness and read-backs never gate CPR controls.</p>
            </div>
            <button type="button" className="cb-button cb-button-code" data-scan="true" onClick={onActivate} disabled={active} aria-describedby="cb-alert-boundary">
              <span aria-hidden="true">+</span>{active ? 'Simulated call recorded' : 'Activate simulated Code Blue'}
            </button>
          </div>
          <p id="cb-alert-boundary" className="cb-alert-boundary">
            <strong>Simulation only · no real alerts.</strong> Activation records the drill; it does not change circulation.
            For a real emergency, use your local emergency response system immediately.
          </p>

          <div className="cb-role-heading">
            <div><h4>Team roles</h4><p>Mark a role when a responder has acknowledged it in the exercise.</p></div>
            <span className="cb-role-count">{readyCount} / {teamRoles.length} recorded</span>
          </div>
          <div className="cb-role-grid" aria-label="Simulated team role readiness">
            {teamRoles.map(role => {
              const ready = Boolean(coordination.roles[role.id]);
              return (
                <button type="button" key={role.id} className={`cb-role${ready ? ' cb-role-ready' : ''}`} data-scan="true"
                  aria-pressed={ready} aria-label={`${role.label}: ${ready ? 'readiness recorded' : 'readiness not recorded'}`}
                  onClick={() => onRoleToggle(role.id)} aria-describedby={`cb-role-description-${role.id}`}>
                  <span className="cb-role-title"><span className="cb-check" aria-hidden="true">{ready ? '✓' : '+'}</span><strong>{role.label}</strong></span>
                  <span id={`cb-role-description-${role.id}`} className="cb-role-description">{role.description}</span>
                  <span className="cb-role-state">{ready ? 'Readiness recorded · select to clear' : 'Readiness not recorded · select to mark'}</span>
                </button>
              );
            })}
          </div>
          <p className="cb-small-note">These six training roles can be shared or reassigned to fit the scenario. They are not a staffing requirement or proof of clinical competence.</p>
        </div>

        <aside className="cb-cycle" aria-labelledby="cb-cycle-heading">
          <p className="cb-eyebrow">SIMULATION CLOCK</p>
          <h4 id="cb-cycle-heading">Coordination reminder</h4>
          <div className="cb-cycle-time" role="timer" aria-live="off" aria-label={active ? `${clock(cycleElapsed)} into two-minute reminder period ${cycle}` : 'Reminder not started'}>
            {active ? clock(cycleElapsed) : '—:—'}<span> / 02:00</span>
          </div>
          <div className="cb-cycle-track" aria-hidden="true"><span style={{ width: `${cycleElapsed / 120 * 100}%` }}/></div>
          <p className="cb-cycle-state">{active ? `Period ${cycle} · ${clock(elapsed)} since activation` : 'Starts when the simulated call is recorded'}</p>
          <span className="cb-clock-state">{running ? 'Model clock running' : 'Model clock paused'}</span>
          <p className="cb-cycle-note">A repeating two-minute reminder, not an automated protocol. It never pauses compressions or directs a rhythm check. Pausing the model also freezes this display.</p>

          <div className="cb-coordination-actions">
            <button type="button" className="cb-button" data-scan="true" onClick={onClosedLoop}>Record closed-loop read-back<span className="cb-count">{coordination.closedLoopCount}</span></button>
            <p>Name the task and recipient; acknowledge it and report completion in the exercise.</p>
            <button type="button" className="cb-button" data-scan="true" onClick={onReassess}>Record team reassessment<span className="cb-count">{coordination.reassessments}</span></button>
            <p>Records a coordination checkpoint. Review the patient and observations at the bedside.</p>
          </div>
        </aside>

        <nav className="cb-next-actions" aria-label="Active room work areas">
          <button type="button" className="cb-button" data-scan="true" onClick={onOpenBedside}>Open bedside</button>
          <button type="button" className="cb-button cb-button-primary" data-scan="true" onClick={onOpenResus}>Open ventilation &amp; CPR controls<span aria-hidden="true">→</span></button>
          <button type="button" className="cb-button" data-scan="true" onClick={onOpenDebrief}>Open debrief</button>
        </nav>
      </section>

      <footer className="cb-references">
        <p><strong>Training references.</strong> ANZCOR supports early help, minimising CPR interruptions and team communication. This room console covers coordination; it is not a complete ALS algorithm. The role layout and clock display are simulator design choices.</p>
        <div className="cb-reference-links">
          {roomReferences.map(reference => <a key={reference.url} href={reference.url} target="_blank" rel="noreferrer" data-scan="true">{reference.label}<span className="cb-sr-only"> (opens in a new tab)</span></a>)}
        </div>
      </footer>
    </section>
  );
}
