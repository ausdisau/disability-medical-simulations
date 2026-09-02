import test from "node:test";
import assert from "node:assert/strict";
import {
  createWorldEngine,
  commitEvent,
  setFocus,
  scheduleEvent,
  tickWorld,
  createBranch,
  forkBranch,
  replayBranch,
  chooseNpcAction,
  createEmergencyAuthorityLease,
  reassessEmergencyAuthorityLease,
  evaluateDidacticSignal
} from "../src/virgal/world-engine.js";

test("world events are append-only, hash chained and causally traceable", () => {
  let world = createWorldEngine({ scenarioId: "eli-open-world", seed: "seed-a" });
  world = commitEvent(world, {
    type: "PATIENT_BOUNDARY_STATEMENT",
    domain: "AGENCY",
    actorRefs: ["eli"],
    payload: { text: "NOT YOUR BUSINESS WHICH ONES" },
    causalParents: []
  });
  world = commitEvent(world, {
    type: "TEACHER_AFFIRMS_BOUNDARY",
    domain: "RELATIONAL",
    actorRefs: ["ms-hartley"],
    targetRefs: ["eli"],
    payload: { text: "That's the boundary." },
    causalParents: [world.events[0].eventId]
  });

  assert.equal(world.events.length, 2);
  assert.equal(world.events[1].previousEventHash, world.events[0].eventHash);
  assert.match(world.events[1].eventHash, /^[a-f0-9]{64}$/);
  assert.deepEqual(world.causalGraph.parents[world.events[1].eventId], [world.events[0].eventId]);
});

test("camera focus changes rendering only and never advances world time", () => {
  const world = createWorldEngine({ scenarioId: "eli-open-world", seed: "seed-a" });
  const focused = setFocus(world, "MORGAN_HOME");
  assert.equal(focused.worldTime, 0);
  assert.equal(focused.focusRef, "MORGAN_HOME");
});

test("scheduler commits due events in deterministic priority order", () => {
  let world = createWorldEngine({ scenarioId: "eli-open-world", seed: "seed-a" });
  world = scheduleEvent(world, {
    taskId: "social-1",
    dueTime: 1,
    priority: "ORDINARY",
    event: { type: "FRIEND_MESSAGE", domain: "SOCIAL", actorRefs: ["leo"], payload: {} }
  });
  world = scheduleEvent(world, {
    taskId: "clinical-1",
    dueTime: 1,
    priority: "CLINICAL_CRITICAL",
    event: { type: "CLINICAL_ALERT", domain: "CLINICAL", actorRefs: ["nurse"], payload: {} }
  });

  world = tickWorld(world, { seconds: 1 });
  assert.equal(world.worldTime, 1);
  assert.deepEqual(world.events.map((event) => event.type), ["CLINICAL_ALERT", "FRIEND_MESSAGE"]);
});

test("NPC stochastic action selection is reproducible for the same seed and state", () => {
  const candidates = [
    { id: "wait", utility: 0.7, eligible: true },
    { id: "redirect", utility: 0.5, eligible: true },
    { id: "answer-for-eli", utility: 1.0, eligible: false }
  ];
  const first = chooseNpcAction({ seed: "world-1", characterId: "ms-hartley", decisionSequence: 4, candidates });
  const second = chooseNpcAction({ seed: "world-1", characterId: "ms-hartley", decisionSequence: 4, candidates });
  assert.equal(first.selectedActionId, second.selectedActionId);
  assert.ok(first.eligibleActionIds.includes(first.selectedActionId));
  assert.ok(!first.eligibleActionIds.includes("answer-for-eli"));
});

test("emergency authority lease is clinical-only and auto-expires when the emergency subsides", () => {
  const lease = createEmergencyAuthorityLease({
    leaseId: "lease-1",
    holderRoleRefs: ["treating-medical", "treating-nursing"],
    emergencyActive: true
  });
  assert.equal(lease.state, "ACTIVE");
  assert.ok(lease.permittedDomains.includes("EMERGENCY_CLINICAL"));
  assert.ok(!lease.permittedDomains.includes("PRIVACY"));

  const restored = reassessEmergencyAuthorityLease(lease, { emergencyActive: false, supportedParticipationFeasible: true });
  assert.equal(restored.state, "EXPIRED");
  assert.equal(restored.returnAuthorityToPatient, true);
});

test("didactic observer can surface a cue without mutating world state", () => {
  const world = createWorldEngine({ scenarioId: "eli-open-world", seed: "seed-a" });
  const before = JSON.stringify(world);
  const result = evaluateDidacticSignal({
    alignment: 0.9,
    significance: 0.9,
    recoverability: 0.8,
    novelty: 0.7,
    learnerUncertainty: 0.7,
    repetitionPenalty: 0,
    intrusionCost: 0.1
  });
  assert.equal(JSON.stringify(world), before);
  assert.equal(result.level, 2);
});

test("forked branches preserve parent history and replay to the same head hash", () => {
  let world = createWorldEngine({ scenarioId: "eli-open-world", seed: "seed-a" });
  world = commitEvent(world, { type: "VISIT_START", domain: "SOCIAL", actorRefs: ["eli", "leo"], payload: {} });
  const parent = createBranch(world, { branchId: "canonical" });
  const child = forkBranch(parent, { branchId: "counterfactual", seed: "seed-b" });
  assert.equal(child.parentBranchId, "canonical");
  assert.equal(child.events.length, parent.events.length);
  assert.equal(child.events[0].eventHash, parent.events[0].eventHash);

  const replayed = replayBranch(parent);
  assert.equal(replayed.headEventHash, parent.headEventHash);
});

test("replay detects tampered event content even when stored chain pointers are unchanged", () => {
  let world = createWorldEngine({ scenarioId: "eli-open-world", seed: "seed-a" });
  world = commitEvent(world, { type: "VISIT_START", domain: "SOCIAL", actorRefs: ["eli", "leo"], payload: { private: true } });
  const branch = createBranch(world, { branchId: "canonical" });
  branch.events[0].payload.private = false;
  const replayed = replayBranch(branch);
  assert.equal(replayed.valid, false);
  assert.equal(replayed.divergenceAt, branch.events[0].eventId);
});
