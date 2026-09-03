import { cloneCharacterWorld } from "./state.js";

function ensureCharacterState(next, characterId) {
  if (!next.claims[characterId]) next.claims[characterId] = {};
  if (!next.memories[characterId]) next.memories[characterId] = [];
}

function mayWriteClaim(next, recipientId, claim, actorId) {
  const existing = next.claims?.[recipientId]?.[claim.id];
  if (!existing?.protected) return true;
  if (recipientId !== next.patientPrincipalId) return true;
  return actorId === next.patientPrincipalId;
}

export function applyCommittedCharacterEvent(characterWorld, event) {
  const next = cloneCharacterWorld(characterWorld);
  if (event?.eventId) next.eventRefs.push(event.eventId);
  const actorId = event?.actorRefs?.[0] ?? null;

  switch (event?.type) {
    case "CHARACTER_REGISTERED": {
      const character = event.payload?.character;
      if (!character?.id) return next;
      next.characters[character.id] = structuredClone(character);
      ensureCharacterState(next, character.id);
      return next;
    }
    case "CLAIM_ASSERTED": {
      const claim = event.payload?.claim;
      const recipients = event.payload?.recipients ?? [];
      if (!claim?.id) return next;
      for (const recipientId of recipients) {
        ensureCharacterState(next, recipientId);
        if (mayWriteClaim(next, recipientId, claim, actorId)) {
          next.claims[recipientId][claim.id] = structuredClone(claim);
        }
      }
      return next;
    }
    case "INFORMATION_DELIVERED": {
      const claims = event.payload?.claims ?? [];
      const recipients = event.payload?.recipients ?? [];
      for (const recipientId of recipients) {
        ensureCharacterState(next, recipientId);
        for (const claim of claims) {
          if (claim?.id && mayWriteClaim(next, recipientId, claim, actorId)) {
            next.claims[recipientId][claim.id] = structuredClone(claim);
          }
        }
      }
      return next;
    }
    case "MEMORY_RECORDED":
    case "MEMORY_CONSOLIDATED": {
      const memory = event.payload?.memory;
      if (!memory?.id || !memory?.ownerCharacterId) return next;
      ensureCharacterState(next, memory.ownerCharacterId);
      const current = next.memories[memory.ownerCharacterId];
      const index = current.findIndex((item) => item.id === memory.id);
      if (index >= 0) current[index] = structuredClone(memory);
      else current.push(structuredClone(memory));
      return next;
    }
    case "RELATIONSHIP_CHANGED": {
      const edge = event.payload?.edge;
      if (!edge?.fromId || !edge?.toId) return next;
      const key = `${edge.fromId}->${edge.toId}`;
      next.relationships[key] = { ...(next.relationships[key] ?? {}), ...structuredClone(edge) };
      return next;
    }
    case "WORLD_NODE_REGISTERED": {
      const node = event.payload?.node;
      if (node?.id) next.nodes[node.id] = structuredClone(node);
      return next;
    }
    case "WORLD_OBJECT_REGISTERED": {
      const object = event.payload?.object;
      if (object?.id) next.objects[object.id] = structuredClone(object);
      return next;
    }
    case "CHARACTER_MOVED": {
      const characterId = event.payload?.characterId;
      const nodeId = event.payload?.nodeId;
      if (characterId && nodeId) next.positions[characterId] = nodeId;
      return next;
    }
    case "OBJECT_STATE_CHANGED": {
      const objectId = event.payload?.objectId;
      if (!objectId || !next.objects[objectId]) return next;
      next.objects[objectId] = { ...next.objects[objectId], ...(event.payload?.changes ?? {}) };
      return next;
    }
    default:
      return next;
  }
}
