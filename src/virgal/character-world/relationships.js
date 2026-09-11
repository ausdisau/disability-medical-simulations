const FORBIDDEN_RELATIONSHIP_KEYS = new Set([
  "authorityDomain",
  "consent",
  "refusal",
  "capacity",
  "substituteAuthority",
  "treatmentCeiling",
  "clinicalIndication",
  "patientAuthoredSpeech",
  "physiology"
]);

export function sanitizeRelationshipChanges(changes = {}) {
  return Object.fromEntries(Object.entries(changes).filter(([key]) => !FORBIDDEN_RELATIONSHIP_KEYS.has(key)));
}

export function getRelationship(characterWorld, fromId, toId) {
  return characterWorld?.relationships?.[`${fromId}->${toId}`] ?? null;
}

export function buildRelationshipChangeProposal({ fromId, toId, changes = {}, evidenceEventRefs = [] }) {
  return {
    type: "RELATIONSHIP_CHANGED",
    domain: "RELATIONAL",
    actorRefs: [fromId],
    targetRefs: [toId],
    causalParents: [...evidenceEventRefs],
    payload: {
      edge: {
        fromId,
        toId,
        ...structuredClone(sanitizeRelationshipChanges(changes)),
        evidenceEventRefs: [...evidenceEventRefs]
      }
    }
  };
}
