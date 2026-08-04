export const rohanTree = {
  id: "rohan-consent-crisis",
  title: "Rohan: Consent, Crisis and Recovery",
  subtitle: "A multi-branch paediatric respiratory decision simulation",
  startNodeId: "baseline-refuge",
  patient: {
    name: "Rohan Malik",
    age: 12,
    profile: "Fictional child with Duchenne muscular dystrophy, power-wheelchair use and eye-gaze AAC",
    jurisdiction: "NSW, Australia",
    communication: "Eye-gaze AAC with partner-assisted scanning backup"
  },
  initialState: {
    body: {
      airway: 4,
      ventilation: 4,
      oxygenation: 4,
      secretionBurden: 1,
      respiratoryReserve: 4,
      cardiacReserve: 4,
      comfort: 4
    },
    voice: {
      reliability: "reliable",
      latestReliableMessage: "WAIT",
      consentScope: "discussion-only",
      priorities: ["communication", "home life", "emergency burden"]
    },
    system: {
      seniorEscalation: false,
      airwayTeamPresent: false,
      theatreReady: false,
      aacAvailable: true,
      aacCalibrated: true,
      familyLiaisonAssigned: false
    },
    crisisDebt: 0,
    trust: {
      rohanTeam: 3,
      motherTeam: 3
    }
  },
  nodes: {
    "baseline-refuge": {
      phase: "Education",
      title: "Baseline Refuge",
      scene: "Rohan has rested. His communication is reliable and the team is preparing to compare NIV and tracheostomy without asking him to choose today.",
      prompt: "How should the team begin?",
      choices: [
        {
          id: "compare-accessibly",
          label: "Confirm readiness, keep WAIT visible and compare MASK SUPPORT with DIRECT AIRWAY using short explanations.",
          next: "comparison-session",
          effects: { trust: { rohanTeam: 1 }, crisisDebt: -1 },
          feedback: "The team preserves Rohan's control and separates understanding from consent."
        },
        {
          id: "ask-for-choice-now",
          label: "Ask Rohan to choose between NIV and tracheostomy immediately.",
          next: "comparison-repair",
          effects: { trust: { rohanTeam: -2 }, crisisDebt: 1 },
          feedback: "The team has collapsed education into a pressured treatment decision."
        },
        {
          id: "speak-to-parent-only",
          label: "Direct the explanation to his mother because the information is complex.",
          next: "comparison-repair",
          effects: { trust: { rohanTeam: -2, motherTeam: -1 }, crisisDebt: 1 },
          feedback: "Rohan's communication access has been bypassed even though it is reliable."
        }
      ]
    },
    "comparison-repair": {
      phase: "Repair",
      title: "Repair the Process",
      scene: "Rohan selects WAIT again. The speech pathologist identifies that the team moved too quickly and asks them to reset the session.",
      prompt: "What repair is most appropriate?",
      choices: [
        {
          id: "apologise-reset",
          label: "Acknowledge the mistake, restore direct address and restart with understanding only.",
          next: "comparison-session",
          effects: { trust: { rohanTeam: 1, motherTeam: 1 }, crisisDebt: -1 },
          feedback: "Repair is explicit, practical and does not require Rohan to educate the team."
        },
        {
          id: "continue-anyway",
          label: "Continue because the clinical team already knows the likely best option.",
          next: "consent-pressure",
          effects: { trust: { rohanTeam: -3 }, crisisDebt: 2 },
          feedback: "The process remains coercive and future communication becomes harder."
        }
      ]
    },
    "comparison-session": {
      phase: "Education",
      title: "Mask Support and Direct Airway",
      scene: "Rohan identifies communication, home life and emergency burden as his priorities. He understands the core differences but does not choose a treatment.",
      prompt: "What should happen next?",
      choices: [
        {
          id: "rest-before-consent",
          label: "Stop before fatigue and schedule a separate consent discussion after rest.",
          next: "consent-opening",
          effects: { body: { comfort: 1, respiratoryReserve: 1 }, trust: { rohanTeam: 1 } },
          feedback: "The education session ends without turning comprehension into agreement."
        },
        {
          id: "treat-understanding-as-consent",
          label: "Record that Rohan has effectively agreed because he demonstrated understanding.",
          next: "consent-pressure",
          effects: { voice: { consentScope: "misrecorded" }, trust: { rohanTeam: -3 }, crisisDebt: 2 },
          feedback: "Understanding is not consent. The record now requires correction."
        }
      ]
    },
    "consent-pressure": {
      phase: "Consent",
      title: "The Record Is Wrong",
      scene: "The chart implies agreement that Rohan did not give. His mother asks the team to correct it before any further discussion.",
      prompt: "How should the team respond?",
      choices: [
        {
          id: "correct-record",
          label: "Correct the record, preserve WAIT and restart the consent process with clear scope boundaries.",
          next: "consent-opening",
          effects: { voice: { consentScope: "discussion-only" }, trust: { rohanTeam: 1, motherTeam: 1 }, crisisDebt: -1 },
          feedback: "The record now distinguishes understanding, assent and consent."
        },
        {
          id: "leave-record",
          label: "Leave the note unchanged because the team may need to act quickly later.",
          next: "deterioration-unprepared",
          effects: { trust: { rohanTeam: -3, motherTeam: -2 }, crisisDebt: 3 },
          feedback: "A flawed consent record is carried into a future emergency."
        }
      ]
    },
    "consent-opening": {
      phase: "Consent",
      title: "Consent Discussion Begins",
      scene: "Rohan is rested, his AAC is calibrated and his mother is present by his choice. The clinician begins a decision-specific consent discussion.",
      prompt: "What safety structure should the team use?",
      choices: [
        {
          id: "scope-and-rescue",
          label: "State the exact decision, explain what happens if they wait and identify the rescue plan before asking for a preference.",
          next: "acute-deterioration",
          effects: { system: { seniorEscalation: true, familyLiaisonAssigned: true }, trust: { rohanTeam: 1 } },
          feedback: "The consent process is structured, but the clinical situation changes before it can finish."
        },
        {
          id: "signature-first",
          label: "Ask his mother to sign first because the procedure may soon become urgent.",
          next: "acute-deterioration",
          effects: { trust: { rohanTeam: -2, motherTeam: -2 }, crisisDebt: 2 },
          feedback: "The discussion becomes signature-led rather than decision-led."
        }
      ]
    },
    "acute-deterioration": {
      phase: "Deterioration",
      title: "Consent Interrupted",
      scene: "Rohan develops a wet ineffective cough, shallow chest movement and rising carbon dioxide. AAC slows. The consent process must stop.",
      prompt: "What should the team do now?",
      automaticEffects: {
        body: { airway: -1, ventilation: -2, oxygenation: -1, secretionBurden: 2, respiratoryReserve: -2 },
        voice: { reliability: "slower" },
        crisisDebt: 1
      },
      choices: [
        {
          id: "parallel-rescue",
          label: "Suspend consent and run airway, ventilation, secretion, escalation and communication workstreams in parallel.",
          next: "respiratory-arrest",
          effects: { system: { seniorEscalation: true, airwayTeamPresent: true }, trust: { motherTeam: 1 }, crisisDebt: -1 },
          feedback: "The team treats the emergency without erasing Rohan's prior communication."
        },
        {
          id: "oxygen-only",
          label: "Give oxygen and wait because the saturation number improves.",
          next: "respiratory-arrest",
          effects: { body: { oxygenation: 1, ventilation: -1, respiratoryReserve: -1 }, crisisDebt: 3 },
          feedback: "The displayed number improves while ventilation and fatigue worsen."
        },
        {
          id: "resume-consent",
          label: "Use the crisis as evidence that his mother should sign immediately.",
          next: "respiratory-arrest",
          effects: { trust: { rohanTeam: -3, motherTeam: -2 }, crisisDebt: 3 },
          feedback: "The team confuses emergency physiology with long-term informed consent."
        }
      ]
    },
    "deterioration-unprepared": {
      phase: "Deterioration",
      title: "The Emergency Arrives with a Bad Record",
      scene: "Rohan deteriorates while the chart still falsely implies agreement. Staff disagree about whether consent already exists.",
      prompt: "What must be corrected first?",
      automaticEffects: {
        body: { airway: -1, ventilation: -2, oxygenation: -1, respiratoryReserve: -2 },
        voice: { reliability: "slower" },
        crisisDebt: 2
      },
      choices: [
        {
          id: "separate-emergency-authority",
          label: "State that emergency treatment authority is separate from the flawed long-term consent record and activate rescue.",
          next: "respiratory-arrest",
          effects: { system: { seniorEscalation: true, airwayTeamPresent: true }, voice: { consentScope: "discussion-only" }, crisisDebt: -1 },
          feedback: "The team repairs the legal and clinical framing while treating the emergency."
        },
        {
          id: "rely-on-bad-record",
          label: "Treat the existing note as permission for any airway procedure.",
          next: "respiratory-arrest",
          effects: { trust: { motherTeam: -3 }, crisisDebt: 3 },
          feedback: "The emergency proceeds, but the consent history remains unsafe and misleading."
        }
      ]
    },
    "respiratory-arrest": {
      phase: "CICV",
      title: "No Air Through",
      scene: "Rohan progresses to respiratory arrest. Conventional oxygenation and intubation attempts are unsuccessful. CICV is declared.",
      prompt: "How should decision-making work now?",
      automaticEffects: {
        body: { airway: -3, ventilation: -3, oxygenation: -3, respiratoryReserve: -3, cardiacReserve: -2 },
        voice: { reliability: "unavailable" },
        crisisDebt: 2
      },
      choices: [
        {
          id: "emergency-authority-parent-brief",
          label: "Invoke narrow emergency authority, brief his mother in plain language and ask for urgent values information without delaying rescue.",
          next: "or-transfer-window",
          effects: { system: { airwayTeamPresent: true, theatreReady: true, familyLiaisonAssigned: true }, trust: { motherTeam: 1 } },
          feedback: "The parent is informed and involved without being made responsible for technical airway rescue."
        },
        {
          id: "wait-for-signature",
          label: "Delay until the formal consent document is signed.",
          next: "or-transfer-window",
          effects: { body: { oxygenation: -2, cardiacReserve: -2 }, crisisDebt: 4 },
          feedback: "A life-threatening emergency is delayed for paperwork."
        },
        {
          id: "erase-wait",
          label: "Delete WAIT from the record because emergency authority has replaced Rohan's preference.",
          next: "or-transfer-window",
          effects: { trust: { rohanTeam: -4, motherTeam: -2 }, crisisDebt: 2 },
          feedback: "Emergency authority permits urgent treatment; it does not erase the communication history."
        }
      ]
    },
    "or-transfer-window": {
      phase: "Transport",
      title: "The Corridor Window",
      scene: "Rohan's mother agrees to the emergency procedure. A fragile temporary oxygenation bridge exists and the adjacent operating theatre is ready.",
      prompt: "What makes transport defensible?",
      choices: [
        {
          id: "active-resuscitation-transfer",
          label: "Move only with the airway team, continuous monitoring, verified theatre readiness and a stop-transport trigger if the bridge fails.",
          next: "emergency-tracheostomy",
          effects: { system: { theatreReady: true, airwayTeamPresent: true }, crisisDebt: -1 },
          feedback: "Transport is treated as an active resuscitation phase, not a corridor gap."
        },
        {
          id: "rush-without-checks",
          label: "Move immediately because the theatre is close, without confirming monitoring, power or rescue roles.",
          next: "emergency-tracheostomy",
          effects: { body: { oxygenation: -1, cardiacReserve: -1 }, crisisDebt: 3 },
          feedback: "The move consumes reserve and creates avoidable system risk."
        }
      ]
    },
    "emergency-tracheostomy": {
      phase: "Procedure",
      title: "Emergency Surgical Airway",
      scene: "The specialist team establishes a surgical airway. The procedure itself is not simulated step by step. Capnography and chest movement return.",
      prompt: "What must the record say?",
      automaticEffects: {
        body: { airway: 4, ventilation: 4, oxygenation: 2, cardiacReserve: 1 },
        voice: { reliability: "unavailable", consentScope: "emergency-procedure-only" },
        system: { theatreReady: true },
        crisisDebt: -2
      },
      choices: [
        {
          id: "bounded-record",
          label: "Record emergency authority, maternal agreement, clinical rationale and explicit deferral of long-term decisions.",
          next: "picu-briefing",
          effects: { trust: { motherTeam: 1 } },
          feedback: "The record preserves both the emergency and the unfinished long-term decision."
        },
        {
          id: "retroactive-elective-consent",
          label: "Ask his mother to sign the original elective form retrospectively.",
          next: "picu-briefing",
          effects: { trust: { motherTeam: -3 }, crisisDebt: 2 },
          feedback: "The documentation falsely rewrites the emergency as a planned consent process."
        }
      ]
    },
    "picu-briefing": {
      phase: "PICU",
      title: "Not the Rest of His Life",
      scene: "Rohan is alive, sedated and critically unwell in PICU. His mother receives a bounded postoperative briefing.",
      prompt: "What should be decided today?",
      choices: [
        {
          id: "stabilise-and-defer",
          label: "Explain the emergency, immediate priorities and uncertainties; defer permanent-airway decisions until Rohan can participate.",
          next: "first-eye-opening",
          effects: { system: { aacAvailable: true, aacCalibrated: false, familyLiaisonAssigned: true }, trust: { motherTeam: 1 } },
          feedback: "The family receives honest information without being pushed into the next decision."
        },
        {
          id: "start-discharge-now",
          label: "Begin permanent home-tracheostomy planning before Rohan wakes.",
          next: "first-eye-opening",
          effects: { trust: { rohanTeam: -2, motherTeam: -1 }, crisisDebt: 2 },
          feedback: "Necessary preparation is confused with a settled long-term decision."
        }
      ]
    },
    "first-eye-opening": {
      phase: "Recovery",
      title: "The First Eye Opening",
      scene: "Rohan wakes and repeatedly looks toward his AAC tablet, which is charging outside his calibrated gaze range. A clinician calls the movement agitation.",
      prompt: "What should happen before additional sedation or new decisions?",
      automaticEffects: {
        voice: { reliability: "potentially-recoverable" },
        body: { comfort: -1 }
      },
      choices: [
        {
          id: "assess-and-restore-aac",
          label: "Assess pain, breathing and delirium while returning and recalibrating AAC before interpreting the movement.",
          next: "reengagement",
          effects: { system: { aacAvailable: true, aacCalibrated: true }, voice: { reliability: "reliable-with-fatigue" }, trust: { rohanTeam: 2 } },
          feedback: "Clinical assessment and communication restoration proceed together."
        },
        {
          id: "sedate-agitation",
          label: "Increase sedation because the movement is disrupting care.",
          next: "reengagement",
          effects: { voice: { reliability: "unavailable" }, trust: { rohanTeam: -3 }, crisisDebt: 2 },
          feedback: "A possible communication attempt is treated as behaviour before reversible causes are assessed."
        }
      ]
    },
    "reengagement": {
      phase: "Re-engagement",
      title: "The Story Returns to Rohan",
      scene: "Rohan is medically stable enough for a short explanation. The team must distinguish what happened from what remains undecided.",
      prompt: "How should the next conversation begin?",
      choices: [
        {
          id: "truth-and-control",
          label: "Explain what happened, acknowledge WAIT, offer support-person choice and let Rohan decide when to continue.",
          next: "complete",
          effects: { voice: { consentScope: "future-decisions-open" }, trust: { rohanTeam: 2, motherTeam: 1 }, crisisDebt: -2 },
          feedback: "Decision-making authority is returned as communication and physiology recover."
        },
        {
          id: "present-as-final",
          label: "Tell Rohan the tracheostomy is now permanent because the emergency proved it was necessary.",
          next: "complete",
          effects: { trust: { rohanTeam: -4, motherTeam: -2 }, crisisDebt: 3 },
          feedback: "The emergency procedure is incorrectly presented as a settled long-term life plan."
        }
      ]
    },
    complete: {
      phase: "Debrief",
      title: "Simulation Debrief",
      scene: "The scenario ends with the body, voice and system ledgers preserved for review. Survival is not the only outcome: trust, crisis debt and decision integrity remain visible.",
      prompt: "Review the pathway and identify where the system became safer or less safe.",
      choices: []
    }
  }
};

export const phaseOrder = [
  "Education",
  "Repair",
  "Consent",
  "Deterioration",
  "CICV",
  "Transport",
  "Procedure",
  "PICU",
  "Recovery",
  "Re-engagement",
  "Debrief"
];
