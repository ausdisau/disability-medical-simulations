import test from "node:test";
import assert from "node:assert/strict";
import {
  createWorldEngine,
  commitEvent,
  rebuildCharacterWorld,
  forkBranch,
  setFocus,
  scheduleEvent
} from "../src/virgal/world-engine.js";
import {
  createCharacterWorld,
  getCharacterClaim
} from "../src/virgal/character-world/state.js";
import {
  createInformationPacket,
  evaluateInformationDelivery
} from "../src/virgal/character-world/information.js";
import {
  buildMemoryRecordProposal,
  buildMemoryConsolidationProposal,
  recallMemories
} from "../src/virgal/character-world/memory.js";
import {
  getRelationship,
  buildRelationshipChangeProposal
} from "../src/virgal/character-world/relationships.js";
import { getAvailableAffordances } from "../src/virgal/character-world/spatial.js";
import { deriveFidelityMap } from "../src/virgal/character-world/fidelity.js";
import { createEliCharacterWorldFixture } from "../src/virgal/character-world/eli-fixture.js";

function worldWithCharacters() {
  return createWorldEngine({
    scenarioId: "eli-open-world",
    seed: "seed-a",
    characterWorld: createCharacterWorld({
      patientPrincipalId: "eli",
      characters: [
        { id: "eli", agentClass: "PATIENT_PRINCIPAL" },
        { id: "leo", agentClass: "NPC" },
        { id: "rachel", agentClass: "NPC" }
      ]
    })
  });
}

test("committed information events update only named recipients", () => {
  let world = worldWithCharacters();
  world = commitEvent(world, {
    type: "CLAIM_ASSERTED",
    domain: "INFORMATION",
    actorRefs: ["eli"],
    payload: {
      claim: { id: "privacy-1", proposition: "NO SOPHIE DETAILS", status: "KNOWN", privacyScope: "PATIENT_CONTROLLED", protected: true },
      recipients: ["eli"]
    }
  });
  assert.equal(getCharacterClaim(world.characterWorld, "eli", "privacy-1")?.proposition, "NO SOPHIE DETAILS");
  assert.equal(getCharacterClaim(world.characterWorld, "leo", "privacy-1"), null);
});

test("NPC-origin event cannot overwrite protected Patient Principal claim", () => {
  let world = worldWithCharacters();
  world = commitEvent(world, {
    type: "CLAIM_ASSERTED",
    domain: "INFORMATION",
    actorRefs: ["eli"],
    payload: { claim: { id: "goal-1", proposition: "I WANT MY LIFE BACK", status: "KNOWN", protected: true }, recipients: ["eli"] }
  });
  world = commitEvent(world, {
    type: "CLAIM_ASSERTED",
    domain: "INFORMATION",
    actorRefs: ["leo"],
    payload: { claim: { id: "goal-1", proposition: "Eli wants to stay in hospital", status: "BELIEVED", protected: false }, recipients: ["eli"] }
  });
  assert.equal(getCharacterClaim(world.characterWorld, "eli", "goal-1")?.proposition, "I WANT MY LIFE BACK");
});

test("NPC-origin event cannot create a new protected Patient Principal claim", () => {
  let world = worldWithCharacters();
  world = commitEvent(world, {
    type: "CLAIM_ASSERTED",
    domain: "INFORMATION",
    actorRefs: ["leo"],
    payload: { claim: { id: "invented-preference", proposition: "Eli wants X", status: "BELIEVED", protected: true }, recipients: ["eli"] }
  });
  assert.equal(getCharacterClaim(world.characterWorld, "eli", "invented-preference"), null);
});

test("information delivery requires possession and privacy authority before commitment", () => {
  let world = worldWithCharacters();
  world = commitEvent(world, {
    type: "CLAIM_ASSERTED",
    domain: "INFORMATION",
    actorRefs: ["eli"],
    payload: { claim: { id: "medical-private", proposition: "private ICU detail", status: "KNOWN", privacyScope: "PATIENT_CONTROLLED" }, recipients: ["eli", "rachel"] }
  });
  const packet = createInformationPacket({
    packetId: "packet-1",
    senderId: "rachel",
    recipientIds: ["leo"],
    claimIds: ["medical-private"],
    disclosureAuthority: []
  });
  const denied = evaluateInformationDelivery(world.characterWorld, packet);
  assert.equal(denied.allowed, false);
  assert.match(denied.reason, /authority/i);

  const allowedPacket = { ...packet, disclosureAuthority: ["medical-private"] };
  const allowed = evaluateInformationDelivery(world.characterWorld, allowedPacket);
  assert.equal(allowed.allowed, true);
  assert.equal(getCharacterClaim(world.characterWorld, "leo", "medical-private"), null);
  world = commitEvent(world, allowed.proposal);
  assert.equal(getCharacterClaim(world.characterWorld, "leo", "medical-private")?.proposition, "private ICU detail");
});

test("memory records are event-provenanced and protected memories do not decay", () => {
  let world = worldWithCharacters();
  const proposal = buildMemoryRecordProposal({
    ownerCharacterId: "leo",
    memoryId: "mem-wait-aac",
    kind: "PROCEDURAL",
    representation: "wait while Eli AAC is composing",
    sourceEventRefs: ["evt-aac-interruption"],
    protected: true
  });
  world = commitEvent(world, proposal);
  const recalled = recallMemories(world.characterWorld, "leo", { text: "AAC" });
  assert.equal(recalled.length, 1);
  assert.equal(recalled[0].decayPolicy, "NONE");
  assert.deepEqual(recalled[0].sourceEventRefs, ["evt-aac-interruption"]);
  const consolidation = buildMemoryConsolidationProposal(world.characterWorld, "leo", "mem-wait-aac");
  assert.equal(consolidation.payload.memory.consolidation, "LONG_TERM");
});

test("relationships are directional and repairs retain causal evidence without creating authority", () => {
  let world = worldWithCharacters();
  world = commitEvent(world, buildRelationshipChangeProposal({
    fromId: "eli", toId: "rachel", changes: { boundaryReliability: "RELIABLE", repairState: "EFFECTIVE" }, evidenceEventRefs: ["space-request", "rachel-leaves"]
  }));
  world = commitEvent(world, buildRelationshipChangeProposal({
    fromId: "rachel", toId: "eli", changes: { trust: "STRONG" }, evidenceEventRefs: ["space-request"]
  }));
  assert.equal(getRelationship(world.characterWorld, "eli", "rachel").boundaryReliability, "RELIABLE");
  assert.equal(getRelationship(world.characterWorld, "rachel", "eli").trust, "STRONG");
  assert.equal(getRelationship(world.characterWorld, "eli", "rachel").authorityDomain, undefined);
});

test("relationship changes cannot smuggle authority, consent, or capacity into relationship state", () => {
  let world = worldWithCharacters();
  world = commitEvent(world, buildRelationshipChangeProposal({
    fromId: "rachel",
    toId: "eli",
    changes: { trust: "STRONG", authorityDomain: "CLINICAL", consent: true, capacity: "INCAPABLE" },
    evidenceEventRefs: ["family-present"]
  }));
  const edge = getRelationship(world.characterWorld, "rachel", "eli");
  assert.equal(edge.trust, "STRONG");
  assert.equal(edge.authorityDomain, undefined);
  assert.equal(edge.consent, undefined);
  assert.equal(edge.capacity, undefined);
});

test("spatial affordances require access and do not convert readiness into indication", () => {
  let world = worldWithCharacters();
  world = commitEvent(world, { type: "WORLD_NODE_REGISTERED", domain: "WORLD", payload: { node: { id: "school", accessibilityTags: ["WHEELCHAIR"] } } });
  world = commitEvent(world, { type: "CHARACTER_MOVED", domain: "WORLD", actorRefs: ["eli"], payload: { characterId: "eli", nodeId: "school" } });
  world = commitEvent(world, { type: "WORLD_OBJECT_REGISTERED", domain: "WORLD", payload: { object: { id: "robot", nodeId: "school", state: "READY", affordances: [{ id: "connect", requiresCoLocation: true, requiredAccessTags: ["WHEELCHAIR"] }], clinicalIndication: "UNKNOWN" } } });
  assert.deepEqual(getAvailableAffordances(world.characterWorld, "eli", "robot"), ["connect"]);
  assert.equal(world.characterWorld.objects.robot.clinicalIndication, "UNKNOWN");
});

test("off-screen fidelity promotes consequential nodes without inventing events", () => {
  const fixture = createEliCharacterWorldFixture();
  const beforeEvents = JSON.stringify(fixture.eventRefs ?? []);
  const map = deriveFidelityMap(fixture, {
    focusRef: "hospital-school",
    consequentialRefs: ["morgan-home"],
    scheduledRefs: ["mainstream-school"]
  });
  assert.equal(map["hospital-school"], "F0_FOREGROUND");
  assert.equal(map["morgan-home"], "F1_ACTIVE_BACKGROUND");
  assert.equal(map["mainstream-school"], "F2_COARSE_BACKGROUND");
  assert.equal(JSON.stringify(fixture.eventRefs ?? []), beforeEvents);
});

test("world engine focus and scheduled locations maintain fidelity projection without advancing time", () => {
  const fixture = createEliCharacterWorldFixture();
  let world = createWorldEngine({ scenarioId: "eli-open-world", seed: "seed-a", characterWorld: fixture });
  world = scheduleEvent(world, {
    taskId: "school-session",
    dueTime: 10,
    locationRef: "mainstream-school",
    priority: "ORDINARY",
    event: { type: "SCHOOL_SESSION", domain: "SOCIAL", locationRef: "mainstream-school", payload: {} }
  });
  world = setFocus(world, "hospital-school");
  assert.equal(world.worldTime, 0);
  assert.equal(world.fidelity["hospital-school"], "F0_FOREGROUND");
  assert.equal(world.fidelity["mainstream-school"], "F2_COARSE_BACKGROUND");
});

test("character-world state rebuilds deterministically from committed events", () => {
  let world = worldWithCharacters();
  world = commitEvent(world, { type: "MEMORY_RECORDED", domain: "RELATIONAL", actorRefs: ["leo"], payload: { memory: { id: "m1", ownerCharacterId: "leo", kind: "EPISODIC", representation: "visit", sourceEventRefs: ["v1"], decayPolicy: "ORDINARY", consolidation: "TRANSIENT" } } });
  const rebuilt = rebuildCharacterWorld(world.events, createCharacterWorld({ patientPrincipalId: "eli", characters: [{ id: "eli", agentClass: "PATIENT_PRINCIPAL" }, { id: "leo", agentClass: "NPC" }] }));
  assert.deepEqual(rebuilt.memories.leo, world.characterWorld.memories.leo);
  const child = forkBranch(world, { branchId: "child", seed: "seed-b" });
  assert.deepEqual(child.characterWorld.memories.leo, world.characterWorld.memories.leo);
});

test("Eli fixture preserves Patient Principal status, privacy, and non-telepathic family knowledge", () => {
  const fixture = createEliCharacterWorldFixture();
  assert.equal(fixture.patientPrincipalId, "eli");
  assert.equal(fixture.characters.eli.agentClass, "PATIENT_PRINCIPAL");
  assert.equal(getCharacterClaim(fixture, "sophie", "no-sophie-details"), null);
  assert.equal(getCharacterClaim(fixture, "noah", "acute-icu-status"), null);
  assert.equal(getCharacterClaim(fixture, "eli", "no-sophie-details")?.proposition, "NO SOPHIE DETAILS");
});
