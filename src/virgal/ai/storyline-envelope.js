function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

export function createStorylineEnvelope(world, { tailLength = 32 } = {}) {
  if (!world?.scenarioId || !world?.branchId) throw new Error("invalid_world");
  const events = Array.isArray(world.events) ? world.events : [];
  return Object.freeze({
    schemaVersion: "1.0.0",
    scenarioId: world.scenarioId,
    branchId: world.branchId,
    worldVersion: world.version,
    worldTime: world.worldTime,
    headEventHash: world.headEventHash,
    focusRef: world.focusRef,
    authority: clone(world.authority ?? {}),
    fidelity: clone(world.fidelity ?? {}),
    characterWorld: clone(world.characterWorld ?? {}),
    committedEventTail: clone(events.slice(-Math.max(0, tailLength)))
  });
}
