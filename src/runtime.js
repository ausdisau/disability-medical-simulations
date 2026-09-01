import { stationDefinitions } from "./scenarios.js";

const stationOrder = ["available", "selected", "checked", "assigned", "committed"];

export function createRuntime(scenarioId) {
  return {
    scenarioId,
    seconds: 0,
    evaluationSeconds: 0,
    paused: false,
    pauseReason: null,
    evaluationPaused: false,
    evaluationPauseReason: null,
    selectedChoiceId: null,
    completed: false,
    events: [],
    stations: Object.fromEntries(stationDefinitions.map((station) => [station.id, "available"]))
  };
}

export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function appendEvent(state, type, message, detail = {}) {
  return {
    ...state,
    events: [
      { id: `${state.events.length + 1}-${type}`, type, message, detail, seconds: state.seconds },
      ...state.events
    ]
  };
}

export function tick(state) {
  if (state.paused) return state;
  return {
    ...state,
    seconds: state.seconds + 1,
    evaluationSeconds: state.evaluationPaused ? state.evaluationSeconds : state.evaluationSeconds + 1
  };
}

export function pauseForCommunication(state) {
  return appendEvent(
    {
      ...state,
      evaluationPaused: true,
      evaluationPauseReason: "communication"
    },
    "AAC_EVALUATION_PAUSED",
    "Evaluation clock paused for communication access while clinical time continues."
  );
}

export function restoreCommunication(state) {
  return appendEvent(
    {
      ...state,
      evaluationPaused: false,
      evaluationPauseReason: null
    },
    "AAC_RESTORED",
    "Communication access restored and confirmed; evaluation clock resumed."
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
    { choiceId: choice.id, safe: choice.safe }
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
    { stationId, previousStatus: current, nextStatus }
  );
}

export function reassess(state) {
  return appendEvent(
    state,
    "PATIENT_REASSESSED",
    "Patient, baseline, communication, circuit, monitoring and current plan reassessed."
  );
}

export function stationNextLabel(status) {
  const index = stationOrder.indexOf(status);
  if (index < 0 || index === stationOrder.length - 1) return "Committed";
  const next = stationOrder[index + 1];
  return next.charAt(0).toUpperCase() + next.slice(1);
}
