import test from "node:test";
import assert from "node:assert/strict";

import { createRelationalSubstrate } from "../src/features/biosocial-relational-substrate.js";
import {
  buildDynamicNPCResponse,
  classifyStudentAction,
  NPC_RESPONSE_INTENTS
} from "../src/features/dynamic-npc-response-engine.js";

function fixture({ lowControl = false } = {}) {
  return createRelationalSubstrate({
    patientId: "maya",
    actors: [
      {
        id: "maya",
        label: "Maya",
        role: "patient",
        kind: "patient",
        stress: 0.55,
        copingReserve: 0.5,
        directCommunicationSkill: 1,
        roleClarity: 1,
        supportCapacity: 0.4
      },
      {
        id: "mother",
        label: "Maya's mother",
        role: "trusted family supporter",
        kind: "family",
        stress: lowControl ? 0.25 : 0.82,
        copingReserve: 0.45,
        informationNeed: lowControl ? 0.45 : 0.9,
        controlImpulse: lowControl ? 0.12 : 0.88,
        roleClarity: lowControl ? 0.9 : 0.62,
        supportCapacity: 0.85
      }
    ],
    relationships: [
      {
        from: "mother",
        to: "maya",
        trust: lowControl ? 0.86 : 0.51,
        conflict: lowControl ? 0.08 : 0.56,
        autonomyAlignment: lowControl ? 0.96 : 0.73,
        communicationReliability: 0.8,
        boundaryRespect: lowControl ? 0.96 : 0.58,
        supportAvailability: 0.8
      }
    ],
    access: {
      communicationAccessReliability: 0.96,
      directPatientVoiceAvailable: true,
      privacyReliability: 0.9
    }
  });
}

test("classifies a patient privacy request without mutating state", () => {
  const signals = classifyStudentAction("Maya asked for five minutes alone with the doctor.");
  assert.equal(signals.privacyBoundaryRequested, true);
  assert.equal(signals.patientVoiceCentered, true);
});

test("high stress/control can render boundary resistance while keeping it descriptive", () => {
  const state = fixture();
  const before = JSON.stringify(state);
  const turn = buildDynamicNPCResponse(state, {
    npcActorId: "mother",
    targetActorId: "maya",
    studentAction: "Maya asked for five minutes alone with the doctor.",
    turnIndex: 1,
    envelope: {
      trust: 0.507,
      autonomySupport: 0.734,
      conflictLoad: 0.564,
      informationClarity: 0.456,
      supporterBurden: 0.652,
      crisisStress: 0.794
    }
  });

  assert.ok(NPC_RESPONSE_INTENTS.includes(turn.selectedIntent));
  assert.ok(["BOUNDARY_RESISTANCE", "ANXIOUS_INFORMATION_SEEKING"].includes(turn.selectedIntent));
  assert.equal(turn.npc.delivery, "spoken");
  assert.equal(turn.rightsConstraints.dialogueMutatesState, false);
  assert.equal(turn.rightsConstraints.familyPresenceCreatesAuthority, false);
  assert.equal(JSON.stringify(state), before);
});

test("high autonomy alignment and low control can render boundary-respecting dialogue", () => {
  const state = fixture({ lowControl: true });
  const turn = buildDynamicNPCResponse(state, {
    npcActorId: "mother",
    targetActorId: "maya",
    studentAction: "Maya wants five minutes alone. I hear that this is difficult for you.",
    turnIndex: 2
  });

  assert.ok(["TENTATIVE_BOUNDARY_RESPECT", "SUPPORTIVE_PRESENCE", "REPAIR_ATTEMPT"].includes(turn.selectedIntent));
  assert.match(turn.message, /(Maya|privacy|wait|nearby|listen|lead|helpful)/i);
});

test("patient NPC responses are marked for AAC delivery", () => {
  const state = fixture();
  const turn = buildDynamicNPCResponse(state, {
    npcActorId: "maya",
    targetActorId: "mother",
    studentAction: "What do you want?",
    turnIndex: 3
  });
  assert.equal(turn.npc.delivery, "aac");
  assert.match(turn.roleplayPayload.otherPersonMessage, /^AAC:/);
});

test("continue-conversation contract always provides two to four student responses", () => {
  const state = fixture();
  const turn = buildDynamicNPCResponse(state, {
    npcActorId: "mother",
    studentAction: "Can you tell me what you are worried about?",
    turnIndex: 4
  });
  assert.ok(turn.roleplayPayload.possibleUserResponses.length >= 2);
  assert.ok(turn.roleplayPayload.possibleUserResponses.length <= 4);
});

test("moderator event hints never pretend to commit a relational transition", () => {
  const state = fixture();
  const turn = buildDynamicNPCResponse(state, {
    npcActorId: "mother",
    studentAction: "Please step outside for five minutes.",
    turnIndex: 5
  });
  assert.ok(turn.moderatorEventHints.some((item) => /moderator/i.test(item)));
  assert.equal("eventCommitted" in turn, false);
});
