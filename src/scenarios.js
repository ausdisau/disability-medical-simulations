export const scenarios = [
  {
    id: "maya-airway-access",
    version: "1.0.0-alpha.1",
    data_origin: "fictional_synthetic",
    fictional_patient: true,
    title: "I Need Suction",
    phaseLabel: "Focused respiratory reassessment",
    setting: "Adult ICU",
    jurisdiction: "NSW, Australia",
    patient: {
      name: "Maya Chen",
      profile: "Fictional adult with cerebral palsy, tracheostomy and ventilatory support",
      communication: "Eye-gaze AAC",
      communicationDetail: "Address Maya directly, allow response time, preserve positioning and keep the display calibrated.",
      authoredOpeningMessage: "I NEED SUCTION",
      supporterRole: "Support and baseline informant only"
    },
    baseline: [
      "Usually alert and able to direct care",
      "Eye-gaze AAC is reliable when positioning is maintained",
      "Known supported posture and usual chest movement",
      "Current airway plan should travel with Maya"
    ],
    changes: [
      "Patient-authored AAC request: I NEED SUCTION",
      "Audible secretions",
      "Reduced chest movement compared with baseline",
      "Equipment readiness not yet confirmed"
    ],
    assumptions: [
      "Stable monitor numbers mean the concern has resolved",
      "Speech or movement difference implies reduced understanding",
      "Family should answer instead of Maya",
      "Visible equipment is automatically ready and indicated"
    ],
    clinicalSnapshot: {
      airway: "Airway route present — cause still requires assessment",
      breathing: "Reduced chest movement with audible secretions",
      circulation: "No new instability authored in this opening state",
      neurology: "Cognition must not be inferred from speech or movement",
      communication: "Eye-gaze AAC available",
      agency: "Maya remains the primary decision-maker"
    },
    riskWatch: [
      "Worsening ineffective ventilation",
      "Communication access loss",
      "Diagnostic overshadowing",
      "Equipment use before readiness / indication is established"
    ],
    workstreams: [
      { id: "A", title: "Respiratory reassessment", detail: "Patient, chest movement, secretions, airway/circuit and positioning." },
      { id: "B", title: "System readiness", detail: "Current plan, monitoring quality, equipment compatibility and responder roles." },
      { id: "C", title: "Communication + agency", detail: "Keep AAC usable, preserve response time and address Maya directly." }
    ],
    opening: "The ventilator continues cycling. Maya looks toward the nurse and uses eye-gaze AAC. The monitor has not changed dramatically, but chest movement appears reduced and secretions are audible.",
    decisionPrompt: "What should the team do before committing an intervention?",
    choices: [
      {
        id: "cause-led",
        label: "Address Maya, confirm the request, assess patient/airway/circuit/position, check the current plan, and assign parallel workstreams",
        safe: true,
        nextPhase: "cause-led-reassessment",
        feedback: "Strong sequence: Maya remains the primary source while the team checks patient, airway, circuit, positioning, plan and equipment readiness."
      },
      {
        id: "remove-aac",
        label: "Move the AAC screen away so staff can reach equipment faster",
        safe: false,
        effect: { communication: "interrupted" },
        feedback: "Communication access has been interrupted. Restore an equivalent route before interpreting silence or continuing non-urgent tasks."
      },
      {
        id: "monitor-only",
        label: "Treat the monitor as proof that no respiratory problem exists",
        safe: false,
        feedback: "A monitor is one source of evidence. Maya's report and change from baseline remain clinically important."
      }
    ],
    debrief: [
      "What information came directly from Maya?",
      "How did positioning affect breathing and communication?",
      "Which evidence was required before equipment commitment?",
      "Where did the team preserve or threaten personhood and agency?"
    ]
  },
  {
    id: "rohan-alarm",
    version: "1.0.0-alpha.1",
    data_origin: "fictional_synthetic",
    fictional_patient: true,
    title: "The Alarm Is Not the Story",
    phaseLabel: "Cause-led complex-airway reassessment",
    setting: "Paediatric complex airway",
    jurisdiction: "NSW, Australia",
    patient: {
      name: "Rohan Malik",
      profile: "Fictional 12-year-old ventilator user with a complex airway plan",
      communication: "Cheek switch and partner-assisted scanning",
      communicationDetail: "Evaluation time pauses during composition/scanning. Silence, delay or failed access is not consent, refusal or incapacity.",
      authoredOpeningMessage: null,
      supporterRole: "Support and baseline informant only"
    },
    baseline: [
      "Usually alert and able to communicate when access is working",
      "Known chest movement and supported position",
      "Current airway and emergency plans available",
      "Family knows baseline but does not replace Rohan's voice"
    ],
    changes: [
      "Intermittent ventilator alarm",
      "Reduced chest movement",
      "Ectopy persists after alarm silence",
      "Hand movement toward the neck is observed but meaning is unresolved",
      "Current communication reliability is uncertain"
    ],
    assumptions: [
      "A quiet alarm means recovery",
      "A spare airway should be used immediately because it is available",
      "Slow AAC means there is no meaningful answer",
      "One improved number proves ventilation is safe"
    ],
    clinicalSnapshot: {
      airway: "Current-route cause unresolved",
      breathing: "Reduced chest movement remains observable",
      circulation: "Organized rhythm with ectopy — not equivalent to arrest",
      neurology: "Communication access does not determine cognition",
      communication: "Response meaning currently UNKNOWN",
      agency: "Rohan remains the person and primary participant"
    },
    riskWatch: [
      "Unrecognized route or circuit problem",
      "Loss of communication interpreted as incapacity",
      "Alarm silence mistaken for clinical recovery",
      "Magic-object escalation without evidence"
    ],
    workstreams: [
      { id: "A", title: "Patient + airway", detail: "Reassess Rohan, chest movement, position and current airway route." },
      { id: "B", title: "Circuit + plan", detail: "Check circuit, monitoring reliability and the reviewed emergency plan." },
      { id: "C", title: "Communication access", detail: "Restore a reliable route without inventing a patient answer." }
    ],
    opening: "An intermittent ventilator alarm falls silent. Rohan's chest movement remains reduced, ectopy continues and a hand movement toward the neck is observed. Spare equipment is present, but current-route failure has not been established.",
    decisionPrompt: "What establishes the cause before a route-changing action?",
    choices: [
      {
        id: "restore-and-check",
        label: "Restore communication access, reassess Rohan, compare baseline, check circuit and position, open the current plan, and assign parallel workstreams",
        safe: true,
        nextPhase: "cause-led-reassessment",
        feedback: "Cause-led pathway opened. The spare route remains visible but cannot be committed until evidence and the reviewed plan support it."
      },
      {
        id: "magic-object",
        label: "Commit the same-size spare airway immediately because it is available",
        safe: false,
        feedback: "Availability is not indication, compatibility or authorization. The current route, plan and patient evidence still require assessment."
      },
      {
        id: "delay",
        label: "Wait for oxygen saturation to fall further before escalating reassessment",
        safe: false,
        feedback: "Persistent reduced movement, ectopy and unresolved communication already justify coordinated reassessment in the fictional scenario."
      }
    ],
    debrief: [
      "What remained abnormal after the alarm stopped?",
      "Which actions could occur in parallel?",
      "How did the team preserve communication and the current plan during escalation?",
      "What remained UNKNOWN rather than being filled in by inference?"
    ]
  }
];

export const stationDefinitions = [
  { id: "04", label: "Current airway plan", kind: "airway", purpose: "Defines reviewed routes, cautions, responders and rescue boundaries." },
  { id: "08", label: "Power continuity", kind: "breathing", purpose: "Checks battery, mains and backup power status." },
  { id: "09", label: "Circuit and connectors", kind: "breathing", purpose: "Checks connection, load, position and visible integrity." },
  { id: "17", label: "Patient and chest movement", kind: "breathing", purpose: "Compares current movement and effort with personal baseline." },
  { id: "19", label: "Monitoring and signal quality", kind: "circulation", purpose: "Separates reliable trend from artefact and number-only reasoning." },
  { id: "20", label: "AAC and supported decision-making", kind: "access", purpose: "Preserves direct communication, response time and access." }
];
