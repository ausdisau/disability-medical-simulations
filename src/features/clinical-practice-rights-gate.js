export const CLINICAL_PRACTICE_RIGHTS_GATE_VERSION = "0.1.0";

/**
 * Apply patient-rights constraints after clinical pathway derivation.
 *
 * The clinical engine may recognise the physiology of cardiac arrest. This gate determines
 * whether a simulated treatment action is available when the scenario has already validated
 * a specific, applicable treatment limitation. It does not infer such a limitation from
 * disability, family preference, dependency, communication method or relational state.
 */
export function applyClinicalPracticeRightsGate(context, clinicalSnapshot = {}) {
  if (!context?.activePathways || !Array.isArray(context.learnerActions)) {
    throw new TypeError("applyClinicalPracticeRightsGate requires a clinical-practice context.");
  }

  const validApplicableCPRLimit = clinicalSnapshot.validApplicableCPRLimit === true;
  const advanceCareDirectiveStatus = typeof clinicalSnapshot.advanceCareDirectiveStatus === "string"
    ? clinicalSnapshot.advanceCareDirectiveStatus.toLowerCase()
    : "none";

  let learnerActions = [...context.learnerActions];
  let clinicianLedActions = [...context.clinicianLedActions];
  const rightsAlerts = [];

  if (validApplicableCPRLimit) {
    learnerActions = learnerActions.filter((action) => action.id !== "BLS_CPR_AED");
    clinicianLedActions = clinicianLedActions.filter((action) => ![
      "ALS_HIGH_QUALITY_CPR",
      "ALS_DEFIBRILLATION",
      "ALS_MEDICATION_PROTOCOL_SHOCKABLE",
      "ALS_MEDICATION_PROTOCOL_NONSHOCKABLE"
    ].includes(action.id));
    rightsAlerts.push(
      "A valid, applicable CPR treatment limitation is authored for this simulation: do not offer CPR/defibrillation actions that conflict with it."
    );
  }

  if (advanceCareDirectiveStatus === "uncertain") {
    rightsAlerts.push(
      "Advance-care applicability is uncertain: preserve necessary emergency care while obtaining senior clarification; do not let family preference or disability substitute for validity/applicability review."
    );
  }

  return {
    ...context,
    learnerActions,
    clinicianLedActions,
    alerts: [...context.alerts, ...rightsAlerts],
    rightsGate: {
      version: CLINICAL_PRACTICE_RIGHTS_GATE_VERSION,
      validApplicableCPRLimit,
      advanceCareDirectiveStatus,
      disabilityUsedAsTreatmentLimit: false,
      familyPreferenceUsedAsTreatmentLimit: false,
      communicationMethodUsedAsCapacityFinding: false
    }
  };
}
