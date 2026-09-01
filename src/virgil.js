export const VIRGIL_CONTRACT = Object.freeze({
  authority: "advisory_only",
  mayWriteCanonicalState: false,
  mayInferPatientSpeech: false,
  mayDetermineConsentOrCapacity: false,
  mayAuthorizeTreatment: false,
  maySuggestEducationalQuestions: true,
  maySurfaceUnknowns: true
});

function known(label, value, sourceId) {
  return { label, value, sourceId, status: "known" };
}

function unknown(label, reason, sourceId = null) {
  return { label, value: null, reason, sourceId, status: "unknown" };
}

export function buildVirgilProposal(state, scenario) {
  const knownEvidence = [
    known("Scenario baseline", scenario.baseline, "scenario.baseline"),
    known("Authored acute changes", scenario.changes, "scenario.changes"),
    known("Communication method", scenario.patient.communication, "scenario.patient.communication"),
    known("Current communication access", state.communication.status, "runtime.communication.status"),
    known("Reassessment count", state.evidence.reassessmentCount, "runtime.evidence.reassessmentCount")
  ];

  const unknownEvidence = [];
  if (!scenario.patient.authoredOpeningMessage) {
    unknownEvidence.push(unknown(
      "Current patient-authored response",
      "No reliable patient-authored message is established in the opening state.",
      "scenario.patient.authoredOpeningMessage"
    ));
  }

  if (state.communication.status !== "available" || state.communication.reliability === "unknown") {
    unknownEvidence.push(unknown(
      "Meaning of silence, delay or failed access",
      "Communication reliability is reduced. Do not convert access failure into consent, refusal or incapacity.",
      "runtime.communication"
    ));
  }

  const suggestedActionIds = [];
  if (state.evidence.reassessmentCount < 1) suggestedActionIds.push("REASSESS");
  if (state.communication.status !== "available") suggestedActionIds.push("AAC_RESTORE");
  if (state.stations["04"] !== "applied") suggestedActionIds.push("IAS_04_CURRENT_PLAN");
  if (state.stations["17"] !== "applied") suggestedActionIds.push("IAS_17_BASELINE_CHEST_MOVEMENT");

  const nextSafeQuestion = state.communication.status !== "available"
    ? "What equivalent communication route can be restored while necessary clinical work continues in parallel?"
    : state.evidence.reassessmentCount < 1
      ? "What has changed from this fictional person's established baseline, and which observations remain uncertain?"
      : "Which unresolved evidence would most change the next simulation action, without inventing a patient preference or clinical fact?";

  return {
    role: "VIRGIL",
    contract: VIRGIL_CONTRACT,
    educationalInterpretation: "Integrate baseline, acute change, communication access, agency and equipment readiness while keeping inference separate from authoritative simulation state.",
    knownEvidence,
    unknownEvidence,
    nextSafeQuestion,
    suggestedActionIds,
    sourceIds: [
      "scenario.baseline",
      "scenario.changes",
      "runtime.communication",
      "runtime.evidence",
      "runtime.stations"
    ],
    boundary: "Educational proposal only. VIRGIL does not alter physiology, invent patient speech, determine consent/capacity, or authorize treatment."
  };
}
