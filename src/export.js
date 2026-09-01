import { APP_VERSION, EXPORT_FORMAT_VERSION } from "./version.js";
import { auditPersonhood } from "./guardian.js";

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeFilenamePart(value) {
  return String(value || "simulation")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "simulation";
}

export function buildSimulationExport({ scenario, state, accessibility = {}, exportedAt = new Date().toISOString() }) {
  if (!scenario || !state) throw new Error("scenario and state are required");
  if (scenario.data_origin !== "fictional_synthetic" || scenario.fictional_patient !== true) {
    throw new Error("Project Hope v1 alpha exports only fictional synthetic scenarios");
  }

  return {
    format: "project-hope-simulation",
    formatVersion: EXPORT_FORMAT_VERSION,
    applicationVersion: APP_VERSION,
    dataOrigin: "fictional_synthetic",
    fictionalPatient: true,
    containsRealPatientData: false,
    storagePolicy: {
      runtime: "memory_only",
      platformRetention: "none",
      autosave: false,
      browserPersistence: false,
      serverDatabase: false,
      export: "user_initiated_json_only"
    },
    exportedAt,
    scenario: cloneJson(scenario),
    runtime: {
      scenarioId: state.scenarioId,
      scenarioVersion: state.scenarioVersion,
      rulePackVersion: state.rulePackVersion,
      seed: state.seed,
      runState: state.runState,
      phase: state.phase,
      clinicalSeconds: state.clinicalSeconds,
      evaluationSeconds: state.evaluationSeconds,
      paused: state.paused,
      pauseReason: state.pauseReason,
      evaluationPaused: state.evaluationPaused,
      evaluationPauseReason: state.evaluationPauseReason,
      selectedChoiceId: state.selectedChoiceId,
      lastDecisionId: state.lastDecisionId,
      completed: state.completed,
      communication: cloneJson(state.communication),
      agency: cloneJson(state.agency),
      system: cloneJson(state.system),
      stations: cloneJson(state.stations)
    },
    commandLog: cloneJson(state.commandLog),
    timeline: cloneJson(state.events),
    personhoodGuardian: cloneJson(auditPersonhood(state, scenario)),
    accessibility: cloneJson(accessibility),
    provenance: {
      application: "Project Hope Emulator",
      applicationVersion: APP_VERSION,
      rulePackVersion: state.rulePackVersion,
      exportSchema: EXPORT_FORMAT_VERSION,
      authorityHierarchy: [
        "protected_patient_facts_and_authored_choices",
        "deterministic_structured_state_and_command_log",
        "reviewed_rule_pack",
        "bounded_intelligence_proposals",
        "narrative_and_visual_presentation"
      ]
    }
  };
}

export function downloadSimulationExport(options) {
  const payload = buildSimulationExport(options);
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `project-hope-${safeFilenamePart(payload.scenario.id)}-${safeFilenamePart(payload.applicationVersion)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return payload;
}
