import { stationDefinitions } from "./scenarios.js";
import { createGuardianRuntimeContext } from "./virgal/guardian-config.js";
import { commitEvent, createWorldEngine, tickWorld } from "./virgal/world-engine.js";

const stationOrder = ["available", "selected", "checked", "assigned", "committed"];

export function createRuntime(scenarioId) {
  return {
    scenarioId,
    seconds: 0,
    clinicalSeconds: 0,
    evaluationSeconds: 0,
    paused: false,
    pauseReason: null,
    communicationComposing: false,
    selectedChoiceId: null,
    completed: false,
    events: [],
    world: createWorldEngine({ scenarioId, seed: `${scenarioId}:world` }),
    stations: Object.fromEntries(stationDefinitions.map((station) => [station.id, "available"]))
  };
}

export function createGuardedRuntime(scenarioId, {
  guardianConfig,
  jurisdiction = "NATIONAL_FALLBACK",
  scenarioVersion = "1.0.0",
  seed = `${scenarioId}:world`
} = {}) {
  const base = createRuntime(scenarioId);
  return {
    ...base,
    jurisdiction,
    scenarioVersion,
    capacityStatus: "presumed",
    substituteAuthority: null,
    guardian: createGuardianRuntimeContext(guardianConfig),
    world: createWorldEngine({
      scenarioId,
      seed,
      branchId: "canonical",
      scenarioVersion
    })
  };
}

export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function appendEvent(state, type, message, detail = {}) {
  const world = commitEvent(state.world, {
    type,
    domain: detail.domain ?? "SYSTEM",
    actorRefs: detail.actor ? [detail.actor] : [],
    targetRefs: detail.target ? [detail.target] : [],
    payload: { message, detail },
    causalParents: detail.causalParents ?? []
  });
  const committed = world.events.at(-1);
  return {
    ...state,
    world,
    events: [
      {
        id: committed.eventId,
        type,
        message,
        detail,
        seconds: state.seconds,
        worldTime: world.worldTime,
        eventHash: committed.eventHash,
        previousEventHash: committed.previousEventHash
      },
      ...state.events
    ]
  };
}

export function tick(state) {
  if (state.paused && state.pauseReason !== "communication") return state;
  const world = tickWorld(state.world, { seconds: 1 });
  const clinicalSeconds = state.clinicalSeconds + 1;
  const evaluationSeconds = state.communicationComposing
    ? state.evaluationSeconds
    : state.evaluationSeconds + 1;
  return {
    ...state,
    world,
    seconds: clinicalSeconds,
    clinicalSeconds,
    evaluationSeconds
  };
}

export function pauseForCommunication(state) {
  return appendEvent(
    {
      ...state,
      paused: false,
      pauseReason: "communication",
      communicationComposing: true
    },
    "AAC_COMPOSING",
    "Communication composition started; clinical/world time continues while evaluation time pauses.",
    { domain: "ACCESS" }
  );
}

export function restoreCommunication(state) {
  return appendEvent(
    {
      ...state,
      paused: false,
      pauseReason: null,
      communicationComposing: false
    },
    "AAC_RESTORED",
    "Communication access restored and confirmed.",
    { domain: "ACCESS" }
  );
}

export function selectChoice(state, choiceId) {
  return { ...state, selectedChoiceId: choiceId };
}

export function commitChoice(state, scenario) {
  const choice = scenario.choices.find((item) => item.id === state.selectedChoiceId);
  if (!choice) {
    return {
      state,
      feedback: "Select a decision before committing.",
      safe: false
    };
  }

  const nextState = appendEvent(
    { ...state, completed: choice.safe || state.completed },
    "DECISION_COMMITTED",
    choice.label,
    { choiceId: choice.id, safe: choice.safe, domain: "AGENCY" }
  );

  return { state: nextState, feedback: choice.feedback, safe: choice.safe };
}

export function advanceStation(state, stationId) {
  const current = state.stations[stationId];
  const index = stationOrder.indexOf(current);
  if (index < 0 || index === stationOrder.length - 1) return state;

  const nextStatus = stationOrder[index + 1];
  return appendEvent(
    {
      ...state,
      stations: { ...state.stations, [stationId]: nextStatus }
    },
    "STATION_ADVANCED",
    `Station ${stationId} moved to ${nextStatus}.`,
    { stationId, previousStatus: current, nextStatus, domain: "SYSTEM" }
  );
}

export function reassess(state) {
  return appendEvent(
    state,
    "PATIENT_REASSESSED",
    "Patient, baseline, communication, circuit, monitoring and current plan reassessed.",
    { domain: "CLINICAL" }
  );
}

export function stationNextLabel(status) {
  const index = stationOrder.indexOf(status);
  if (index < 0 || index === stationOrder.length - 1) return "Committed";
  const next = stationOrder[index + 1];
  return next.charAt(0).toUpperCase() + next.slice(1);
}
