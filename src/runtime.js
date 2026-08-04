import { stationDefinitions } from "./scenarios.js";

const stationOrder = ["available", "selected", "checked", "assigned", "committed"];

function clamp(value, min = 0, max = 5) {
  return Math.max(min, Math.min(max, value));
}

function mergeNumeric(target, patch = {}) {
  const next = { ...target };
  Object.entries(patch).forEach(([key, value]) => {
    if (typeof value === "number" && typeof next[key] === "number") {
      next[key] = clamp(next[key] + value);
    } else {
      next[key] = value;
    }
  });
  return next;
}

function applyEffects(state, effects = {}) {
  return {
    ...state,
    body: mergeNumeric(state.body, effects.body),
    voice: { ...state.voice, ...(effects.voice || {}) },
    system: { ...state.system, ...(effects.system || {}) },
    trust: mergeNumeric(state.trust, effects.trust, -5, 5),
    crisisDebt: Math.max(0, state.crisisDebt + (effects.crisisDebt || 0))
  };
}

export function createRuntime(scenarioId, initialState = null, startNodeId = null) {
  if (initialState && startNodeId) {
    return {
      scenarioId,
      nodeId: startNodeId,
      seconds: 0,
      paused: false,
      pauseReason: null,
      selectedChoiceId: null,
      completed: false,
      events: [],
      history: [startNodeId],
      visited: { [startNodeId]: 1 },
      body: structuredClone(initialState.body),
      voice: structuredClone(initialState.voice),
      system: structuredClone(initialState.system),
      crisisDebt: initialState.crisisDebt,
      trust: structuredClone(initialState.trust),
      stations: Object.fromEntries(stationDefinitions.map((station) => [station.id, "available"]))
    };
  }

  return {
    scenarioId,
    seconds: 0,
    paused: false,
    pauseReason: null,
    selectedChoiceId: null,
    completed: false,
    events: [],
    stations: Object.fromEntries(stationDefinitions.map((station) => [station.id, "available"]))
  };
}

export function createTreeRuntime(tree) {
  return createRuntime(tree.id, tree.initialState, tree.startNodeId);
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
  if (state.paused || state.completed) return state;
  return { ...state, seconds: state.seconds + 1 };
}

export function pauseForCommunication(state) {
  return appendEvent(
    { ...state, paused: true, pauseReason: "communication" },
    "AAC_PAUSED",
    "Simulation paused for communication access."
  );
}

export function restoreCommunication(state) {
  return appendEvent(
    {
      ...state,
      paused: false,
      pauseReason: null,
      system: state.system ? { ...state.system, aacAvailable: true, aacCalibrated: true } : state.system,
      voice: state.voice ? { ...state.voice, reliability: "reliable-with-fatigue" } : state.voice
    },
    "AAC_RESTORED",
    "Communication access restored and confirmed."
  );
}

export function selectChoice(state, choiceId) {
  return { ...state, selectedChoiceId: choiceId };
}

export function commitTreeChoice(state, tree) {
  const node = tree.nodes[state.nodeId];
  const choice = node?.choices?.find((item) => item.id === state.selectedChoiceId);

  if (!choice) {
    return {
      state,
      feedback: "Select a decision before committing.",
      safe: false
    };
  }

  let nextState = applyEffects(state, choice.effects);
  const nextNode = tree.nodes[choice.next];
  nextState = {
    ...nextState,
    nodeId: choice.next,
    selectedChoiceId: null,
    completed: choice.next === "complete",
    history: [...nextState.history, choice.next],
    visited: {
      ...nextState.visited,
      [choice.next]: (nextState.visited[choice.next] || 0) + 1
    }
  };

  if (nextNode?.automaticEffects) {
    nextState = applyEffects(nextState, nextNode.automaticEffects);
  }

  nextState = appendEvent(
    nextState,
    "DECISION_COMMITTED",
    choice.label,
    {
      choiceId: choice.id,
      from: state.nodeId,
      to: choice.next,
      crisisDebt: nextState.crisisDebt
    }
  );

  return {
    state: nextState,
    feedback: choice.feedback,
    safe: (choice.effects?.crisisDebt || 0) <= 0 && !choice.id.includes("delay")
  };
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
  const next = state.body
    ? applyEffects(state, {
        body: { comfort: 1 },
        crisisDebt: -1
      })
    : state;

  return appendEvent(
    next,
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

export function summarizeOutcome(state) {
  if (!state.body) return null;
  return {
    airway: state.body.airway,
    ventilation: state.body.ventilation,
    oxygenation: state.body.oxygenation,
    voice: state.voice.reliability,
    crisisDebt: state.crisisDebt,
    rohanTrust: state.trust.rohanTeam,
    motherTrust: state.trust.motherTeam,
    decisions: state.history.length - 1
  };
}
