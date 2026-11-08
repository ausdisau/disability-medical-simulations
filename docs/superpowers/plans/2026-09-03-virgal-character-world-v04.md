# VIRGAL Character-World Runtime v0.4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Character-World Runtime on top of VIRGAL v0.3 so autonomous characters can persist knowledge, memory, directional relationships, information flow, spatial affordances, and off-screen fidelity without bypassing the canonical event ledger.

**Architecture:** Keep `src/virgal/world-engine.js` as the only canonical commit path. Add focused reducers/query modules under `src/virgal/character-world/`; committed VIRGAL events update derived character-world state, while queries and proposal builders remain pure. No NPC, memory, relationship, information, spatial, or fidelity helper may write physiology, patient-authored preferences, consent, capacity, or authority.

**Tech Stack:** Node.js >=20, ES modules, Node built-in test runner, browser-compatible JavaScript, existing Neon persistence projection.

**Spec:** `docs/superpowers/specs/2026-09-03-virgal-open-world-architecture.md`

## Global Constraints

- The existing VIRGAL event hash chain remains canonical.
- Character-world state is derived only from committed events.
- Eli/Patient Principal protected facts are read-only to NPC, memory, relationship, didactic, and information-propagation logic.
- NPC knowledge is separate from world truth; no telepathy.
- Information possession does not imply disclosure permission.
- Directional relationships are categorical contextual state, not personhood/friendship scores.
- Off-screen fidelity is a computational policy, not permission to invent events.
- Spatial affordance means possible interaction, not authority or clinical indication.
- Clinical physiology remains outside the Character-World Runtime.
- Existing runtime/UI APIs remain backwards compatible.

---

### Task 1: Character registry and epistemic state

**Files:**
- Create: `src/virgal/character-world/state.js`
- Create: `src/virgal/character-world/reducer.js`
- Create: `tests/character-world.test.mjs`
- Modify: `src/virgal/world-engine.js`

**Interfaces:**
- `createCharacterWorld({ patientPrincipalId?, characters?, locations?, objects? }) -> CharacterWorldState`
- `applyCommittedCharacterEvent(characterWorld, event) -> CharacterWorldState`
- `getCharacterClaim(characterWorld, characterId, claimId) -> claim|null`
- `createWorldEngine()` gains `characterWorld` and `commitEvent()` applies the committed event to it.

- [ ] Write tests proving characters can be registered by committed events, knowledge transfers only update named recipients, and protected Patient Principal fields cannot be overwritten by NPC-origin events.
- [ ] Run CI and verify the tests fail because the Character-World module is missing.
- [ ] Implement the minimal reducer and world-engine integration.
- [ ] Run CI and require green before Task 2.

### Task 2: Information propagation and privacy

**Files:**
- Create: `src/virgal/character-world/information.js`
- Modify: `tests/character-world.test.mjs`

**Interfaces:**
- `createInformationPacket(input) -> packet`
- `evaluateInformationDelivery(characterWorld, packet) -> { allowed, reason, proposal? }`

- [ ] Write tests proving sender possession is required, `PATIENT_CONTROLLED` claims cannot be redistributed without explicit authorisation, and recipients learn only after the returned event proposal is committed.
- [ ] Verify red in CI.
- [ ] Implement delivery evaluation as a pure proposal builder.
- [ ] Verify green.

### Task 3: Memory recording and consolidation

**Files:**
- Create: `src/virgal/character-world/memory.js`
- Modify: `src/virgal/character-world/reducer.js`
- Modify: `tests/character-world.test.mjs`

**Interfaces:**
- `buildMemoryRecordProposal(input) -> WorldEventProposal`
- `buildMemoryConsolidationProposal(characterWorld, characterId, memoryId) -> proposal|null`
- `recallMemories(characterWorld, characterId, query) -> MemoryRecord[]`

- [ ] Write tests for episodic/procedural memory, consolidation, protected-memory no-decay semantics, and evidence-event provenance.
- [ ] Verify red.
- [ ] Implement minimal memory reducers/query functions.
- [ ] Verify green.

### Task 4: Directional relationships and repair

**Files:**
- Create: `src/virgal/character-world/relationships.js`
- Modify: `src/virgal/character-world/reducer.js`
- Modify: `tests/character-world.test.mjs`

**Interfaces:**
- `getRelationship(characterWorld, fromId, toId) -> RelationshipEdge|null`
- `buildRelationshipChangeProposal(input) -> proposal`

- [ ] Write tests proving `Eli -> Rachel` and `Rachel -> Eli` are separate edges, repair records causal evidence, and relationship state cannot create authority.
- [ ] Verify red.
- [ ] Implement categorical directional edges with evidence-event references.
- [ ] Verify green.

### Task 5: Spatial nodes, objects, and affordances

**Files:**
- Create: `src/virgal/character-world/spatial.js`
- Modify: `src/virgal/character-world/reducer.js`
- Modify: `tests/character-world.test.mjs`

**Interfaces:**
- `getAvailableAffordances(characterWorld, actorId, objectId) -> string[]`
- committed event types: `WORLD_NODE_REGISTERED`, `WORLD_OBJECT_REGISTERED`, `CHARACTER_MOVED`, `OBJECT_STATE_CHANGED`.

- [ ] Write tests proving co-location/access requirements control affordance availability, telepresence can bridge remote spaces without granting clinical/privacy authority, and device readiness does not become indication.
- [ ] Verify red.
- [ ] Implement minimal spatial/object reducers and pure affordance queries.
- [ ] Verify green.

### Task 6: Off-screen fidelity promotion/demotion

**Files:**
- Create: `src/virgal/character-world/fidelity.js`
- Modify: `tests/character-world.test.mjs`

**Interfaces:**
- `deriveFidelityMap(characterWorld, { focusRef, consequentialRefs?, scheduledRefs? }) -> Record<string, FidelityLevel>`
- Fidelity levels: `F0_FOREGROUND`, `F1_ACTIVE_BACKGROUND`, `F2_COARSE_BACKGROUND`, `F3_DORMANT`.

- [ ] Write tests proving focus promotes only rendering/computation, consequential off-screen nodes promote to F1, scheduled ordinary nodes remain at least F2, and dormant nodes do not invent events.
- [ ] Verify red.
- [ ] Implement pure deterministic fidelity derivation.
- [ ] Verify green.

### Task 7: Persist character-world projection and replay derivation

**Files:**
- Modify: `src/persistence.js`
- Modify: `src/virgal/world-engine.js`
- Modify: `tests/character-world.test.mjs`

**Interfaces:**
- VIRGAL snapshot gains `characterWorld`.
- `rebuildCharacterWorld(events, initialState?) -> CharacterWorldState`.

- [ ] Write tests proving derived Character-World state can be rebuilt from committed events and forked histories preserve pre-fork character state.
- [ ] Verify red.
- [ ] Implement rebuild helper and persistence projection.
- [ ] Verify green.

### Task 8: Eli open-world integration fixture and invariants

**Files:**
- Create: `src/virgal/character-world/eli-fixture.js`
- Modify: `tests/character-world.test.mjs`

**Interfaces:**
- `createEliCharacterWorldFixture() -> CharacterWorldState` with Eli, Rachel, Daniel, Noah, Sophie, Leo, Zara, Ms Hartley, hospital school, Morgan home, mainstream school, AAC, telepresence robot, and representative privacy/relationship state.

- [ ] Test that Noah/Sophie do not acquire ICU events without a propagation event, `NO SOPHIE DETAILS` blocks unauthorised detail delivery, Leo can learn AAC wait behaviour through procedural memory, and Eli remains Patient Principal.
- [ ] Verify red.
- [ ] Implement the synthetic fixture using existing generic runtime primitives.
- [ ] Verify green.

### Task 9: Final verification and review

**Files:** none beyond prior tasks.

- [ ] Run the complete Node test workflow under Node 20.
- [ ] Confirm existing v0.3 tests remain green unchanged except where new state is intentionally asserted.
- [ ] Confirm event-content tamper detection still passes.
- [ ] Confirm no Character-World helper writes clinical physiology, consent, capacity, treatment ceiling, or patient-authored speech.
- [ ] Compare branch against `main` and review the full diff.
- [ ] Open/refresh PR, require GitHub Runtime tests and Vercel success, address review findings, then merge.
