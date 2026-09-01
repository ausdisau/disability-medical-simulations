import { stationDefinitions } from "./scenarios.js";
import { RULE_PACK_VERSION } from "./version.js";

export const STATION_STATES = ["available", "relevant", "assigned", "committed", "applied"];

function scenarioIdOf(scenarioOrId) {
  return typeof scenarioOrId === "string" ? scenarioOrId : scenarioOrId?.id;
}

function scenarioVersionOf(scenarioOrId) {
  return typeof scenarioOrId === "object" && scenarioOrId?.version ? scenarioOrId.version : "unresolved";
}

function stationById(stationId) {
  return stationDefinitions.find((item) => item.id === stationId) || null;
}

function addCommand(state, type, payload = {}) {
  const command = {
    sequence: state.commandLog.length + 1,
    type,
    payload
  };
  return { ...state, commandLog: [...state.commandLog, command] };
}

export function appendEvent(state, type, message, detail = {}) {
  const event = {
    id: `${state.events.length + 1}-${type}`,
    sequence: state.events.length + 1,
    type,
    message,
    detail,
    clinicalSeconds: state.clinicalSeconds,
    evaluationSeconds: state.evaluationSeconds
  };
  return { ...state, events: [...state.events, event] };
}

function initialStationState(station) {
  return station.initialStatus || "available";
}

export function createRuntime(scenarioOrId, options = {}) {
  const scenarioId = scenarioIdOf(scenarioOrId);
  if (!scenarioId) throw new Error("scenario id is required");

  const startPaused = options.startPaused !== false;
  return {
    scenarioId,
    scenarioVersion: scenarioVersionOf(scenarioOrId),
    rulePackVersion: RULE_PACK_VERSION,
    seed: Number.isInteger(options.seed) ? options.seed : 17,
    runState: startPaused ? "PAUSED" : "RUNNING",
    clinicalSeconds: 0,
    evaluationSeconds: 0,
    paused: startPaused,
    pauseReason: startPaused ? "initial" : null,
    evaluationPaused: false,
    evaluationPauseReason: null,
    phase: "opening",
    selectedChoiceId: null,
    lastDecisionId: null,
    completed: false,
    clinical: {
      baselineComparator: "active",
      acuteChangeStatus: "scenario_defined",
      reassessmentCount: 0
    },
    communication: {
      status: "available",
      composing: false,
      reliability: "scenario_defined",
      response: "unknown",
      lastReliableInstruction: null,
      accessFailureCause: null
    },
    agency: {
      capacity: "presumed",
      decisionAuthority: "patient",
      consent: "not_inferred",
      supporterRole: "support_only"
    },
    system: {
      storage: "memory_only",
      platformRetention: "none",
      externalAuthority: "none"
    },
    evidence: {
      currentPlanReviewed: false,
      breathingReviewApplied: false,
      reassessmentCount: 0
    },
    commandLog: [],
    events: [],
    stations: Object.fromEntries(stationDefinitions.map((station) => [station.id, initialStationState(station)]))
  };
}

export function formatTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safe / 60).toString().padStart(2, "0");
  const remainder = Math.floor(safe % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function startSimulation(state) {
  if (!state.paused && state.runState === "RUNNING") return state;
  let next = addCommand(state, "START");
  next = {
    ...next,
    runState: "RUNNING",
    paused: false,
    pauseReason: null,
    evaluationPaused: next.communication.composing,
    evaluationPauseReason: next.communication.composing ? "communication" : null
  };
  return appendEvent(next, "SIMULATION_STARTED", "Simulation started. Clinical and evaluation clocks are active unless communication access pauses evaluation time.");
}

export function facilitatorPause(state, reason = "accessibility_or_facilitation") {
  if (state.paused && state.pauseReason === reason) return state;
  let next = addCommand(state, "FACILITATOR_PAUSE", { reason });
  next = { ...next, runState: "PAUSED", paused: true, pauseReason: reason };
  return appendEvent(next, "FACILITATOR_PAUSED", "Facilitator pause: clinical and evaluation clocks are frozen.", { reason });
}

export function resumeSimulation(state) {
  let next = addCommand(state, "RESUME");
  next = {
    ...next,
    runState: "RUNNING",
    paused: false,
    pauseReason: null,
    evaluationPaused: next.communication.composing,
    evaluationPauseReason: next.communication.composing ? "communication" : null
  };
  return appendEvent(next, "SIMULATION_RESUMED", "Simulation resumed.");
}

export function tick(state, seconds = 1) {
  const amount = Math.max(0, Math.floor(Number(seconds) || 0));
  if (state.paused || amount === 0) return state;
  let next = addCommand(state, "ADVANCE_TIME", { seconds: amount });
  next = {
    ...next,
    clinicalSeconds: next.clinicalSeconds + amount,
    evaluationSeconds: next.evaluationPaused ? next.evaluationSeconds : next.evaluationSeconds + amount
  };
  return next;
}

export function pauseForCommunication(state) {
  let next = addCommand(state, "AAC_COMPOSING");
  next = {
    ...next,
    communication: {
      ...next.communication,
      composing: true
    },
    evaluationPaused: true,
    evaluationPauseReason: "communication"
  };
  return appendEvent(next, "AAC_COMPOSING", "Evaluation clock paused for AAC composition/scanning while clinical time continues.");
}

export function restoreCommunication(state) {
  let next = addCommand(state, "AAC_RESTORED");
  next = {
    ...next,
    communication: {
      ...next.communication,
      status: "available",
      composing: false,
      reliability: "scenario_defined",
      accessFailureCause: null
    },
    evaluationPaused: false,
    evaluationPauseReason: null
  };
  return appendEvent(next, "AAC_RESTORED", "Communication access restored. No patient answer has been inferred from the interruption.");
}

export function selectChoice(state, choiceId) {
  const next = addCommand(state, "SELECT_CHOICE", { choiceId });
  return { ...next, selectedChoiceId: choiceId };
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

  let next = addCommand(state, "COMMIT_CHOICE", { choiceId: choice.id });
  next = {
    ...next,
    lastDecisionId: choice.id,
    phase: choice.nextPhase || next.phase,
    completed: choice.terminal === true ? true : next.completed
  };

  if (choice.effect?.communication === "interrupted") {
    next = {
      ...next,
      communication: {
        ...next.communication,
        status: "interrupted",
        composing: false,
        reliability: "unknown",
        response: "unknown",
        accessFailureCause: "learner_action"
      },
      evaluationPaused: false,
      evaluationPauseReason: null
    };
  }

  next = appendEvent(next, "DECISION_COMMITTED", choice.label, {
    choiceId: choice.id,
    safe: choice.safe === true,
    nextPhase: choice.nextPhase || null
  });

  return { state: next, feedback: choice.feedback, safe: choice.safe === true };
}

export function stationGateStatus(state, stationOrId) {
  const station = typeof stationOrId === "string" ? stationById(stationOrId) : stationOrId;
  if (!station) return { allowed: false, reason: "Station definition not found." };
  const gate = station.gate;
  if (!gate) return { allowed: true, reason: null };

  if (gate.requiresReassessment && state.evidence.reassessmentCount < 1) {
    return { allowed: false, reason: "A patient-centred reassessment is required before this evidence gate can open." };
  }

  if (Array.isArray(gate.requiresAppliedStations)) {
    const missing = gate.requiresAppliedStations.filter((id) => state.stations[id] !== "applied");
    if (missing.length > 0) {
      return { allowed: false, reason: `Required station evidence not yet applied: ${missing.join(", ")}.` };
    }
  }

  if (Array.isArray(gate.requiresAnyAppliedStations)) {
    const satisfied = gate.requiresAnyAppliedStations.some((id) => state.stations[id] === "applied");
    if (!satisfied) {
      return { allowed: false, reason: `Apply at least one supporting station first: ${gate.requiresAnyAppliedStations.join(" or ")}.` };
    }
  }

  return { allowed: true, reason: null };
}

function applyStationEvidence(state, stationId, nextStatus) {
  if (nextStatus !== "applied") return state;

  const evidence = { ...state.evidence };
  if (stationId === "04") evidence.currentPlanReviewed = true;
  if (stationId === "09" || stationId === "17") evidence.breathingReviewApplied = true;

  return { ...state, evidence };
}

export function advanceStation(state, stationId) {
  const station = stationById(stationId);
  if (!station) return state;

  const current = state.stations[stationId];
  let next = addCommand(state, "ADVANCE_STATION", { stationId, previousStatus: current });

  if (current === "locked_by_evidence") {
    const gate = stationGateStatus(next, station);
    if (!gate.allowed) {
      return appendEvent(next, "STATION_BLOCKED", `Station ${stationId} remains locked by evidence.`, {
        stationId,
        previousStatus: current,
        gateReason: gate.reason
      });
    }

    next = {
      ...next,
      stations: { ...next.stations, [stationId]: "relevant" }
    };
    return appendEvent(next, "STATION_GATE_OPENED", `Station ${stationId} evidence gate opened; state is now relevant.`, {
      stationId,
      previousStatus: current,
      nextStatus: "relevant"
    });
  }

  const index = STATION_STATES.indexOf(current);
  if (index < 0 || index === STATION_STATES.length - 1) return next;

  const nextStatus = STATION_STATES[index + 1];
  next = {
    ...next,
    stations: { ...next.stations, [stationId]: nextStatus }
  };
  next = applyStationEvidence(next, stationId, nextStatus);

  return appendEvent(next, "STATION_ADVANCED", `Station ${stationId} moved to ${nextStatus}.`, {
    stationId,
    previousStatus: current,
    nextStatus
  });
}

export function reassess(state) {
  let next = addCommand(state, "REASSESS");
  next = {
    ...next,
    clinical: {
      ...next.clinical,
      reassessmentCount: next.clinical.reassessmentCount + 1
    },
    evidence: {
      ...next.evidence,
      reassessmentCount: next.evidence.reassessmentCount + 1
    }
  };
  return appendEvent(next, "PATIENT_REASSESSED", "Patient, baseline, communication access, current plan, monitoring and system readiness reassessed.");
}

export function stationNextLabel(status) {
  if (status === "locked_by_evidence") return "Check evidence gate";
  const index = STATION_STATES.indexOf(status);
  if (index < 0 || index === STATION_STATES.length - 1) return "Applied";
  const next = STATION_STATES[index + 1];
  return next.replaceAll("_", " ").replace(/^./, (char) => char.toUpperCase());
}

export function replayCommands(scenario, commands, options = {}) {
  let state = createRuntime(scenario, { ...options, startPaused: true });
  for (const command of commands) {
    switch (command.type) {
      case "START":
        state = startSimulation({ ...state, commandLog: state.commandLog });
        break;
      case "FACILITATOR_PAUSE":
        state = facilitatorPause(state, command.payload?.reason);
        break;
      case "RESUME":
        state = resumeSimulation(state);
        break;
      case "ADVANCE_TIME":
        state = tick(state, command.payload?.seconds || 0);
        break;
      case "AAC_COMPOSING":
        state = pauseForCommunication(state);
        break;
      case "AAC_RESTORED":
        state = restoreCommunication(state);
        break;
      case "SELECT_CHOICE":
        state = selectChoice(state, command.payload?.choiceId);
        break;
      case "COMMIT_CHOICE":
        state = commitChoice(state, scenario).state;
        break;
      case "ADVANCE_STATION":
        state = advanceStation(state, command.payload?.stationId);
        break;
      case "REASSESS":
        state = reassess(state);
        break;
      default:
        throw new Error(`unsupported replay command: ${command.type}`);
    }
  }
  return state;
}
