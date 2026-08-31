let sessionId = null;
let syncedEventIds = new Set();
let enabled = true;

async function post(payload) {
  if (!enabled) return null;

  const response = await fetch("/api/simulation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (response.status === 503) {
    enabled = false;
    return null;
  }

  if (!response.ok) throw new Error(`Persistence request failed: ${response.status}`);
  return response.json();
}

function eventSequence(event) {
  const prefix = Number.parseInt(String(event.id).split("-", 1)[0], 10);
  return Number.isInteger(prefix) && prefix > 0 ? prefix : null;
}

export async function startPersistenceSession(scenarioId, accessibility = {}) {
  syncedEventIds = new Set();
  const result = await post({ op: "start", scenarioId, accessibility });
  sessionId = result?.sessionId ?? null;
  return sessionId;
}

export async function syncEvents(events) {
  if (!sessionId || !enabled) return;

  const pending = [...events]
    .reverse()
    .filter((event) => !syncedEventIds.has(event.id))
    .map((event) => ({
      id: event.id,
      sequenceNo: eventSequence(event),
      simSeconds: event.seconds,
      eventType: event.type,
      actor: event.detail?.actor ?? null,
      payload: {
        message: event.message,
        detail: event.detail ?? {}
      }
    }))
    .filter((event) => event.sequenceNo !== null);

  if (pending.length === 0) return;
  await post({ op: "events", sessionId, events: pending });
  pending.forEach((event) => syncedEventIds.add(event.id));
}

export async function saveSnapshot(state) {
  if (!sessionId || !enabled) return;
  await post({
    op: "snapshot",
    sessionId,
    sequenceNo: state.events.length,
    worldState: {
      scenarioId: state.scenarioId,
      seconds: state.seconds,
      paused: state.paused,
      pauseReason: state.pauseReason,
      selectedChoiceId: state.selectedChoiceId,
      completed: state.completed,
      stations: state.stations
    }
  });
}

export async function completePersistenceSession() {
  if (!sessionId || !enabled) return;
  await post({ op: "complete", sessionId });
}

export function persistenceStatus() {
  return { enabled, sessionId };
}
