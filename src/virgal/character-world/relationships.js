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
        ...structuredClone(changes),
        evidenceEventRefs: [...evidenceEventRefs]
      }
    }
  };
}
