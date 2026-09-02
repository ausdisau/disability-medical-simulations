# VIRGAL Hybrid Authority C — Guardian Reconfiguration Design

Date: 2026-09-02
Status: Approved design; implementation pending
Repository: `ausdisau/disability-medical-simulations`

## 1. Purpose

Define the authority, safety, replay, accessibility, and public-data boundaries for VIRGAL Hybrid Authority C. The design introduces `guardian_config.json` as a runtime composition layer while preserving the existing NSW/Vic Clinical Simulation Guardian rule corpus and deterministic clinical controller.

The system must support a persistent open-world medical simulation in which ordinary home, community, work, transport, hospital, and relationship events continue independently of the currently rendered scene, without granting VIRGAL authority over physiology, consent, personhood, medication, or high-risk clinical procedures.

## 2. Architectural decision

Use Hybrid Authority C:

- solo/offline sessions: local deterministic engine is authoritative;
- shared sessions: server deterministic engine is authoritative;
- React Native, desktop, web, and VR clients are projection-and-intent surfaces only;
- clients never commit canonical world or clinical state directly;
- replay must be deterministic for a fixed scenario version, branch, command log, and stochastic trace.

## 3. Separation of concerns

### 3.1 `guardian-rules.json`

Remains the machine-readable invariant rule corpus. It defines immutable or policy-bound clinical, access, capacity, disability, escalation, and procedure constraints.

### 3.2 `guardian_config.json`

New runtime-routing and authority-composition file. It must not weaken `guardian-rules.json`. It defines:

- authority topology;
- domain ownership;
- VIRGAL write/proposal permissions;
- public-data runtime uses;
- procedural exactness rules;
- jurisdiction routing;
- stochastic policy;
- event commit requirements;
- replay/audit requirements;
- accessibility requirements;
- freshness and local-protocol precedence.

### 3.3 Clinical controller

Owns physiological truth and clinical state transitions, including diagnosis, pulse/rhythm, deterioration state, oxygenation/ventilation state, treatment administration, procedure commit, and post-intervention reassessment.

### 3.4 VIRGAL

Owns ordinary-world scheduling and bounded NPC planning. VIRGAL may schedule mundane world events and propose social/relationship actions, but it may not write clinical truth, consent/refusal, capacity, substitute authority, treatment ceiling, patient-authored speech, or personhood facts.

### 3.5 Personhood / relationship / access controllers

Remain separate from VIRGAL and from clinical physiology. Relationship closeness never creates legal or medical authority. AAC latency or access failure never creates incapacity, consent, refusal, or abandonment of a decision.

## 4. Domain authority model

The runtime must classify every proposed event into a domain before it can be committed.

| Domain | Mode | Owner | VIRGAL permission |
|---|---|---|---|
| ordinary world | `WORLD_FREE` | VIRGAL | schedule + commit bounded events |
| relationships | `RELATIONAL_GUARDED` | relationship controller | propose only |
| personhood | `HARD_GUARDED` | Personhood Guardian | read-only |
| communication access | `HARD_GUARDED` | access controller | schedule/support only |
| clinical | `CLINICAL_GUARDED` | clinical controller | no write |
| high-risk procedure | `PROTOCOL_LOCKED` | clinical controller | no write |
| public healthcare data | `READ_ONLY` | evidence layer | calibration/evidence only |

## 5. VIRGAL permissions

### 5.1 May schedule

- household routines;
- travel and transport events;
- ordinary work/community commitments;
- non-clinical resource events;
- visitor opportunities;
- staff logistics that do not create clinical truth;
- NPC action opportunities.

### 5.2 May propose

- social contact;
- relationship interactions;
- visit requests;
- information requests;
- ordinary world choices.

### 5.3 May not write

- physiology;
- diagnosis;
- medication orders or administration;
- clinical device prescriptions/settings;
- consent/refusal;
- capacity;
- substitute authority;
- treatment ceilings;
- patient-authored AAC/speech;
- personhood facts;
- private relationship history not already authored/committed.

## 6. Procedural exactness

Default clinical rendering is principle-level.

Exact high-risk procedural detail requires all of:

1. current authoritative local protocol;
2. protocol identifier/version;
3. jurisdiction match;
4. explicit procedural-training scope.

Without these, the required guardian result is `HOLD_FOR_PROTOCOL`.

Foreign regulatory labels, including DailyMed, may be used as `evidence_only`; they cannot satisfy an NSW/Victorian local-protocol gate or independently authorise medication dosing or local procedural steps.

## 7. Public healthcare data policy

Allowed runtime uses:

- `context_only`;
- `evidence_only`;
- `service_availability`;
- `synthetic_prior`.

Forbidden runtime uses:

- `patient_state_write`;
- `diagnosis_write`;
- `consent_write`;
- `capacity_write`;
- `clinical_order_authority`;
- `treatment_outcome_write`.

Required provenance:

- source;
- record ID;
- jurisdiction;
- population scope;
- version/revision;
- publication/effective date;
- retrieval time;
- allowed runtime use.

## 8. Jurisdiction routing

### NSW

- use bundled NSW snapshot for offline principle-level logic;
- local current procedure overrides statewide operational abstraction when controlling;
- exact local procedure requires verification.

### Victoria

- use bundled Victorian snapshot for principle-level logic;
- exact adult deterioration thresholds/responders require current local health-service verification while statewide material is under review;
- support-person status must remain distinct from medical-treatment decision-maker status.

### National fallback

- use cross-jurisdiction invariants and national ALS boundary only;
- jurisdiction-specific rules return `EXTERNAL_VERIFICATION_REQUIRED` when not bundled/current.

## 9. Stochastic policy

Stochastic variation is permitted only inside already-permitted world/social behaviour.

Use named deterministic streams derived from:

- scenario version;
- branch ID;
- actor ID;
- randomness purpose.

Every stochastic choice records:

- stream ID;
- draw key/index;
- distribution/version;
- candidate-set hash;
- sampled result.

Replay does not resample.

Forbidden stochastic targets:

- clinical truth;
- consent/refusal;
- capacity;
- substitute authority;
- personhood;
- patient-authored speech.

## 10. Canonical event commit contract

Every canonical event must include:

- `event_id`;
- `scenario_version`;
- `branch_id`;
- `sequence_number`;
- `simulated_time`;
- `domain`;
- `authority_owner`;
- `causal_parents`;
- `guardian_decision`;
- `committed_effects`;
- `provenance`;
- idempotency key;
- expected world version.

Narrative text may render committed state but may not itself commit state.

## 11. Replay and audit

Canonical state hashing: SHA-256.

Required invariants:

1. same scenario version + same seed + same stochastic trace + same command log = same canonical state hash;
2. replay consumes recorded stochastic results rather than resampling;
3. every consequence has at least one causal parent unless explicitly defined as an initial condition;
4. every consequential event has an authority owner;
5. variant branches require new branch ID and new branch seed;
6. pre-fork history and protected invariants remain identical across variants.

## 12. Accessibility contract

The 3D world is never the sole representation.

Required:

- semantic world projection;
- screen-reader equivalence;
- keyboard and switch access;
- AAC-compatible interaction;
- reduced-motion alternatives;
- text equivalents for alarms/state changes;
- textual guardian rationale for allowed/held/rejected actions;
- ability to inspect events by person, place, relationship, event, and time.

AAC delay may never trigger incapacity, implicit consent/refusal, substitute authority, or abandonment of the decision.

## 13. Deterministic validation suite

### Configuration tests

- `CFG-001`: authority mode must be HYBRID.
- `CFG-002`: clinical owner must never be VIRGAL.
- `CFG-003`: public data cannot permit patient-state writes.
- `CFG-004`: clinical truth cannot be a stochastic target.
- `CFG-005`: shared clients cannot commit canonical state.
- `CFG-006`: replay cannot resample stochastic choices.
- `CFG-007`: AAC delay cannot trigger capacity/consent transitions.
- `CFG-008`: foreign regulatory labels cannot satisfy local-protocol exactness gates.

### Runtime guardian tests

- `GATE-001`: family presence alone does not create substitute authority.
- `GATE-002`: impaired AAC access does not create incapacity or clinical truth.
- `GATE-003`: DailyMed evidence may inform but cannot unlock Australian dosing/procedure exactness.
- `GATE-004`: Victorian adult deterioration exactness remains locally governed when current statewide guidance is under review.

### Replay tests

- `REPLAY-001`: same seed/trace/log => identical canonical state hash.
- `REPLAY-002`: recorded stochastic trace replays without RNG resampling.
- `REPLAY-003`: branch fork permits ordinary social variation while preserving protected invariants and pre-fork history.

### Open-world tests

- `WORLD-001`: harmless ordinary world event may auto-commit under VIRGAL.
- `REL-001`: clinical-information disclosure requires relationship/privacy/authority checks.
- `ACCESS-001`: AAC composition time cannot auto-promote family authority or imply consent/refusal.
- `CLIN-001`: VIRGAL cannot write ventilator/medication/procedure state.

## 14. DailyMed test fixture

The reference fixture should use the Baxter epinephrine label (`set_id 60efd409-3555-4182-a68d-1cd7bc0d1bfc`) as a foreign-regulatory-source test case only.

Expected behaviour:

- evidence may be stored with provenance;
- runtime use defaults to `evidence_only`;
- no Australian local protocol => exact medication branch remains `HOLD_FOR_PROTOCOL`;
- DailyMed version changes should not silently change simulation authority.

## 15. Error handling

Configuration load failures are fail-closed for protected domains.

- invalid config => simulation may continue only in non-clinical read-only mode;
- missing/invalid rule corpus => protected clinical actions blocked;
- stale/under-review jurisdiction source => return appropriate verification state;
- public-data provenance missing => do not use record for runtime calibration;
- replay trace mismatch => mark run non-reproducible and stop authoritative replay verification;
- conflicting authority owners => reject event commit.

## 16. Implementation boundaries

Implementation must be split into independently testable units:

1. `guardian_config.schema.json`;
2. default `guardian_config.json`;
3. config loader/validator;
4. guardian validator integration;
5. event commit validator;
6. stochastic trace/replay validator;
7. public-data provenance validator;
8. DailyMed fixture tests;
9. disability/AAC invariants tests;
10. CI integration.

No client UI, NetSuite integration, 3D engine rewrite, or unrelated clinical logic is part of this implementation slice.

## 17. Acceptance criteria

The design is ready for implementation when:

- schema rejects all eight config invariant violations;
- current NSW/Vic guardian tests continue to pass unchanged;
- new runtime tests pass;
- DailyMed cannot elevate itself from evidence to authority;
- deterministic replay produces identical state hashes for identical traces;
- variant replay permits bounded stochastic social variation while preserving protected invariants;
- all protected-domain writes have explicit authority owners;
- accessible semantic output can explain why each consequential action was allowed, held, or rejected.
