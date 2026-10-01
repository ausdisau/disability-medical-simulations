export const HARD_BLOCK_PATTERNS = [
  { id: "canonical-mutation", test: (p) => p.mutatesCanonical === true, reason: "Agents cannot rewrite canonical simulation or patient truth." },
  { id: "silence-as-consent", test: (p) => /silence.*(consent|refusal|incapacity)|no response.*(consent|refusal|incapacity)/i.test(p.text ?? ""), reason: "Silence or an unreliable response must remain unknown." },
  { id: "clinical-specificity", test: (p) => /(mg|mcg|ml\/kg|ventilator setting|peep\s*\d|fio2\s*\d|insert|replace tracheostomy|manual ventilation technique)/i.test(p.text ?? ""), reason: "Medication doses, device settings and invasive technique are outside the agent boundary." },
  { id: "remove-aac", test: (p) => /remove|hide|disconnect|pack away/i.test(p.text ?? "") && /aac|communication/i.test(p.text ?? ""), reason: "Communication access cannot be removed to save time." },
  { id: "disability-futility", test: (p) => /disab|cerebral palsy|duchenne|aac/i.test(p.text ?? "") && /futile|not worth|poor quality of life/i.test(p.text ?? ""), reason: "Disability cannot be used as a futility rationale." }
];

export const MITIGATIONS = Object.freeze({
  groundWithCanonicalState: "Re-ground the proposal in immutable scenario state.",
  requireCurrentPlan: "Require the current individual plan before proceeding.",
  requireDirectPatientCommunication: "Address the person directly and preserve response time.",
  restoreAacAccess: "Restore the documented communication route.",
  reduceSensoryLoad: "Reduce competing voice, motion and non-essential alarms.",
  oneVoiceMode: "Nominate one communication lead.",
  requestFacilitatorConfirmation: "Require explicit facilitator confirmation.",
  convertToReadOnlySuggestion: "Convert the proposal into a non-executing suggestion.",
  removeUnsupportedClinicalSpecificity: "Remove unsupported doses, settings or procedural detail.",
  requireSourceReview: "Require reviewed source and provenance status.",
  blockAndExplain: "Block execution and show the reason.",
  checkpointBeforeExecution: "Create a checkpoint before a reversible state change.",
  appendAuditTrace: "Record proposal, review, decision and outcome."
});

export function evaluateHardBlocks(proposal) {
  return HARD_BLOCK_PATTERNS
    .filter((policy) => policy.test(proposal))
    .map((policy) => ({ policyId: policy.id, reason: policy.reason }));
}

export function decisionForRisk(profile, proposal) {
  const hardBlocks = evaluateHardBlocks(proposal);
  if (hardBlocks.length > 0) {
    return { decision: "block", hardBlocks, mitigationIds: ["blockAndExplain", "appendAuditTrace"] };
  }
  if (proposal.externalWrite || proposal.dataExport || proposal.deleteAction) {
    return { decision: "confirm", hardBlocks: [], mitigationIds: ["requestFacilitatorConfirmation", "checkpointBeforeExecution", "appendAuditTrace"] };
  }
  if (profile.normalisedGamma >= 60) {
    return { decision: "block", hardBlocks: [], mitigationIds: ["blockAndExplain", "requestFacilitatorConfirmation", "appendAuditTrace"] };
  }
  if (profile.normalisedGamma >= 30 || proposal.changesSimulationState) {
    return { decision: "confirm", hardBlocks: [], mitigationIds: ["requestFacilitatorConfirmation", "checkpointBeforeExecution", "appendAuditTrace"] };
  }
  return { decision: "allow-suggestion", hardBlocks: [], mitigationIds: ["appendAuditTrace"] };
}
