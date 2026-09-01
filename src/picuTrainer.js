export const PICU_TRAINER_SOURCE = Object.freeze({
  repository: "ausdisau/PICU-Trainer",
  revision: "80521c7a234864fa6996171ea024f895d33919d3",
  stationSourcePath: "artifacts/picu-lms/src/lib/narrative-data.ts",
  designSystemPath: "artifacts/ias-design-system",
  status: "ported_for_alpha_review",
  importedScope: [
    "course_navigation_structure",
    "instrumental_action_station_semantics",
    "station_items_01_through_20",
    "facilitator_ui_patterns",
    "accessibility_patterns"
  ],
  excludedScope: [
    "localStorage_or_other_session_persistence",
    "persona_store_and_private_identity_fields",
    "real_person_profile_modules",
    "api_server_persona_routes",
    "patient_specific_narrative_as_runtime_truth",
    "medication_doses_ventilator_settings_or_procedural_technique"
  ]
});

export const PICU_COURSE_SECTIONS = Object.freeze([
  { id: "orientation", label: "Orientation", target: "simulation-main" },
  { id: "scene", label: "Central PICU Scene", target: "patient-scene" },
  { id: "airway", label: "Airway 01–08", target: "domain-airway" },
  { id: "breathing", label: "Breathing & Equipment 09–17", target: "domain-breathing" },
  { id: "circulation", label: "Circulation 18–20", target: "domain-circulation" },
  { id: "integrated", label: "Integrated Scenario", target: "decision-title" },
  { id: "debrief", label: "Debrief", target: "debrief-panel" },
  { id: "completion", label: "Completion / JSON", target: "session-data-card" }
]);

function station(id, label, kind, purpose, options = {}) {
  return Object.freeze({
    id,
    label,
    kind,
    purpose,
    initialStatus: options.initialStatus || "available",
    lockReason: options.lockReason || null,
    gate: options.gate || null,
    sourceTitle: options.sourceTitle || label,
    sourceRepository: PICU_TRAINER_SOURCE.repository,
    sourceRevision: PICU_TRAINER_SOURCE.revision,
    reviewStatus: PICU_TRAINER_SOURCE.status
  });
}

// Ported from the first 20 Instrumental Action Station items in PICU-Trainer.
// Descriptions are deliberately genericised so the station library can be used
// across fictional Project Hope cases without importing a real-person persona or
// treating equipment presence as a clinical indication.
export const PICU_IAS_STATIONS = Object.freeze([
  station("01", "Spare tracheostomy tube — same size", "airway", "Makes backup airway equipment visible for readiness checks; presence does not establish an indication."),
  station("02", "Smaller rescue tracheostomy tube", "airway", "Makes the plan-specified smaller rescue option visible without authorising its use."),
  station("03", "Alternative emergency airway — as specified", "airway", "Keeps plan-specific alternative airway options visible but evidence-locked until the current airway plan has been reviewed.", {
    initialStatus: "locked_by_evidence",
    lockReason: "Review and apply the current airway plan station before considering a plan-specific alternative route.",
    gate: { requiresAppliedStations: ["04"] }
  }),
  station("04", "Current airway plan card", "airway", "Provides the reviewed route, cautions, responder roles and rescue boundaries for the fictional case."),
  station("05", "Tracheostomy securing ties", "airway", "Supports checking tube security and mechanical loading against the current plan."),
  station("06", "Dressings and airway-care supplies", "airway", "Represents routine airway-site care supplies without implying an acute intervention."),
  station("07", "Suction catheters — multiple sizes", "airway", "Supports secretion-management readiness checks against the current plan and compatibility requirements."),
  station("08", "Portable suction unit — battery powered", "airway", "Provides suction backup independent of wall supply; readiness must still be checked."),

  station("09", "Spare ventilator circuit", "breathing", "Makes circuit replacement capability visible while keeping current-route assessment and compatibility checks primary."),
  station("10", "Connectors and adapters", "breathing", "Supports inspection of connection integrity and compatibility across the breathing circuit."),
  station("11", "Filters and HME spare", "breathing", "Represents spare breathing-circuit consumables for readiness and maintenance checks."),
  station("12", "Manual resuscitator / bag valve", "breathing", "Makes manual ventilation backup visible for a reviewed emergency pathway; selection is not authorisation.", {
    initialStatus: "relevant"
  }),
  station("13", "Oxygen interface — if required", "breathing", "Represents an oxygen interface option only where the authored case and local plan make it relevant."),
  station("14", "Circuit support straps", "breathing", "Supports checking circuit drag, tension and positioning as mechanical contributors to respiratory risk."),
  station("15", "Backup batteries — charged", "breathing", "Supports power-continuity readiness for life-support equipment."),
  station("16", "Power leads and chargers", "breathing", "Supports mains, charging and backup-power continuity checks."),
  station("17", "Patient and chest-movement check", "breathing", "Compares current chest movement and respiratory effort with the fictional person's established baseline.", {
    sourceTitle: "Chest Movement Indicator"
  }),

  station("18", "Defibrillator / AED", "circulation", "Keeps emergency defibrillation capability visible without turning availability into a rhythm diagnosis or treatment decision.", {
    initialStatus: "locked_by_evidence",
    lockReason: "Complete a reassessment and establish breathing/circuit evidence before escalating this circulation emergency station.",
    gate: { requiresReassessment: true, requiresAnyAppliedStations: ["09", "17"] }
  }),
  station("19", "Portable cardiac monitor", "circulation", "Supports monitoring continuity and separation of reliable rhythm evidence from artefact."),
  station("20", "Monitoring leads and sensors", "circulation", "Supports ECG, oxygenation and other monitoring signal-integrity checks without treating one number as the whole clinical picture.")
]);

export function stationDefinitionById(id) {
  return PICU_IAS_STATIONS.find((item) => item.id === id) || null;
}
