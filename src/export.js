const FORMAT_VERSION = "1.0.0";

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

  const { events = [], ...currentState } = cloneJson(state);

  return {
    format: "project-hope-simulation",
    formatVersion: FORMAT_VERSION,
    dataOrigin: "fictional_synthetic",
    fictionalPatient: true,
    containsRealPatientData: false,
    storagePolicy: {
      runtime: "memory_only",
      platformRetention: "none",
      export: "user_initiated_json_only"
    },
    exportedAt,
    scenario: cloneJson(scenario),
    currentState,
    timeline: cloneJson([...events].reverse()),
    accessibility: cloneJson(accessibility),
    provenance: {
      application: "Disability Medical Simulations / Project Hope Emulator",
      exportSchema: FORMAT_VERSION
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
  link.download = `project-hope-${safeFilenamePart(payload.scenario.id)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return payload;
}
