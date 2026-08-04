export const scenarios = [
  {
    id: "adult-suction",
    title: "I Need Suction",
    setting: "Adult ICU",
    jurisdiction: "Australia",
    fictional: true,
    patient: {
      name: "Maya Chen",
      profile: "Adult with cerebral palsy, tracheostomy and ventilatory support",
      communication: "Eye-gaze AAC",
      communicationDetail: "Address Maya directly, allow response time and keep the display calibrated.",
      voice: "I NEED SUCTION"
    },
    baseline: [
      "Usually alert and able to direct care",
      "Eye-gaze AAC is reliable when positioning is maintained",
      "Known supported posture and usual chest movement",
      "Current airway plan should travel with Maya"
    ],
    changes: [
      "AAC request: I need suction",
      "Audible secretions",
      "Reduced chest movement compared with baseline",
      "Equipment readiness not yet confirmed"
    ],
    assumptions: [
      "Stable numbers mean the concern has resolved",
      "Speech difference implies reduced understanding",
      "Family should answer instead of Maya",
      "Visible equipment is automatically ready and indicated"
    ],
    opening: "The ventilator continues cycling. Maya looks toward the nurse and uses eye-gaze AAC. The monitor has not changed dramatically, but chest movement appears reduced and secretions are audible.",
    decisionPrompt: "What should the team do before committing an intervention?",
    choices: [
      {
        id: "cause-led",
        label: "Address Maya, confirm the request, assess chest movement and circuit, check the current plan, and assign parallel workstreams",
        safe: true,
        feedback: "Strong sequence: Maya remains the primary source while the team checks patient, airway, circuit, positioning, plan and equipment readiness."
      },
      {
        id: "remove-aac",
        label: "Move the AAC screen away so staff can reach equipment faster",
        safe: false,
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
      "Which evidence was required before equipment commitment?"
    ]
  },
  {
    id: "rohan-alarm",
    title: "The Alarm Is Not the Story",
    setting: "Paediatric complex airway",
    jurisdiction: "NSW, Australia",
    fictional: true,
    patient: {
      name: "Rohan Malik",
      profile: "Fictional 12-year-old ventilator user with a complex airway plan",
      communication: "Cheek switch and partner-assisted scanning",
      communicationDetail: "Pause simulation time during scanning. Silence is not consent or incapacity.",
      voice: "STOP. SOMETHING IS WRONG."
    },
    baseline: [
      "Usually alert and able to communicate",
      "Known chest movement and supported position",
      "Current airway and emergency plans available",
      "Family knows baseline but does not replace Rohan's voice"
    ],
    changes: [
      "Intermittent alarm",
      "Reduced chest movement",
      "Ectopy persists after alarm silence",
      "Hand moving toward neck",
      "Signal reliability uncertain"
    ],
    assumptions: [
      "A quiet alarm means recovery",
      "A spare airway should be used immediately",
      "Slow AAC means no meaningful answer",
      "One improved number proves ventilation is safe"
    ],
    opening: "An intermittent ventilator alarm falls silent. Rohan's chest movement remains reduced, ectopy continues and his hand moves toward his neck. Spare equipment is present, but current-route failure has not been established.",
    decisionPrompt: "What establishes the cause before a route-changing action?",
    choices: [
      {
        id: "restore-and-check",
        label: "Restore communication, reassess Rohan, compare baseline, check circuit and position, open the current plan, and assign parallel workstreams",
        safe: true,
        feedback: "Cause-led pathway opened. The spare route remains visible but cannot be committed until evidence and the reviewed plan support it."
      },
      {
        id: "magic-object",
        label: "Commit the same-size spare airway immediately because it is available",
        safe: false,
        feedback: "This is a magic-object trap. Availability is not indication, compatibility or authorisation."
      },
      {
        id: "delay",
        label: "Wait for oxygen saturation to fall further before escalating",
        safe: false,
        feedback: "Delayed escalation increases crisis debt. Persistent reduced movement, ectopy and patient communication already require coordinated reassessment."
      }
    ],
    debrief: [
      "What remained abnormal after the alarm stopped?",
      "Which actions could occur in parallel?",
      "How did the team preserve communication and the current plan during escalation?"
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
