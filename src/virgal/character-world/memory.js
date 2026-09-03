export function buildMemoryRecordProposal({ ownerCharacterId, memoryId, kind, representation, sourceEventRefs = [], protected: isProtected = false }) {
  return {
    type: "MEMORY_RECORDED",
    domain: "RELATIONAL",
    actorRefs: [ownerCharacterId],
    payload: {
      memory: {
        id: memoryId,
        ownerCharacterId,
        kind,
        representation,
        sourceEventRefs: [...sourceEventRefs],
        decayPolicy: isProtected ? "NONE" : "ORDINARY",
        consolidation: isProtected ? "LONG_TERM" : "TRANSIENT"
      }
    }
  };
}

export function buildMemoryConsolidationProposal(characterWorld, characterId, memoryId) {
  const memory = (characterWorld?.memories?.[characterId] ?? []).find((item) => item.id === memoryId);
  if (!memory) return null;
  return {
    type: "MEMORY_CONSOLIDATED",
    domain: "RELATIONAL",
    actorRefs: [characterId],
    payload: { memory: { ...structuredClone(memory), consolidation: "LONG_TERM" } }
  };
}

export function recallMemories(characterWorld, characterId, { text = "" } = {}) {
  const query = String(text).trim().toLowerCase();
  const memories = [...(characterWorld?.memories?.[characterId] ?? [])];
  if (!query) return memories;
  return memories.filter((memory) => String(memory.representation ?? "").toLowerCase().includes(query));
}
