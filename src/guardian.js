function check(status, finding, evidence = [], repair = null) {
  return { status, finding, evidence, repair };
}

export function auditPersonhood(state, scenario) {
  const communicationInterrupted = state.communication.status !== "available";
  const supporterRole = scenario.patient.supporterRole || "Support role only";
  const activeFlags = [];

  if (communicationInterrupted) activeFlags.push("PG2_VOICE_BYPASS");

  const communicationStatus = communicationInterrupted ? "strained" : "protected";
  const personhoodStatus = communicationInterrupted ? "strained" : "protected";

  return {
    PERSONHOOD_STATUS: personhoodStatus,
    IDENTITY_CONTINUITY_CHECK: check(
      "protected",
      `${scenario.patient.name} remains identified as the person rather than a diagnosis, device or task.`,
      [scenario.patient.name]
    ),
    VOICE_AND_AGENCY_CHECK: check(
      communicationStatus,
      communicationInterrupted
        ? "Direct communication access is interrupted; silence or delay must remain UNKNOWN."
        : "Direct patient participation remains available and primary.",
      [state.communication.status, state.agency.decisionAuthority],
      communicationInterrupted ? "Restore an equivalent communication route and address the patient directly." : null
    ),
    COMMUNICATION_ACCESS_CHECK: check(
      communicationStatus,
      communicationInterrupted
        ? "Communication reliability is reduced by an access interruption, not by a finding of incapacity."
        : "Communication access is represented as clinical and rights infrastructure.",
      [state.communication.status, state.communication.reliability],
      communicationInterrupted ? "Repair communication access; do not infer a patient answer." : null
    ),
    BASELINE_INTEGRITY_CHECK: check(
      "protected",
      "The scenario keeps usual baseline separate from new or changed findings.",
      scenario.baseline
    ),
    RELATIONAL_CONTINUITY_CHECK: check(
      "protected",
      "Supporter presence remains support/information, not automatic substitute authority.",
      [supporterRole]
    ),
    DIGNITY_BODY_PRIVACY_CHECK: check(
      "protected",
      "No runtime state assigns a worth, burden or quality-of-life score.",
      ["personhood_not_scored"]
    ),
    VALUES_GOALS_CHECK: check(
      "unresolved",
      "No additional values or goals are invented beyond authored scenario facts.",
      []
    ),
    FUTURE_ORIENTATION_CHECK: check(
      "unresolved",
      "The runtime makes no prognostic claim about the person's future from disability or dependence.",
      []
    ),
    ENVIRONMENT_ACCESS_CHECK: check(
      communicationStatus,
      communicationInterrupted
        ? "The environment is currently interfering with the person's communication access."
        : "Communication equipment and access requirements remain visible in the simulated environment.",
      [state.communication.status],
      communicationInterrupted ? "Restore equivalent access without delaying necessary emergency care." : null
    ),
    NARRATIVE_MEMORY_CHECK: check(
      "protected",
      "The active run preserves authored facts in memory; JSON export is user-controlled and platform retention is none.",
      [state.system.storage, state.system.platformRetention]
    ),
    ACTIVE_GUARDIAN_FLAGS: activeFlags,
    REQUIRED_REPAIR_ACTIONS: communicationInterrupted
      ? ["Restore communication access", "Keep response UNKNOWN until reliably authored", "Continue direct address"]
      : [],
    NARRATIVE_PERMISSION: {
      decision: communicationInterrupted ? "CONTINUE_WITH_PARALLEL_REPAIR" : "CONTINUE",
      basis: communicationInterrupted
        ? "Clinical work may continue while communication/personhood access is repaired in parallel."
        : "Current personhood checks do not require a narrative hold.",
      resume_when: communicationInterrupted ? ["Equivalent communication access is restored"] : []
    },
    NPC_RENDER_CONTEXT: {
      confirmed_identity: {
        name: scenario.patient.name,
        profile: scenario.patient.profile
      },
      confirmed_values: [],
      confirmed_relationships: [supporterRole],
      current_access: {
        method: scenario.patient.communication,
        status: state.communication.status,
        reliability: state.communication.reliability
      },
      forbidden_inferences: [
        "communication failure implies incapacity",
        "supporter presence implies decision authority",
        "disability implies poor quality of life",
        "no response implies consent or refusal"
      ]
    },
    MEMORY_LEDGER_UPDATES: []
  };
}
