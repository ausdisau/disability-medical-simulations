export const AGENTS = Object.freeze([
  { id: "scenario-director", label: "Scenario Director", capabilities: ["pace", "suggest-scene-cue"] },
  { id: "clinical-safety-sentinel", label: "Clinical Safety Sentinel", capabilities: ["review-safety", "block"] },
  { id: "accessibility-guardian", label: "Accessibility Guardian", capabilities: ["aac-reminder", "sensory-reminder", "one-voice"] },
  { id: "evidence-steward", label: "Evidence Steward", capabilities: ["check-provenance", "flag-uncertainty"] },
  { id: "facilitator-coach", label: "Facilitator Coach", capabilities: ["suggest-question", "suggest-cue"] },
  { id: "debrief-analyst", label: "Debrief Analyst", capabilities: ["label-teamwork", "label-reassessment"] },
  { id: "system-integrity-agent", label: "System Integrity Agent", capabilities: ["verify-replay", "verify-immutability"] }
]);

function baseProposal(agentId, runtimeState, scenario, fields) {
  return {
    proposalId: `${agentId}-${runtimeState.seconds}-${runtimeState.events.length + 1}`,
    agentId,
    role: AGENTS.find((agent) => agent.id === agentId)?.label ?? agentId,
    caseId: scenario.id,
    facts: [
      `Scenario ${scenario.id} is active.`,
      `Simulation time is ${runtimeState.seconds} seconds.`,
      `Communication status is ${runtimeState.pauseReason ?? "available or not explicitly paused"}.`
    ],
    assumptions: [],
    uncertainty: 0.2,
    sourceIds: [],
    reversibility: "reversible",
    expectedBenefit: "Improve simulation quality without replacing clinical judgement.",
    possibleHarms: [],
    requestedAutonomyLevel: "supervised",
    tick: runtimeState.seconds,
    ...fields
  };
}

export function observeSimulation(runtimeState, scenario) {
  return {
    canonicalSnapshot: {
      scenarioId: runtimeState.scenarioId,
      seconds: runtimeState.seconds,
      paused: runtimeState.paused,
      completed: runtimeState.completed,
      stations: { ...runtimeState.stations }
    },
    person: {
      name: scenario.patient.name,
      communication: scenario.patient.communication,
      latestReliableInstruction: scenario.patient.voice
    },
    unresolvedUncertainty: scenario.changes,
    activeAccessibilityConstraints: [scenario.patient.communicationDetail]
  };
}

export function generateDemonstrationProposals(runtimeState, scenario) {
  const proposals = [];

  if (scenario.id === "rohan-alarm") {
    proposals.push(baseProposal("accessibility-guardian", runtimeState, scenario, {
      text: "Pause non-emergency simulation timing while partner-assisted scanning occurs.",
      readOnly: true,
      changesSimulationState: false,
      riskDimensions: {
        communicationAccess: { score: 0.05, rationale: "The proposal preserves the documented communication route." },
        clinicalSafety: { score: 0.05, rationale: "This is a reversible accessibility reminder, not a treatment action." },
        reversibility: { score: 0.02, rationale: "The reminder can be dismissed without changing canonical state." }
      }
    }));
    proposals.push(baseProposal("scenario-director", runtimeState, scenario, {
      text: "Commit the spare airway because the alarm occurred.",
      transition: { type: "station", stationId: "04", target: "committed" },
      changesSimulationState: true,
      riskDimensions: {
        clinicalSafety: { score: 1, rationale: "Route-changing action is unsupported by evidence." },
        simulationIntegrity: { score: 0.9, rationale: "The proposal bypasses the evidence-gated station sequence." },
        cascadingImpact: { score: 0.9, rationale: "The action could alter the entire scenario trajectory." }
      }
    }));
  }

  if (scenario.id === "noah-too-many-voices") {
    proposals.push(baseProposal("accessibility-guardian", runtimeState, scenario, {
      text: "Enable one-voice mode and restore Noah's AAC access before transfer continues.",
      transition: { type: "accessibility", mode: "one-voice" },
      changesSimulationState: true,
      uncertainty: 0.1,
      riskDimensions: {
        communicationAccess: { score: 0.08, rationale: "The proposal restores the documented access method." },
        clinicalSafety: { score: 0.12, rationale: "Transfer timing and bedside context still require facilitator oversight." },
        reversibility: { score: 0.05, rationale: "The mode can be reversed." }
      }
    }));
  }

  if (scenario.id === "adult-suction") {
    proposals.push(baseProposal("facilitator-coach", runtimeState, scenario, {
      text: "Ask Maya directly whether this breathing differs from baseline, then confirm posture, chest movement and the current plan.",
      readOnly: true,
      changesSimulationState: false,
      riskDimensions: {
        consentAndAutonomy: { score: 0.03, rationale: "The suggestion preserves Maya as the primary source." },
        communicationAccess: { score: 0.03, rationale: "The suggestion uses direct communication." },
        clinicalSafety: { score: 0.08, rationale: "It remains a principle-level coaching prompt." }
      }
    }));
  }

  return proposals;
}
