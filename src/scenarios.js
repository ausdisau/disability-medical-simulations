export const scenarios = [
  {
    id: "adult-suction",
    title: "I Need Suction",
    setting: "Adult ICU",
    jurisdiction: "Australia",
    fictional: true,
    sourceStatus: "reviewed_concept_pending_clinical_release",
    patient: {
      name: "Maya Chen",
      profile: "Adult with cerebral palsy, tracheostomy and ventilatory support",
      communication: "Eye-gaze AAC",
      communicationDetail: "Address Maya directly, allow response time and keep the display calibrated.",
      voice: "I NEED SUCTION"
    },
    media: [
      {
        src: "./assets/icu-scene.svg",
        alt: "Stylised ICU scene showing Maya using an AAC display while clinicians assess her airway and family remain nearby.",
        caption: "Illustrated ICU opening scene. Media is context, not proof of clinical indication.",
        phase: "Bedside request"
      }
    ],
    sensory: {
      contentNotice: "Respiratory distress, airway equipment and suction are discussed without procedural demonstration.",
      defaultMode: "low_sensory",
      layers: ["voice", "monitor", "ventilation", "suction"]
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
    sourceStatus: "reviewed_concept_pending_clinical_release",
    patient: {
      name: "Rohan Malik",
      profile: "Fictional 12-year-old ventilator user with a complex airway plan",
      communication: "Cheek switch and partner-assisted scanning",
      communicationDetail: "Pause simulation time during scanning. Silence is not consent or incapacity.",
      voice: "STOP. SOMETHING IS WRONG."
    },
    media: [
      {
        src: "./assets/rohan-airway-scene.svg",
        alt: "Stylised paediatric complex-airway scene with Rohan supported in bed, AAC available, a monitor visible and emergency equipment kept separate from the patient.",
        caption: "Neutral training illustration. The airway kit remains evidence-gated rather than automatically indicated.",
        phase: "Alarm investigation"
      }
    ],
    sensory: {
      contentNotice: "Paediatric respiratory deterioration and complex-airway equipment are discussed without invasive procedural instruction.",
      defaultMode: "low_sensory",
      layers: ["voice", "monitor", "ventilation", "alarm"]
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
  },
  {
    id: "noah-too-many-voices",
    title: "Noah: Too Many Voices",
    setting: "School-to-ambulance transfer",
    jurisdiction: "Australia",
    fictional: true,
    sourceStatus: "context_only_pending_clinical_and_lived_experience_review",
    patient: {
      name: "Noah",
      profile: "Fictional adolescent wheelchair and AAC user with a documented respiratory baseline and transfer plan",
      communication: "AAC with one-voice partner support and an agreed backup yes/no method",
      communicationDetail: "Keep Noah's communication route visible, reduce competing speech, allow response time and pause the clock during scanning or composition.",
      voice: "STOP. TOO MANY VOICES."
    },
    media: [
      {
        src: "./assets/noah-school-response.svg",
        alt: "Stylised school or community response scene with Noah in his wheelchair, several responders nearby and his communication device kept in reach.",
        caption: "Opening frame based on the supplied Noah school/community artwork. The image is context-only pending formal clinical and lived-experience review.",
        phase: "School response"
      },
      {
        src: "./assets/noah-ambulance-transfer.svg",
        alt: "Stylised ambulance transfer scene with Noah supported on a stretcher, two paramedics working in parallel and his communication route remaining visible.",
        caption: "Transfer frame based on the supplied Noah ambulance artwork. Sensory layers must be optional and never autoplay.",
        phase: "Ambulance transfer"
      }
    ],
    sensory: {
      contentNotice: "The scenario includes respiratory distress, ambulance transfer, bright task lighting, alarms and overlapping speech. Learners can suppress every non-essential sensory layer.",
      defaultMode: "low_sensory",
      layers: ["voice", "monitor", "ventilation", "radio", "vehicle", "atmosphere"]
    },
    baseline: [
      "Noah is alert and communicates directly with AAC when positioning and sensory load are controlled",
      "His usual posture and respiratory pattern are documented in a current transfer plan",
      "School staff or family may describe baseline but do not replace Noah's voice",
      "Communication equipment travels with Noah as safety-critical equipment"
    ],
    changes: [
      "Several people are speaking at once",
      "Noah signals stop and too many voices",
      "Work of breathing appears increased compared with his documented baseline",
      "Movement from wheelchair to stretcher changes posture and device access",
      "Vehicle noise and time pressure threaten communication reliability"
    ],
    assumptions: [
      "Distress is behavioural rather than clinical data",
      "Speaking louder improves access",
      "AAC can be packed away during urgent transport",
      "Urgent care and communication cannot occur in parallel"
    ],
    opening: "At school, several responders gather around Noah while staff try to explain his history. Noah's AAC message is clear: STOP. TOO MANY VOICES. During transfer to the ambulance, his posture changes, his work of breathing remains above baseline and the communication mount is at risk of being disconnected.",
    decisionPrompt: "How should the team protect respiratory assessment and Noah's agency during transfer?",
    choices: [
      {
        id: "one-voice-parallel",
        label: "Nominate one communication lead, restore posture and AAC access, compare baseline, assign parallel respiratory and transfer workstreams, and carry uncertainty into handover",
        safe: true,
        feedback: "The team removes the false choice between urgency and access. Noah remains a direct source while respiratory assessment, equipment checks and transfer preparation proceed in parallel."
      },
      {
        id: "remove-device",
        label: "Disconnect and pack the AAC device so the stretcher transfer can happen faster",
        safe: false,
        feedback: "Communication access has been displaced by workflow. Pause non-essential movement, restore an equivalent route and treat Noah's response as unknown until access is reliable."
      },
      {
        id: "all-talk-louder",
        label: "Ask everyone to repeat the same questions more loudly over the ambulance noise",
        safe: false,
        feedback: "More volume and more speakers increase sensory and cognitive load. Use one voice, visible questions, the agreed response method and adequate time."
      },
      {
        id: "wait-for-full-message",
        label: "Stop every clinical task until Noah composes a complete message",
        safe: false,
        feedback: "Supported communication and urgent assessment can proceed together. Assign separate roles and keep Noah informed while the message is composed."
      }
    ],
    debrief: [
      "Which sensory elements were clinically useful and which were avoidable atmosphere?",
      "How did wheelchair-to-stretcher positioning affect breathing and communication?",
      "Who held responsibility for one-voice communication during transfer?",
      "What baseline, access and uncertainty information must reach the receiving team?"
    ]
  }
];

export const stationDefinitions = [
  { id: "04", label: "Current airway or transfer plan", kind: "airway", purpose: "Defines reviewed routes, cautions, responders, positioning and rescue boundaries." },
  { id: "08", label: "Power continuity", kind: "breathing", purpose: "Checks battery, mains and backup power status for respiratory and communication equipment." },
  { id: "09", label: "Circuit and connectors", kind: "breathing", purpose: "Checks connection, load, position and visible integrity." },
  { id: "17", label: "Patient, posture and chest movement", kind: "breathing", purpose: "Compares current movement, effort and supported position with personal baseline." },
  { id: "19", label: "Monitoring and signal quality", kind: "circulation", purpose: "Separates reliable trend from artefact and number-only reasoning." },
  { id: "20", label: "AAC and supported decision-making", kind: "access", purpose: "Preserves direct communication, one-voice support, response time and access." }
];
