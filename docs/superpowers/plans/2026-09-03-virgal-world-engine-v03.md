# VIRGAL World Engine v0.3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the approved VIRGAL open-world architecture into the existing Project Hope simulator as a backwards-compatible v0.3 vertical slice.

**Architecture:** Keep `src/runtime.js` as the compatibility-facing scenario runtime and add `src/virgal/world-engine.js` underneath it as the canonical world-event, scheduling, stochastic-choice, emergency-authority, didactic and branch/replay layer. Existing UI and persistence continue to consume the legacy runtime shape while new world state is carried alongside it.

**Tech Stack:** Node.js >=20, ES modules, Node built-in test runner, browser-compatible JavaScript, Neon persistence API retained unchanged in the first slice.

**Spec:** `docs/superpowers/specs/2026-09-03-virgal-open-world-architecture.md`

## Global Constraints

- Fictional/synthetic educational simulation only.
- Eli/Patient Principal protected facts cannot be authored by NPC/didactic logic.
- Clinical physiology remains owned by a deterministic clinical controller; v0.3 does not invent one.
- AAC composition advances clinical/world time but pauses evaluation time.
- Camera focus never changes world time.
- Stochasticity occurs only after hard eligibility filtering.
- Emergency authority is clinical-only, narrow and auto-expiring.
- Existing runtime API and UI must remain backwards compatible.

---

### Task 1: Add VIRGAL world-engine behavioural tests

**Files:**
- Create: `tests/virgal-world.test.mjs`
- Modify: `tests/runtime.test.mjs`

**Interfaces:**
- Consumes existing `src/runtime.js` public API.
- Specifies new exports from `src/virgal/world-engine.js`: `createWorldEngine`, `commitEvent`, `setFocus`, `scheduleEvent`, `tickWorld`, `chooseNpcAction`, `createEmergencyAuthorityLease`, `reassessEmergencyAuthorityLease`, `evaluateDidacticSignal`, `createBranch`, `forkBranch`, `replayBranch`.

- [ ] Write failing tests for hash-chained events, causal parents, focus/time separation, scheduler ordering, seeded NPC selection, emergency lease expiry, didactic non-mutation and branch replay.
- [ ] Change AAC runtime tests to require clinical/world time to continue while evaluation time pauses.
- [ ] Run `npm test` and verify failures are caused by missing VIRGAL code and old AAC semantics.
- [ ] Commit the test-only red state if desired for review traceability.

### Task 2: Implement world-event, scheduler and causal foundation

**Files:**
- Create: `src/virgal/world-engine.js`

**Interfaces:**
- `createWorldEngine({ scenarioId, seed, branchId? }) -> WorldState`
- `commitEvent(world, proposal) -> WorldState`
- `setFocus(world, focusRef) -> WorldState`
- `scheduleEvent(world, task) -> WorldState`
- `tickWorld(world, { seconds? }) -> WorldState`

- [ ] Implement stable canonical serialization and browser-compatible SHA-256 event hashing.
- [ ] Implement append-only committed events with `eventId`, `commitIndex`, `worldTime`, `domain`, actors/targets, causal parents, branch ID, previous hash and current hash.
- [ ] Implement deterministic scheduler priority ordering.
- [ ] Run `npm test` and verify event/focus/scheduler tests pass while remaining tests still identify unimplemented features.

### Task 3: Implement stochastic NPC, authority lease and didactic primitives

**Files:**
- Modify: `src/virgal/world-engine.js`

**Interfaces:**
- `chooseNpcAction({ seed, characterId, decisionSequence, candidates, temperature? })`
- `createEmergencyAuthorityLease(input)`
- `reassessEmergencyAuthorityLease(lease, state)`
- `evaluateDidacticSignal(input)`

- [ ] Implement deterministic seed hashing and seeded Gumbel-max action selection over eligible candidates only.
- [ ] Implement an emergency authority lease that permits only `EMERGENCY_CLINICAL` and explicitly excludes privacy/social/research/personhood/long-term-goal domains.
- [ ] Implement automatic expiry when emergency activity is false and supported participation is feasible.
- [ ] Implement side-effect-free Level 0/1/2 didactic scoring.
- [ ] Run `npm test` and verify stochastic, authority and didactic tests pass.

### Task 4: Implement branch/fork/replay primitives

**Files:**
- Modify: `src/virgal/world-engine.js`

**Interfaces:**
- `createBranch(world, { branchId }) -> BranchState`
- `forkBranch(branch, { branchId, seed? }) -> BranchState`
- `replayBranch(branch) -> { valid, headEventHash, divergenceAt? }`

- [ ] Implement deep-copy branch creation and child-branch isolation.
- [ ] Preserve parent event hashes on fork.
- [ ] Implement replay chain verification that stops at the first previous-hash mismatch.
- [ ] Run `npm test` and verify branch/replay tests pass.

### Task 5: Wire VIRGAL underneath the existing runtime

**Files:**
- Modify: `src/runtime.js`

**Interfaces:**
- `createRuntime()` gains `clinicalSeconds`, `evaluationSeconds`, `communicationComposing`, and `world` while retaining existing fields.
- `appendEvent()` mirrors each legacy event into the VIRGAL world ledger.
- `tick()` advances world/clinical time and conditionally evaluation time.

- [ ] Initialize a VIRGAL world state inside `createRuntime`.
- [ ] Mirror each existing runtime event through `commitEvent` while retaining existing UI event fields.
- [ ] Change AAC composition from a full simulation pause to an evaluation-only pause.
- [ ] Keep facilitator-style `paused` semantics available for future full pauses.
- [ ] Run `npm test` and verify all old and new tests pass.

### Task 6: Update UI wording and persistence projection

**Files:**
- Modify: `src/features/ui.js`
- Modify: `src/persistence.js`

**Interfaces:**
- UI continues to use `state.seconds` as the displayed clinical clock.
- Persistence snapshot additionally stores world time, event head hash, branch ID, clinical seconds and evaluation seconds.

- [ ] Change AAC UI text from “simulation clock paused” to “evaluation timer paused; clinical/world time continues”.
- [ ] Persist the added runtime clock/branch/head-hash fields without changing API shape.
- [ ] Run `npm test`.

### Task 7: Add architecture documentation and verification notes

**Files:**
- Create: `docs/superpowers/specs/2026-09-03-virgal-open-world-architecture.md`
- Create: `docs/superpowers/plans/2026-09-03-virgal-world-engine-v03.md`

**Interfaces:** Documentation only.

- [ ] Add the approved Sections 1–20 architecture and explicitly mark v0.3 slice boundaries.
- [ ] Add this implementation plan.
- [ ] Confirm no placeholders, contradictory authority rules or unsupported clinical exactness exist.

### Task 8: Final verification

**Files:** none beyond prior tasks.

- [ ] Run `npm test` and require all tests to pass.
- [ ] Confirm existing current scenarios still instantiate and existing station/choice APIs remain unchanged.
- [ ] Confirm world-event hashes are stable within the test vectors.
- [ ] Confirm AAC tests prove clinical/world time advances while evaluation time pauses.
- [ ] Confirm branch replay verifies its head hash.
- [ ] Commit to the feature branch and let repository CI/Vercel run before merge.
