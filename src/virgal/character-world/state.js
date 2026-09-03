function clone(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

export function createCharacterWorld({ patientPrincipalId = null, characters = [], locations = [], objects = [] } = {}) {
  return {
    version: "0.4.0",
    patientPrincipalId,
    characters: Object.fromEntries(characters.map((character) => [character.id, clone(character)])),
    claims: Object.fromEntries(characters.map((character) => [character.id, {}])),
    memories: Object.fromEntries(characters.map((character) => [character.id, []])),
    relationships: {},
    nodes: Object.fromEntries(locations.map((node) => [node.id, clone(node)])),
    objects: Object.fromEntries(objects.map((object) => [object.id, clone(object)])),
    positions: {},
    eventRefs: []
  };
}

export function getCharacterClaim(characterWorld, characterId, claimId) {
  return characterWorld?.claims?.[characterId]?.[claimId] ?? null;
}

export function cloneCharacterWorld(characterWorld) {
  return clone(characterWorld);
}
