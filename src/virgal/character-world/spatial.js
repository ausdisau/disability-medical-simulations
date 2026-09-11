export function getAvailableAffordances(characterWorld, actorId, objectId) {
  const object = characterWorld?.objects?.[objectId];
  const actor = characterWorld?.characters?.[actorId];
  if (!object || !actor) return [];

  const actorNodeId = characterWorld.positions?.[actorId] ?? null;
  const actorNode = actorNodeId ? characterWorld.nodes?.[actorNodeId] : null;
  const accessTags = new Set([...(actor.accessTags ?? []), ...(actorNode?.accessibilityTags ?? [])]);

  return (object.affordances ?? [])
    .filter((affordance) => !affordance.requiresCoLocation || actorNodeId === object.nodeId)
    .filter((affordance) => (affordance.requiredAccessTags ?? []).every((tag) => accessTags.has(tag)))
    .map((affordance) => affordance.id);
}
