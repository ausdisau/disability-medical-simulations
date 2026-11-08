import { appendEvent } from "../runtime.js";
import { calculateRiskProfile } from "./risk.js";
import { decisionForRisk } from "./policies.js";

export const HARNESS_MODES = Object.freeze({
  OBSERVE_ONLY: "observe-only",
  SUPERVISED: "supervised",
  PAUSED: "paused"
});

export function createHarness() {
  return {
    mode: HARNESS_MODES.SUPERVISED,
    emergencyStop: false,
    proposals: [],
    traces: [],
    memory: []
  };
}

export function submitProposal(harness, proposal) {
  const riskProfile = calculateRiskProfile(proposal.riskDimensions ?? {});
  const gate = decisionForRisk(riskProfile, proposal);
  const record = {
    ...proposal,
    proposalId: proposal.proposalId ?? `proposal-${harness.proposals.length + 1}`,
    riskProfile,
    gate,
    status: gate.decision === "block" ? "blocked" : gate.decision === "confirm" ? "pending" : "suggested"
  };
  return {
    ...harness,
    proposals: [record, ...harness.proposals],
    traces: [{
      id: `trace-${harness.traces.length + 1}`,
      kind: "proposal-assessed",
      proposalId: record.proposalId,
      decision: gate.decision,
      gamma: riskProfile.normalisedGamma,
      at: proposal.tick ?? 0
    }, ...harness.traces]
  };
}

export function resolveProposal(harness, proposalId, humanDecision, modifiedProposal = null) {
  const proposal = harness.proposals.find((item) => item.proposalId === proposalId);
  if (!proposal) return { harness, error: "Unknown proposal." };
  if (proposal.gate.decision === "block" && humanDecision === "approve") {
    return { harness, error: "Hard-blocked proposals cannot be approved." };
  }
  const status = humanDecision === "reject" ? "rejected" : humanDecision === "suggest" ? "suggested" : "approved";
  const proposals = harness.proposals.map((item) => item.proposalId === proposalId ? {
    ...(modifiedProposal ? { ...item, ...modifiedProposal } : item),
    status,
    humanDecision
  } : item);
  return {
    harness: {
      ...harness,
      proposals,
      traces: [{
        id: `trace-${harness.traces.length + 1}`,
        kind: "human-decision",
        proposalId,
        decision: humanDecision,
        at: proposal.tick ?? 0
      }, ...harness.traces]
    },
    proposal: proposals.find((item) => item.proposalId === proposalId)
  };
}

export function executeApprovedProposal(harness, runtimeState, proposalId) {
  if (harness.emergencyStop || harness.mode === HARNESS_MODES.PAUSED) {
    return { harness, runtimeState, error: "Agent execution is disabled by the human override." };
  }
  const proposal = harness.proposals.find((item) => item.proposalId === proposalId);
  if (!proposal || proposal.status !== "approved") {
    return { harness, runtimeState, error: "Proposal requires explicit approval before execution." };
  }
  if (!proposal.transition || proposal.readOnly) {
    return {
      harness: {
        ...harness,
        traces: [{ id: `trace-${harness.traces.length + 1}`, kind: "suggestion-shown", proposalId, at: runtimeState.seconds }, ...harness.traces]
      },
      runtimeState,
      output: proposal.text
    };
  }
  const nextRuntime = appendEvent(runtimeState, "AGENT_PROPOSAL_EXECUTED", proposal.text, {
    proposalId,
    agentId: proposal.agentId,
    transition: proposal.transition
  });
  return {
    harness: {
      ...harness,
      traces: [{ id: `trace-${harness.traces.length + 1}`, kind: "proposal-executed", proposalId, at: runtimeState.seconds }, ...harness.traces]
    },
    runtimeState: nextRuntime,
    output: proposal.transition
  };
}

export function setEmergencyStop(harness, enabled) {
  return {
    ...harness,
    emergencyStop: enabled,
    mode: enabled ? HARNESS_MODES.PAUSED : HARNESS_MODES.SUPERVISED,
    traces: [{
      id: `trace-${harness.traces.length + 1}`,
      kind: enabled ? "emergency-stop-enabled" : "emergency-stop-cleared",
      at: 0
    }, ...harness.traces]
  };
}
