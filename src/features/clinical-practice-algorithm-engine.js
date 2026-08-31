export const CLINICAL_PRACTICE_ENGINE_VERSION = "0.1.0";

/**
 * Project Hope clinical-practice algorithm layer.
 *
 * Purpose:
 * - make authored simulation scenes behave like Australian acute-care systems;
 * - expose observable algorithm state to NPC/dialogue/rendering layers;
 * - keep treatment authority, legal authority and deterministic physiology outside the LLM.
 *
 * Boundary:
 * This module is an educational simulation abstraction of published guidance. It deliberately
 * does not contain medication doses, autonomous ventilator settings, invasive tracheostomy
 * procedure steps, patient-specific prognosis, or autonomous treatment-ceiling decisions.
 */

export const CLINICAL_GUIDELINE_SOURCES = Object.freeze({
  ANZCOR_ADULT_ALS_11_2: {
    organisation: "Australian and New Zealand Committee on Resuscitation",
    title: "Guideline 11.2 – Protocols for Adult Advanced Life Support",
    url: "https://www.anzcor.org/home/adult-advanced-life-support/guideline-11-2-protocols-for-adult-advanced-life-support",
    jurisdiction: "Australia/New Zealand",
    role: "adult cardiac arrest rhythm pathway, CPR, defibrillation and reversible-cause logic"
  },
  ANZCOR_POST_ROSC_11_7: {
    organisation: "Australian and New Zealand Committee on Resuscitation",
    title: "Guideline 11.7 – Post-resuscitation Therapy in Adult Advanced Life Support",
    url: "https://www.anzcor.org/home/adult-advanced-life-support/guideline-11-7-post-resuscitation-therapy-in-adult-advanced-life-support",
    jurisdiction: "Australia/New Zealand",
    role: "post-ROSC airway, ventilation, haemodynamic, temperature and neurological-care logic"
  },
  ANZCOR_OXYGEN_11_6_1: {
    organisation: "Australian and New Zealand Committee on Resuscitation",
    title: "Guideline 11.6.1 – Targeted Oxygen Therapy in Adult Advanced Life Support",
    url: "https://www.anzcor.org/home/adult-advanced-life-support/guideline-11-6-1-targeted-oxygen-therapy-in-adult-advanced-life-support",
    jurisdiction: "Australia/New Zealand",
    role: "oxygen and carbon-dioxide targets including hypercapnic respiratory failure"
  },
  ANZCOR_BLS_8: {
    organisation: "Australian and New Zealand Committee on Resuscitation",
    title: "Guideline 8 – Cardiopulmonary Resuscitation (CPR)",
    url: "https://www.anzcor.org/home/basic-life-support/guideline-8-cardiopulmonary-resuscitation-cpr",
    jurisdiction: "Australia/New Zealand",
    role: "basic-life-support recognition and CPR/AED learner actions"
  },
  NSW_CEC_CERS: {
    organisation: "NSW Clinical Excellence Commission",
    title: "Clinical Emergency Response System",
    url: "https://cec.health.nsw.gov.au/safety-essentials/deterioration/emergency-response-system",
    jurisdiction: "NSW",
    role: "clinical deterioration escalation and patient/family escalation"
  },
  NSW_CEC_SEPSIS: {
    organisation: "NSW Clinical Excellence Commission",
    title: "Sepsis pathways",
    url: "https://cec.health.nsw.gov.au/safety-essentials/deterioration/sepsis",
    jurisdiction: "NSW",
    role: "adult sepsis pathway activation"
  },
  ACSQHC_SEPSIS: {
    organisation: "Australian Commission on Safety and Quality in Health Care",
    title: "Sepsis Clinical Care Standard",
    url: "https://www.safetyandquality.gov.au/clinical-care-standards/sepsis",
    jurisdiction: "Australia",
    role: "recognition, urgent assessment/treatment, escalation, review and source-control principles"
  },
  ACSQHC_AMS: {
    organisation: "Australian Commission on Safety and Quality in Health Care",
    title: "Antimicrobial Stewardship Clinical Care Standard",
    url: "https://www.safetyandquality.gov.au/clinical-care-standards/antimicrobial-stewardship",
    jurisdiction: "Australia",
    role: "immediate appropriate empiric antimicrobial treatment for life-threatening suspected infection with later reassessment"
  },
  NSW_ACI_TRACHEOSTOMY: {
    organisation: "NSW Agency for Clinical Innovation / Intensive Care NSW",
    title: "Care of adult patients in acute care facilities with a tracheostomy",
    url: "https://aci.health.nsw.gov.au/networks/icnsw/clinicians/acute-tracheostomy",
    jurisdiction: "NSW",
    role: "patient-centred, time-sensitive tracheostomy systems, emergency care and communication"
  },
  NSW_ADVANCE_CARE: {
    organisation: "NSW Health",
    title: "Advance care planning and Advance Care Directives",
    url: "https://www.health.nsw.gov.au/patients/acp/Pages/advance-care-planning.aspx",
    jurisdiction: "NSW",
    role: "values/preferences and future-care decision context"
  }
});

export const CLINICAL_PATHWAY_IDS = Object.freeze([
  "BLS_RECOGNITION",
  "ALS_CARDIAC_ARREST",
  "ALS_SHOCKABLE",
  "ALS_NONSHOCKABLE",
  "POST_ROSC",
  "TARGETED_OXYGEN",
  "DETERIORATION_CLINICAL_REVIEW",
  "DETERIORATION_RAPID_RESPONSE",
  "SEPSIS_PATHWAY",
  "TRACHEOSTOMY_EMERGENCY",
  "ADVANCE_CARE_REVIEW"
]);

const SHOCKABLE = new Set(["vf", "pvt"]);
const NON_SHOCKABLE = new Set(["pea", "asystole"]);

function bool(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function numberOrNull(value) {
  return Number.isFinite(value) ? Number(value) : null;
}

function addUnique(target, item) {
  if (!target.includes(item)) target.push(item);
}

function addAction(target, action) {
  if (!target.some((item) => item.id === action.id)) target.push(action);
}

function source(id) {
  return { id, ...CLINICAL_GUIDELINE_SOURCES[id] };
}

function oxygenTarget(snapshot) {
  if (!snapshot.rosc || !snapshot.oxygenSaturationReliable) return null;
  if (snapshot.hypercapnicRespiratoryFailure) {
    return {
      spo2TargetPercent: [88, 92],
      reason: "hypercapnic-respiratory-failure",
      sourceId: "ANZCOR_OXYGEN_11_6_1"
    };
  }
  return {
    spo2TargetPercent: [94, 98],
    reason: "initial-post-ROSC-target",
    sourceId: "ANZCOR_OXYGEN_11_6_1"
  };
}

function normalizedSnapshot(input = {}) {
  return {
    adult: input.adult !== false,
    responsive: bool(input.responsive, true),
    breathingNormally: bool(input.breathingNormally, true),
    pulsePresent: input.pulsePresent == null ? null : bool(input.pulsePresent),
    rhythm: typeof input.rhythm === "string" ? input.rhythm.toLowerCase() : "unknown",
    rosc: bool(input.rosc),
    oxygenSaturationReliable: bool(input.oxygenSaturationReliable),
    spo2Percent: numberOrNull(input.spo2Percent),
    paCO2MmHg: numberOrNull(input.paCO2MmHg),
    hypercapnicRespiratoryFailure: bool(input.hypercapnicRespiratoryFailure),
    meanArterialPressureMmHg: numberOrNull(input.meanArterialPressureMmHg),
    systolicBloodPressureMmHg: numberOrNull(input.systolicBloodPressureMmHg),
    bloodGlucoseKnown: bool(input.bloodGlucoseKnown),
    electrolytesChecked: bool(input.electrolytesChecked),
    twelveLeadECGObtained: bool(input.twelveLeadECGObtained),
    temperatureC: numberOrNull(input.temperatureC),
    comatoseAfterROSC: bool(input.comatoseAfterROSC),
    suspectedInfection: bool(input.suspectedInfection),
    clinicallySignificantOrganDysfunction: bool(input.clinicallySignificantOrganDysfunction),
    lactateMeasured: bool(input.lactateMeasured),
    bloodCulturesCollected: bool(input.bloodCulturesCollected),
    antimicrobialsStarted: bool(input.antimicrobialsStarted),
    sourceControlIssueSuspected: bool(input.sourceControlIssueSuspected),
    tracheostomyPresent: bool(input.tracheostomyPresent),
    tracheostomyPatent: input.tracheostomyPatent == null ? null : bool(input.tracheostomyPatent),
    respiratoryDeterioration: bool(input.respiratoryDeterioration),
    deteriorationTrigger: typeof input.deteriorationTrigger === "string"
      ? input.deteriorationTrigger.toLowerCase()
      : "none",
    patientOrFamilyConcernEscalated: bool(input.patientOrFamilyConcernEscalated),
    communicationAccessAvailable: input.communicationAccessAvailable !== false,
    advanceCareDirectiveStatus: typeof input.advanceCareDirectiveStatus === "string"
      ? input.advanceCareDirectiveStatus.toLowerCase()
      : "none",
    goalsOfCareKnown: bool(input.goalsOfCareKnown),
    validApplicableCPRLimit: bool(input.validApplicableCPRLimit),
    learnerScope: typeof input.learnerScope === "string" ? input.learnerScope.toUpperCase() : "BLS"
  };
}

/**
 * Return active practice pathways and scope-tagged simulation actions.
 * The engine reads scenario-authored facts; it does not diagnose a patient from disability.
 */
export function deriveClinicalPracticeContext(input = {}) {
  const s = normalizedSnapshot(input);
  const activePathways = [];
  const learnerActions = [];
  const clinicianLedActions = [];
  const sourceIds = new Set();
  const alerts = [];

  const pushPathway = (id, sourceId) => {
    addUnique(activePathways, id);
    if (sourceId) sourceIds.add(sourceId);
  };

  // NSW deterioration escalation: use the trigger authored by the local observation chart/system.
  // We deliberately do not duplicate numeric Between the Flags thresholds here.
  if (s.deteriorationTrigger === "yellow") {
    pushPathway("DETERIORATION_CLINICAL_REVIEW", "NSW_CEC_CERS");
    addAction(learnerActions, {
      id: "ESCALATE_CLINICAL_REVIEW",
      label: "Escalate for clinical review using the local deterioration system",
      scope: "BLS_OR_HEALTHCARE_LEARNER"
    });
  }
  if (s.deteriorationTrigger === "red" || s.patientOrFamilyConcernEscalated) {
    pushPathway("DETERIORATION_RAPID_RESPONSE", "NSW_CEC_CERS");
    addAction(learnerActions, {
      id: "ACTIVATE_RAPID_RESPONSE",
      label: "Activate the local rapid-response / emergency escalation pathway",
      scope: "BLS_OR_HEALTHCARE_LEARNER"
    });
  }

  const blsArrestRecognition = !s.responsive && !s.breathingNormally;
  if (blsArrestRecognition) {
    pushPathway("BLS_RECOGNITION", "ANZCOR_BLS_8");
    addAction(learnerActions, {
      id: "BLS_CPR_AED",
      label: "Recognise cardiac arrest, call for help, start CPR and use an AED when available",
      scope: "BLS"
    });
  }

  const arrest = s.pulsePresent === false && !s.validApplicableCPRLimit;
  if (arrest) {
    pushPathway("ALS_CARDIAC_ARREST", "ANZCOR_ADULT_ALS_11_2");
    addAction(clinicianLedActions, {
      id: "ALS_HIGH_QUALITY_CPR",
      label: "Continue high-quality CPR with minimal interruption",
      scope: "ALS_TEAM"
    });
    addAction(clinicianLedActions, {
      id: "ALS_REVERSIBLE_CAUSES",
      label: "Actively identify and treat reversible causes in parallel",
      scope: "ALS_TEAM"
    });

    if (SHOCKABLE.has(s.rhythm)) {
      pushPathway("ALS_SHOCKABLE", "ANZCOR_ADULT_ALS_11_2");
      addAction(clinicianLedActions, {
        id: "ALS_DEFIBRILLATION",
        label: "Follow the shockable-rhythm defibrillation branch while continuing CPR",
        scope: "ALS_TEAM"
      });
      addAction(clinicianLedActions, {
        id: "ALS_MEDICATION_PROTOCOL_SHOCKABLE",
        label: "Use ALS medications according to the current shockable-rhythm protocol",
        scope: "ALS_TEAM"
      });
    } else if (NON_SHOCKABLE.has(s.rhythm)) {
      pushPathway("ALS_NONSHOCKABLE", "ANZCOR_ADULT_ALS_11_2");
      addAction(clinicianLedActions, {
        id: "NO_DEFIBRILLATION_FOR_PEA_ASYSTOLE",
        label: "Do not defibrillate PEA/asystole; continue CPR, ALS care and reversible-cause management",
        scope: "ALS_TEAM"
      });
      addAction(clinicianLedActions, {
        id: "ALS_MEDICATION_PROTOCOL_NONSHOCKABLE",
        label: "Use ALS medications according to the current non-shockable-rhythm protocol",
        scope: "ALS_TEAM"
      });
    }
  }

  if (s.rosc) {
    pushPathway("POST_ROSC", "ANZCOR_POST_ROSC_11_7");
    pushPathway("TARGETED_OXYGEN", "ANZCOR_OXYGEN_11_6_1");

    addAction(clinicianLedActions, {
      id: "POST_ROSC_AIRWAY_VENTILATION",
      label: "Continue airway and ventilatory support guided by monitoring",
      scope: "ALS_ICU_TEAM"
    });
    addAction(clinicianLedActions, {
      id: "POST_ROSC_HEMODYNAMIC_SUPPORT",
      label: "Support circulation using individualised post-ROSC haemodynamic goals",
      scope: "ALS_ICU_TEAM"
    });
    addAction(clinicianLedActions, {
      id: "POST_ROSC_ECG_LABS",
      label: "Obtain/review ECG, blood gases, electrolytes and glucose and treat the underlying cause",
      scope: "ALS_ICU_TEAM"
    });

    const target = oxygenTarget(s);
    if (target) {
      sourceIds.add(target.sourceId);
      addAction(clinicianLedActions, {
        id: "POST_ROSC_TARGETED_OXYGEN",
        label: `Titrate oxygen to the applicable monitored target (${target.spo2TargetPercent[0]}–${target.spo2TargetPercent[1]}% in this authored context)`,
        scope: "ALS_ICU_TEAM",
        target: target.spo2TargetPercent,
        reason: target.reason
      });
    } else {
      addAction(clinicianLedActions, {
        id: "POST_ROSC_OXYGEN_UNTIL_RELIABLE_MEASUREMENT",
        label: "Use high-concentration oxygen until arterial oxygenation can be measured reliably, then titrate",
        scope: "ALS_ICU_TEAM"
      });
    }

    if (s.paCO2MmHg != null) {
      addAction(clinicianLedActions, {
        id: "POST_ROSC_CO2_TARGET",
        label: "Target a normal physiological PaCO2 range while avoiding inappropriate hypo- or hyperventilation",
        scope: "ALS_ICU_TEAM",
        targetPaCO2MmHg: [35, 45]
      });
    }

    if (s.meanArterialPressureMmHg != null || s.systolicBloodPressureMmHg != null) {
      addAction(clinicianLedActions, {
        id: "POST_ROSC_BP_TARGET",
        label: "Use an initial MAP goal around 60–65 mmHg or SBP above 100 mmHg, then individualise to physiology/comorbidity",
        scope: "ALS_ICU_TEAM",
        initialGoal: { mapAtLeastMmHg: 60, mapTypicalInitialUpperMmHg: 65, sbpGreaterThanMmHg: 100 }
      });
    }

    if (s.comatoseAfterROSC) {
      addAction(clinicianLedActions, {
        id: "POST_ROSC_FEVER_PREVENTION",
        label: "Actively prevent fever in a persistently comatose post-arrest patient",
        scope: "ICU_TEAM",
        temperatureCeilingC: 37.5,
        durationAtLeastHours: 72
      });
      alerts.push("Do not use immediate post-arrest appearance or early unresponsiveness as a stand-alone neurological prognosis.");
    }
  }

  const sepsisCandidate = s.suspectedInfection && (
    s.clinicallySignificantOrganDysfunction ||
    s.respiratoryDeterioration ||
    s.deteriorationTrigger === "yellow" ||
    s.deteriorationTrigger === "red"
  );
  if (sepsisCandidate) {
    pushPathway("SEPSIS_PATHWAY", "NSW_CEC_SEPSIS");
    sourceIds.add("ACSQHC_SEPSIS");
    sourceIds.add("ACSQHC_AMS");
    addAction(clinicianLedActions, {
      id: "SEPSIS_ACTIVATE_LOCAL_PATHWAY",
      label: "Activate the locally approved adult sepsis pathway and escalate to an experienced clinician",
      scope: "CLINICAL_TEAM"
    });
    if (!s.lactateMeasured) {
      addAction(clinicianLedActions, {
        id: "SEPSIS_LACTATE",
        label: "Include lactate in urgent sepsis assessment",
        scope: "CLINICAL_TEAM"
      });
    }
    if (!s.bloodCulturesCollected) {
      addAction(clinicianLedActions, {
        id: "SEPSIS_CULTURES_IF_NO_DELAY",
        label: "Collect appropriate cultures before antimicrobial therapy when this will not delay urgent treatment",
        scope: "CLINICAL_TEAM"
      });
    }
    if (!s.antimicrobialsStarted) {
      addAction(clinicianLedActions, {
        id: "SEPSIS_EMPIRIC_ANTIMICROBIAL",
        label: "For life-threatening suspected infection, start appropriate empiric antimicrobial treatment immediately according to the local pathway/formulary",
        scope: "PRESCRIBING_CLINICAL_TEAM"
      });
    }
    if (s.sourceControlIssueSuspected) {
      addAction(clinicianLedActions, {
        id: "SEPSIS_SOURCE_CONTROL",
        label: "Assess for timely source control and reassess response to treatment",
        scope: "CLINICAL_TEAM"
      });
    }
  }

  if (s.tracheostomyPresent && s.respiratoryDeterioration && s.tracheostomyPatent !== true) {
    pushPathway("TRACHEOSTOMY_EMERGENCY", "NSW_ACI_TRACHEOSTOMY");
    addAction(learnerActions, {
      id: "TRACH_ESCALATE_AIRWAY_HELP",
      label: "Call for expert airway/rapid-response help and report the tracheostomy emergency clearly",
      scope: "BLS_OR_HEALTHCARE_LEARNER"
    });
    addAction(clinicianLedActions, {
      id: "TRACH_EMERGENCY_ASSESSMENT",
      label: "Follow the local tracheostomy emergency pathway: assess oxygenation/ventilation, tube/circuit patency and use waveform capnography when available",
      scope: "AIRWAY_TRAINED_CLINICAL_TEAM"
    });
    alerts.push("Advanced tracheostomy manipulation remains clinician-led and follows the local airway/tracheostomy emergency procedure.");
  }

  if (s.advanceCareDirectiveStatus !== "none" || s.goalsOfCareKnown || s.validApplicableCPRLimit) {
    pushPathway("ADVANCE_CARE_REVIEW", "NSW_ADVANCE_CARE");
    if (s.advanceCareDirectiveStatus === "uncertain") {
      alerts.push("Advance-care documentation is uncertain: escalate senior review rather than guessing applicability from disability, dependency or family preference.");
    }
  }

  if (!s.communicationAccessAvailable) {
    alerts.push("Restore communication access as soon as clinically feasible; communication difficulty does not establish incapacity.");
  }

  const npcSafeFacts = {
    rapidResponseActive: activePathways.includes("DETERIORATION_RAPID_RESPONSE"),
    clinicalReviewActive: activePathways.includes("DETERIORATION_CLINICAL_REVIEW"),
    cardiacArrestActive: activePathways.includes("ALS_CARDIAC_ARREST"),
    shockableRhythmPathway: activePathways.includes("ALS_SHOCKABLE"),
    nonShockableRhythmPathway: activePathways.includes("ALS_NONSHOCKABLE"),
    postROSCActive: activePathways.includes("POST_ROSC"),
    sepsisPathwayActive: activePathways.includes("SEPSIS_PATHWAY"),
    tracheostomyEmergencyActive: activePathways.includes("TRACHEOSTOMY_EMERGENCY"),
    communicationAccessAvailable: s.communicationAccessAvailable,
    knownVsUncertainInstruction: "NPCs may ask what is known, what is still uncertain, what staff are monitoring, and what happens next. NPCs must not invent diagnoses, treatment decisions or prognosis."
  };

  return {
    engineVersion: CLINICAL_PRACTICE_ENGINE_VERSION,
    jurisdiction: "NSW, Australia",
    snapshot: s,
    activePathways,
    learnerActions,
    clinicianLedActions,
    npcSafeFacts,
    alerts,
    sources: [...sourceIds].map(source),
    invariants: {
      physiologyDoesNotInferCapacity: true,
      disabilityDoesNotSetTreatmentCeiling: true,
      familyPresenceDoesNotCreateAuthority: true,
      llmCannotCommitClinicalEvent: true,
      localHospitalProcedureOverridesSimulationAbstraction: true,
      advancedActionsRemainClinicianLedWhenLearnerScopeIsBLS: s.learnerScope === "BLS"
    }
  };
}

export function buildClinicalSceneMonitor(context) {
  if (!context?.activePathways || !context?.npcSafeFacts) {
    throw new TypeError("buildClinicalSceneMonitor requires deriveClinicalPracticeContext output.");
  }
  const facts = context.npcSafeFacts;
  const labels = [];
  if (facts.rapidResponseActive) labels.push("RAPID RESPONSE / EMERGENCY ESCALATION ACTIVE");
  if (facts.clinicalReviewActive) labels.push("CLINICAL REVIEW ACTIVE");
  if (facts.cardiacArrestActive) labels.push("CARDIAC ARREST PATHWAY ACTIVE");
  if (facts.shockableRhythmPathway) labels.push("SHOCKABLE RHYTHM BRANCH");
  if (facts.nonShockableRhythmPathway) labels.push("NON-SHOCKABLE RHYTHM BRANCH");
  if (facts.postROSCActive) labels.push("POST-ROSC CARE ACTIVE");
  if (facts.sepsisPathwayActive) labels.push("SEPSIS PATHWAY ACTIVE");
  if (facts.tracheostomyEmergencyActive) labels.push("TRACHEOSTOMY EMERGENCY PATHWAY ACTIVE");
  if (!facts.communicationAccessAvailable) labels.push("COMMUNICATION ACCESS REQUIRES RESTORATION");
  return {
    labels,
    knownVsUncertainInstruction: facts.knownVsUncertainInstruction,
    sourceIds: context.sources.map((item) => item.id)
  };
}
