const PROTECTED_DOMAINS = new Set(["CLINICAL", "MEDICATION", "RIGHTS", "CAPACITY", "AUTHORITY"]);
const PROTECTED_KEYS = new Set([
  "physiology",
  "diagnosis",
  "medication",
  "dose",
  "ventilatorSetting",
  "consent",
  "refusal",
  "capacity",
  "substituteAuthority",
  "treatmentCeiling"
]);

function containsProtectedKey(value) {
  if (!value || typeof value !== "object") return false;
  for (const [key, nested] of Object.entries(value)) {
    if (PROTECTED_KEYS.has(key)) return true;
    if (containsProtectedKey(nested)) return true;
  }
  return false;
}

export function validateModelProposal(raw, expectedHeadEventHash) {
  if (!raw || typeof raw !== "object") return { ok: false, error: "invalid_proposal" };
  if (!raw.proposalId || raw.expectedHeadEventHash !== expectedHeadEventHash) {
    return { ok: false, error: "stale_storyline_head" };
  }

  const events = Array.isArray(raw.candidateEvents) ? raw.candidateEvents : [];
  if (events.some((event) => PROTECTED_DOMAINS.has(event?.domain) || containsProtectedKey(event?.payload))) {
    return { ok: false, error: "protected_domain_mutation" };
  }

  return {
    ok: true,
    proposal: {
      proposalId: String(raw.proposalId),
      expectedHeadEventHash: raw.expectedHeadEventHash,
      kind: String(raw.kind ?? "SOCIAL"),
      actorRefs: Array.isArray(raw.actorRefs) ? [...raw.actorRefs] : [],
      targetRefs: Array.isArray(raw.targetRefs) ? [...raw.targetRefs] : [],
      locationRef: raw.locationRef ?? null,
      candidateDialogue: Array.isArray(raw.candidateDialogue) ? structuredClone(raw.candidateDialogue) : [],
      candidateEvents: structuredClone(events),
      uncertainty: raw.uncertainty ?? null,
      sourceRefs: Array.isArray(raw.sourceRefs) ? [...raw.sourceRefs] : []
    }
  };
}
