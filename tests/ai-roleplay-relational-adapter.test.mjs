import test from "node:test";
import assert from "node:assert/strict";

import { createRelationalSubstrate, summarizeRelationalState } from "../src/features/biosocial-relational-substrate.js";
import {
  buildAIRoleplayContinuePayload,
  buildAIRoleplayStartPayload,
  buildRoleplayGenerationEnvelope
} from "../src/features/ai-roleplay-relational-adapter.js";

function fixture() {
  return createRelationalSubstrate({
    patientId: "maya",
    actors: [
      { id: "maya", label: "Maya", role: "patient", kind: "patient", directCommunicationSkill: 1, roleClarity: 1 },
      {
        id: "mother",
        label: "Maya's mother",
        role: "trusted family supporter",
        kind: "family",
        stress: 0.74,
        informationNeed: 0.85,
        controlImpulse: 0.58,
        roleClarity: 0.72
      }
    ],
    relationships: [
      {
        from: "mother",
        to: "maya",
        trust: 0.75,
        conflict: 0.12,
        autonomyAlignment: 0.82,
        communicationReliability: 0.9,
        boundaryRespect: 0.9,
        supportAvailability: 0.9
      }
    ]
  });
}

test("start payload conforms to roleplay simulator shape and is read-only", () => {
  const state = fixture();
  const before = summarizeRelationalState(state);
  const result = buildAIRoleplayStartPayload(state, {
    userActorId: "maya",
    otherActorId: "mother",
    topic: "Talking after a frightening ICU event",
    userInitialMessage: "I need you to listen before you answer."
  });
  const after = summarizeRelationalState(state);

  assert.deepEqual(after, before);
  assert.equal(result.payload.user.name, "Maya");
  assert.equal(result.payload.otherPerson.name, "Maya's mother");
  assert.equal(result.payload.otherPerson.role, "trusted family supporter");
  assert.equal(result.payload.conversation.topic, "Talking after a frightening ICU event");
  assert.equal(result.payload.userInitialMessage, "I need you to listen before you answer.");
  assert.equal(result.deterministicStateMutationAllowed, false);
  assert.match(result.payload.otherPerson.personality, /not.*psychological diagnosis/i);
  assert.match(result.payload.otherPerson.personality, /does not create substitute decision-making authority/i);
});

test("continue payload accepts the roleplay simulator 2-4 response contract", () => {
  const payload = buildAIRoleplayContinuePayload({
    otherPersonMessage: "I am scared too, but I will listen.",
    possibleUserResponses: [
      "Stay with me, but let me answer for myself.",
      "I need a few minutes alone."
    ]
  });
  assert.equal(payload.otherPersonMessage, "I am scared too, but I will listen.");
  assert.equal(payload.possibleUserResponses.length, 2);
});

test("continue payload rejects response counts outside connector contract", () => {
  assert.throws(() => buildAIRoleplayContinuePayload({
    otherPersonMessage: "Hello",
    possibleUserResponses: ["Only one"]
  }), /between 2 and 4/i);
});

test("generation envelope prohibits authority and capacity inference from family dialogue", () => {
  const envelope = buildRoleplayGenerationEnvelope(fixture(), {
    speakingActorId: "mother",
    listeningActorId: "maya"
  });
  assert.match(envelope.stateMutationRule, /explicit RELATIONAL_EVENT_TYPES event/i);
  assert.ok(envelope.forbiddenInference.some((item) => /incapacity/i.test(item)));
  assert.ok(envelope.forbiddenInference.some((item) => /substitute authority/i.test(item)));
  assert.equal(envelope.provenance.adapter, "AI_Roleplay_Chat_Simulator");
});
