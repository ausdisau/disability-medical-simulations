import { commitEvent } from "./world-engine.js";

export function validateCanonicalProposal({ world, proposal, route }) {
  const errors = [];
  if (!proposal?.idempotencyKey) errors.push("EVENT-IDEMPOTENCY-REQUIRED");
  if (proposal?.expectedWorldVersion !== world?.revision) errors.push("EVENT-WORLD-VERSION-MISMATCH");
  if (!route?.owner) errors.push("EVENT-AUTHORITY-OWNER-REQUIRED");
  if (route?.canCommit !== true) errors.push("EVENT-AUTHORITY-DENIED");
  if (!Array.isArray(proposal?.causalParents)) errors.push("EVENT-CAUSAL-PARENTS-REQUIRED");
  if (!proposal?.initialCondition && proposal?.causalParents?.length === 0) errors.push("EVENT-CAUSAL-PARENT-REQUIRED");
  if (!Array.isArray(proposal?.committedEffects)) errors.push("EVENT-COMMITTED-EFFECTS-REQUIRED");
  if (!proposal?.provenance || typeof proposal.provenance !== "object") errors.push("EVENT-PROVENANCE-REQUIRED");
  if (world?.idempotencyKeys?.[proposal?.idempotencyKey]) errors.push("EVENT-IDEMPOTENCY-DUPLICATE");
  return { valid: errors.length === 0, errors };
}

export function commitGuardedEvent(world, proposal, { route, guardianDecision }) {
  const validation = validateCanonicalProposal({ world, proposal, route });
  if (!validation.valid) return { world, event: null, committed: false, errors: validation.errors };

  const nextWorld = commitEvent(world, {
    ...proposal,
    domain: route.domain,
    authorityRef: route.owner,
    guardianRefs: route.reasonCodes ?? [],
    payload: {
      ...(proposal.payload ?? {}),
      canonical: {
        scenarioVersion: world.scenarioVersion,
        sequenceNumber: world.events.length + 1,
        simulatedTime: world.worldTime,
        authorityOwner: route.owner,
        guardianDecision,
        committedEffects: proposal.committedEffects,
        provenance: proposal.provenance,
        idempotencyKey: proposal.idempotencyKey,
        expectedWorldVersion: proposal.expectedWorldVersion
      }
    }
  });

  const event = nextWorld.events.at(-1);
  return {
    world: {
      ...nextWorld,
      revision: world.revision + 1,
      idempotencyKeys: { ...world.idempotencyKeys, [proposal.idempotencyKey]: event.eventId }
    },
    event: {
      ...event,
      scenarioVersion: world.scenarioVersion,
      sequenceNumber: event.commitIndex,
      simulatedTime: event.worldTime,
      authorityOwner: route.owner,
      guardianDecision,
      committedEffects: proposal.committedEffects,
      provenance: proposal.provenance,
      idempotencyKey: proposal.idempotencyKey,
      expectedWorldVersion: proposal.expectedWorldVersion
    },
    committed: true,
    errors: []
  };
}
