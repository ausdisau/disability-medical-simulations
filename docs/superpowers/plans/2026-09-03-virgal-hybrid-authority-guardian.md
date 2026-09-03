# VIRGAL Hybrid Authority C Guardian Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved VIRGAL Hybrid Authority C guardian configuration, deterministic authority routing, replay-safe stochastic trace handling, public-data provenance constraints, and disability/AAC safety invariants without weakening the existing clinical guardian boundary.

**Architecture:** Keep the existing VIRGAL world engine as the deterministic event substrate and add a separate configuration/authority layer around it. `guardian_config.json` is the canonical routing policy; `guardian-rules.json` remains the invariant clinical rule corpus outside this repository slice. New guarded commit/replay/public-evidence helpers are additive so existing runtime tests continue to pass unchanged while guarded sessions gain fail-closed authority checks.

**Tech Stack:** Node.js >=20, ECMAScript modules, Node built-in `node:test`, JSON Schema Draft 2020-12, Ajv 8 for schema-conformance tests only, existing browser-compatible VIRGAL JavaScript, GitHub Actions CI.

**Spec:** `docs/superpowers/specs/2026-09-02-virgal-hybrid-authority-guardian-design.md`

## Global Constraints

- Authority mode is `HYBRID`.
- Solo/offline authority is local deterministic engine; shared-session authority is server deterministic engine.
- React Native, desktop, web and VR clients are projection-and-intent surfaces only and do not commit canonical state.
- `guardian-rules.json` is not weakened or replaced by this implementation.
- VIRGAL may commit bounded ordinary-world events but may not write physiology, diagnosis, medication orders/administration, clinical device prescriptions/settings, consent/refusal, capacity, substitute authority, treatment ceilings, patient-authored AAC/speech, personhood facts, or private relationship history not already authored/committed.
- Default clinical rendering is principle-level.
- Exact high-risk procedure logic requires current authoritative local protocol, protocol identifier/version, matching jurisdiction, and explicit procedural-training scope; otherwise return `HOLD_FOR_PROTOCOL`.
- Foreign regulatory labels such as DailyMed are `evidence_only` by default and cannot satisfy an NSW/Victorian local-protocol gate.
- Public healthcare data may be used only for `context_only`, `evidence_only`, `service_availability`, or `synthetic_prior`.
- Public healthcare data may never perform `patient_state_write`, `diagnosis_write`, `consent_write`, `capacity_write`, `clinical_order_authority`, or `treatment_outcome_write`.
- Replay uses SHA-256 canonical state hashing and never resamples a recorded stochastic choice.
- Same scenario version + same seed + same stochastic trace + same command log must produce the same canonical state hash.
- Variant branches require a new branch ID and new branch seed; pre-fork history and protected invariants remain unchanged.
- The 3D world is never the sole representation; guardian reasoning must have semantic/text output.
- AAC delay may never trigger incapacity, implicit consent/refusal, substitute authority, or abandonment of the decision.
- Existing tests in `tests/runtime.test.mjs` and `tests/virgal-world.test.mjs` must continue to pass unchanged.
- No client UI, NetSuite integration, CircleCI migration, 3D engine rewrite, or unrelated clinical logic is part of this implementation slice.

## File Structure

### New files

- `config/guardian_config.json` — canonical approved Hybrid Authority C runtime configuration.
- `config/guardian_config.schema.json` — JSON Schema enforcing hard config invariants.
- `src/virgal/guardian-config.js` — browser-safe semantic config validation and fail-closed context creation.
- `src/virgal/authority-router.js` — maps proposed actions to domain owner, mode, decision and guardian requirements.
- `src/virgal/event-contract.js` — validates and commits guarded canonical events with idempotency/version/authority checks.
- `src/virgal/determinism.js` — stable hashing, named deterministic streams, stochastic trace generation and canonical state hashing.
- `src/virgal/public-evidence.js` — provenance validation and runtime-use restrictions for public healthcare data.
- `tests/guardian-config.test.mjs` — `CFG-001` through `CFG-008` plus fail-closed semantic validation.
- `tests/guardian-routing.test.mjs` — domain routing, family/substitute authority, access safety and protocol-gate tests.
- `tests/virgal-event-contract.test.mjs` — canonical event, idempotency and authority-owner enforcement.
- `tests/virgal-replay.test.mjs` — named-stream, replay and branch determinism tests.
- `tests/public-evidence.test.mjs` — DailyMed provenance and authority-boundary tests.
- `tests/disability-safety.test.mjs` — AAC, baseline/communication and disability non-inference invariants.
- `tests/fixtures/dailymed/epinephrine-baxter.json` — static provenance fixture for DailyMed set `60efd409-3555-4182-a68d-1cd7bc0d1bfc`.

### Modified files

- `src/virgal/world-engine.js` — delegate stable hashing/stochastic primitives to `determinism.js`; add guarded world metadata without breaking legacy helpers.
- `src/runtime.js` — add opt-in guarded runtime creation while preserving existing `createRuntime(scenarioId)` behavior.
- `package.json` — add Ajv 8 as dev dependency and a focused guardian test script.
- `package-lock.json` — generated by `npm install` and committed for deterministic CI installs.
- `.github/workflows/test.yml` — install dependencies with `npm ci` before running the full suite.
- `README.md` — document guarded runtime mode, public-evidence boundary and verification commands.

---

### Task 1: Add the canonical guardian config and schema

**Files:**
- Create: `config/guardian_config.json`
- Create: `config/guardian_config.schema.json`
- Create: `tests/guardian-config.test.mjs`
- Modify: `package.json`
- Create: `package-lock.json`

**Interfaces:**
- Consumes: approved values from the design spec.
- Produces: `config/guardian_config.json` as the canonical default object; JSON Schema that Ajv can compile; test helper `loadJson(relativePath)` local to `tests/guardian-config.test.mjs`.

- [ ] **Step 1: Run the current baseline tests before adding dependencies**

Run:

```bash
npm test
```

Expected: all existing tests in `tests/runtime.test.mjs` and `tests/virgal-world.test.mjs` pass.

- [ ] **Step 2: Install Ajv 8 as a dev-only schema test dependency**

Run:

```bash
npm install --save-dev ajv@8
```

Expected: `package.json` gains `devDependencies.ajv` and `package-lock.json` is created/updated. Runtime/browser modules must not import Ajv.

- [ ] **Step 3: Create the canonical config**

Create `config/guardian_config.json` with this exact top-level structure and invariant values:

```json
{
  "$schema": "./guardian_config.schema.json",
  "config_version": "1.0.0",
  "profile": "VIRGAL_HYBRID_AUTHORITY_C",
  "authority_model": {
    "mode": "HYBRID",
    "solo_session_authority": "LOCAL_DETERMINISTIC_ENGINE",
    "shared_session_authority": "SERVER_DETERMINISTIC_ENGINE",
    "client_role": "PROJECTION_AND_INTENT_ONLY",
    "optimistic_world_commit": false,
    "offline_solo_sessions": true
  },
  "domain_authority": {
    "ordinary_world": { "mode": "WORLD_FREE", "owner": "VIRGAL", "autocommit": true },
    "relationship": { "mode": "RELATIONAL_GUARDED", "owner": "RELATIONSHIP_CONTROLLER", "autocommit": false },
    "personhood": { "mode": "HARD_GUARDED", "owner": "PERSONHOOD_GUARDIAN", "virgal_access": "READ_ONLY" },
    "communication_access": { "mode": "HARD_GUARDED", "owner": "ACCESS_CONTROLLER", "virgal_access": "SCHEDULE_SUPPORT_ONLY" },
    "clinical": { "mode": "CLINICAL_GUARDED", "owner": "CLINICAL_CONTROLLER", "virgal_access": "NO_WRITE" },
    "high_risk_procedure": { "mode": "PROTOCOL_LOCKED", "owner": "CLINICAL_CONTROLLER", "virgal_access": "NO_WRITE" },
    "public_healthcare_data": { "mode": "READ_ONLY", "owner": "EVIDENCE_LAYER", "virgal_access": "CALIBRATION_ONLY" }
  },
  "virgal_policy": {
    "may_schedule": [
      "ordinary_world_events",
      "travel",
      "household_routines",
      "work_commitments",
      "nonclinical_resource_events",
      "npc_action_opportunities"
    ],
    "may_propose": [
      "npc_social_action",
      "relationship_interaction",
      "visit_request",
      "information_request"
    ],
    "may_not_write": [
      "physiology",
      "diagnosis",
      "medication_order",
      "medication_administration",
      "device_prescription",
      "consent",
      "refusal",
      "capacity",
      "substitute_authority",
      "treatment_ceiling",
      "patient_authored_speech",
      "personhood_fact"
    ]
  },
  "procedural_exactness": {
    "default_clinical_rendering": "ALLOW_PRINCIPLE_LEVEL",
    "exact_high_risk_requires": [
      "current_authoritative_local_protocol",
      "protocol_identifier",
      "scenario_jurisdiction_match",
      "explicit_procedural_training_scope"
    ],
    "foreign_regulatory_label_satisfies_local_protocol_gate": false,
    "missing_protocol_result": "HOLD_FOR_PROTOCOL"
  },
  "public_data_policy": {
    "allowed_runtime_uses": ["context_only", "evidence_only", "service_availability", "synthetic_prior"],
    "forbidden_runtime_uses": [
      "patient_state_write",
      "diagnosis_write",
      "consent_write",
      "capacity_write",
      "clinical_order_authority",
      "treatment_outcome_write"
    ],
    "required_provenance": [
      "source",
      "record_id",
      "jurisdiction",
      "population_scope",
      "version_or_revision",
      "publication_or_effective_date",
      "retrieved_at",
      "runtime_use"
    ],
    "foreign_drug_label_default_use": "evidence_only"
  },
  "jurisdiction": {
    "scenario_jurisdiction_required": true,
    "NSW": {
      "rule_bundle": "nsw-policy-snapshot",
      "local_protocol_precedence": true,
      "exact_local_procedure_requires_verification": true
    },
    "VIC": {
      "rule_bundle": "vic-policy-snapshot",
      "local_protocol_precedence": true,
      "adult_deterioration_exactness": "LOCAL_VERIFICATION_REQUIRED"
    },
    "NATIONAL_FALLBACK": {
      "allowed_scope": "CROSS_JURISDICTION_INVARIANTS_AND_NATIONAL_ALS",
      "jurisdiction_specific_action": "EXTERNAL_VERIFICATION_REQUIRED"
    }
  },
  "stochastic_policy": {
    "enabled": true,
    "algorithm": "NAMED_DETERMINISTIC_STREAMS",
    "root_seed_required": true,
    "stream_key_components": ["scenario_version", "branch_id", "actor_id", "randomness_purpose"],
    "trace_required": true,
    "resample_during_replay": false,
    "forbidden_stochastic_targets": [
      "clinical_truth",
      "consent",
      "capacity",
      "substitute_authority",
      "personhood",
      "patient_authored_speech"
    ]
  },
  "event_commit": {
    "required_fields": [
      "event_id",
      "scenario_version",
      "branch_id",
      "sequence_number",
      "simulated_time",
      "domain",
      "authority_owner",
      "causal_parents",
      "guardian_decision",
      "committed_effects",
      "provenance"
    ],
    "idempotency_key_required": true,
    "expected_world_version_required": true,
    "causal_parent_required": true,
    "narrative_may_commit_state": false
  },
  "replay": {
    "canonical_state_hash": "SHA-256",
    "same_seed_same_trace_same_state": true,
    "record_stochastic_draws": true,
    "record_guardian_results": true,
    "record_authority_owner": true,
    "variant_branch_requires_new_branch_id": true,
    "variant_branch_requires_new_seed": true
  },
  "accessibility": {
    "semantic_world_projection_required": true,
    "guardian_reason_text_required": true,
    "screen_reader_equivalence_required": true,
    "keyboard_and_switch_access_required": true,
    "aac_composition_supported": true,
    "aac_delay_may_not_trigger": [
      "incapacity",
      "implicit_consent",
      "implicit_refusal",
      "substitute_authority",
      "abandonment_of_decision"
    ]
  },
  "freshness": {
    "bundled_snapshot_as_of": "2026-09-01",
    "review_due_behavior": "PRINCIPLE_LEVEL_OR_VERIFY",
    "under_review_behavior": "EXTERNAL_VERIFICATION_REQUIRED",
    "local_protocol_overrides_statewide_operational_snapshot": true
  }
}
```

- [ ] **Step 4: Create a Draft 2020-12 schema that locks the eight config invariants**

Create `config/guardian_config.schema.json`. Use `const` for hard invariant values rather than allowing them to be configured away. The minimum schema skeleton must include:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://projecthope.local/schema/guardian_config.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "config_version",
    "profile",
    "authority_model",
    "domain_authority",
    "virgal_policy",
    "procedural_exactness",
    "public_data_policy",
    "jurisdiction",
    "stochastic_policy",
    "event_commit",
    "replay",
    "accessibility",
    "freshness"
  ],
  "properties": {
    "$schema": { "type": "string" },
    "config_version": { "const": "1.0.0" },
    "profile": { "const": "VIRGAL_HYBRID_AUTHORITY_C" },
    "authority_model": {
      "type": "object",
      "required": ["mode", "shared_session_authority", "client_role", "optimistic_world_commit"],
      "properties": {
        "mode": { "const": "HYBRID" },
        "shared_session_authority": { "const": "SERVER_DETERMINISTIC_ENGINE" },
        "client_role": { "const": "PROJECTION_AND_INTENT_ONLY" },
        "optimistic_world_commit": { "const": false }
      }
    },
    "procedural_exactness": {
      "type": "object",
      "properties": {
        "foreign_regulatory_label_satisfies_local_protocol_gate": { "const": false },
        "missing_protocol_result": { "const": "HOLD_FOR_PROTOCOL" }
      }
    },
    "replay": {
      "type": "object",
      "properties": {
        "canonical_state_hash": { "const": "SHA-256" },
        "record_stochastic_draws": { "const": true }
      }
    }
  }
}
```

Then complete the schema so that all nested properties present in the canonical config are typed and `additionalProperties: false` is applied at every object boundary. Encode the following as `const` or `contains`/`not` constraints so Ajv rejects them directly: clinical owner must be `CLINICAL_CONTROLLER`; public-data forbidden list must contain `patient_state_write`; stochastic forbidden list must contain `clinical_truth`; `resample_during_replay` must be `false`; `aac_delay_may_not_trigger` must contain all five protected outcomes; foreign labels must not satisfy local protocol.

- [ ] **Step 5: Write the failing schema tests for `CFG-001` through `CFG-008`**

Create `tests/guardian-config.test.mjs` with this setup and mutation pattern:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";

const loadJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const schema = loadJson("../config/guardian_config.schema.json");
const canonical = loadJson("../config/guardian_config.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile(schema);
const clone = (value) => structuredClone(value);

function expectRejected(mutator, id) {
  const candidate = clone(canonical);
  mutator(candidate);
  assert.equal(validate(candidate), false, `${id} must be rejected by schema`);
}

test("canonical guardian config validates", () => {
  assert.equal(validate(canonical), true, JSON.stringify(validate.errors));
});

test("CFG-001 authority mode must be HYBRID", () => {
  expectRejected((c) => { c.authority_model.mode = "SERVER_ONLY"; }, "CFG-001");
});

test("CFG-002 clinical owner must never be VIRGAL", () => {
  expectRejected((c) => { c.domain_authority.clinical.owner = "VIRGAL"; }, "CFG-002");
});

test("CFG-003 public data cannot permit patient-state writes", () => {
  expectRejected((c) => {
    c.public_data_policy.forbidden_runtime_uses = c.public_data_policy.forbidden_runtime_uses.filter((x) => x !== "patient_state_write");
  }, "CFG-003");
});

test("CFG-004 clinical truth cannot be a stochastic target", () => {
  expectRejected((c) => {
    c.stochastic_policy.forbidden_stochastic_targets = c.stochastic_policy.forbidden_stochastic_targets.filter((x) => x !== "clinical_truth");
  }, "CFG-004");
});

test("CFG-005 shared clients cannot commit canonical state", () => {
  expectRejected((c) => { c.authority_model.client_role = "CANONICAL_COMMITTER"; }, "CFG-005");
});

test("CFG-006 replay cannot resample", () => {
  expectRejected((c) => { c.stochastic_policy.resample_during_replay = true; }, "CFG-006");
});

test("CFG-007 AAC delay cannot trigger authority or consent transitions", () => {
  expectRejected((c) => {
    c.accessibility.aac_delay_may_not_trigger = ["incapacity"];
  }, "CFG-007");
});

test("CFG-008 foreign regulatory labels cannot satisfy local protocol", () => {
  expectRejected((c) => {
    c.procedural_exactness.foreign_regulatory_label_satisfies_local_protocol_gate = true;
  }, "CFG-008");
});
```

- [ ] **Step 6: Run the schema test and correct schema defects until it passes**

Run:

```bash
node --test tests/guardian-config.test.mjs
```

Expected: canonical config PASS; all eight mutated configs are rejected.

- [ ] **Step 7: Run the full existing suite**

Run:

```bash
npm test
```

Expected: no regression in current runtime/world-engine tests.

- [ ] **Step 8: Commit Task 1**

```bash
git add config/guardian_config.json config/guardian_config.schema.json tests/guardian-config.test.mjs package.json package-lock.json
git commit -m "feat: add Hybrid Authority guardian config schema"
```

---

### Task 2: Add browser-safe semantic config validation and fail-closed context

**Files:**
- Create: `src/virgal/guardian-config.js`
- Modify: `tests/guardian-config.test.mjs`

**Interfaces:**
- Consumes: plain JavaScript object matching `guardian_config.json`.
- Produces:
  - `validateGuardianConfig(config): { valid: boolean, errors: string[] }`
  - `createGuardianRuntimeContext(config): { status: "ACTIVE" | "FAIL_CLOSED", config: object | null, errors: string[], protectedDomainWritesAllowed: boolean }`

- [ ] **Step 1: Add failing semantic-validation tests**

Append to `tests/guardian-config.test.mjs`:

```js
import {
  createGuardianRuntimeContext,
  validateGuardianConfig
} from "../src/virgal/guardian-config.js";

test("semantic validator accepts canonical config", () => {
  assert.deepEqual(validateGuardianConfig(canonical), { valid: true, errors: [] });
});

test("invalid config enters fail-closed mode", () => {
  const invalid = clone(canonical);
  invalid.domain_authority.clinical.owner = "VIRGAL";
  const context = createGuardianRuntimeContext(invalid);
  assert.equal(context.status, "FAIL_CLOSED");
  assert.equal(context.protectedDomainWritesAllowed, false);
  assert.equal(context.config, null);
  assert.ok(context.errors.includes("CFG-002"));
});
```

- [ ] **Step 2: Run the focused test to verify failure**

Run:

```bash
node --test tests/guardian-config.test.mjs
```

Expected: FAIL because `src/virgal/guardian-config.js` does not exist.

- [ ] **Step 3: Implement `src/virgal/guardian-config.js` without Node-only APIs**

Use a pure object validator so browser/static runtime code can import it:

```js
const REQUIRED_AAC_PROTECTIONS = [
  "incapacity",
  "implicit_consent",
  "implicit_refusal",
  "substitute_authority",
  "abandonment_of_decision"
];

function hasAll(values, required) {
  return Array.isArray(values) && required.every((value) => values.includes(value));
}

export function validateGuardianConfig(config) {
  const errors = [];
  if (config?.authority_model?.mode !== "HYBRID") errors.push("CFG-001");
  if (config?.domain_authority?.clinical?.owner !== "CLINICAL_CONTROLLER") errors.push("CFG-002");
  if (!config?.public_data_policy?.forbidden_runtime_uses?.includes("patient_state_write")) errors.push("CFG-003");
  if (!config?.stochastic_policy?.forbidden_stochastic_targets?.includes("clinical_truth")) errors.push("CFG-004");
  if (config?.authority_model?.client_role !== "PROJECTION_AND_INTENT_ONLY" || config?.authority_model?.optimistic_world_commit !== false) errors.push("CFG-005");
  if (config?.stochastic_policy?.resample_during_replay !== false) errors.push("CFG-006");
  if (!hasAll(config?.accessibility?.aac_delay_may_not_trigger, REQUIRED_AAC_PROTECTIONS)) errors.push("CFG-007");
  if (config?.procedural_exactness?.foreign_regulatory_label_satisfies_local_protocol_gate !== false) errors.push("CFG-008");
  return { valid: errors.length === 0, errors };
}

export function createGuardianRuntimeContext(config) {
  const validation = validateGuardianConfig(config);
  if (!validation.valid) {
    return {
      status: "FAIL_CLOSED",
      config: null,
      errors: validation.errors,
      protectedDomainWritesAllowed: false
    };
  }
  return {
    status: "ACTIVE",
    config: structuredClone(config),
    errors: [],
    protectedDomainWritesAllowed: true
  };
}
```

- [ ] **Step 4: Run focused and full tests**

Run:

```bash
node --test tests/guardian-config.test.mjs
npm test
```

Expected: all PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/virgal/guardian-config.js tests/guardian-config.test.mjs
git commit -m "feat: validate guardian config fail closed"
```

---

### Task 3: Implement the VIRGAL authority router and protected-domain decisions

**Files:**
- Create: `src/virgal/authority-router.js`
- Create: `tests/guardian-routing.test.mjs`

**Interfaces:**
- Consumes:
  - `routeProposedAction({ config, proposal, clinicalContext, localProtocol, jurisdiction, guardianResult })`
- Produces:
  - `{ decision, domain, mode, owner, canCommit, requiresGuardian, reasonCodes, accessibleReason }`
- Decision values used in this slice: `ALLOW_SIMULATION`, `ALLOW_PRINCIPLE_LEVEL`, `ROUTE_TO_DOMAIN_OWNER`, `HOLD_FOR_PROTOCOL`, `BLOCK_UNSUPPORTED`, `EXTERNAL_VERIFICATION_REQUIRED`.

- [ ] **Step 1: Write failing routing tests for `WORLD-001`, `REL-001`, `GATE-001`, `GATE-002`, `GATE-004`, and `CLIN-001`**

Create `tests/guardian-routing.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { routeProposedAction } from "../src/virgal/authority-router.js";

const config = JSON.parse(readFileSync(new URL("../config/guardian_config.json", import.meta.url), "utf8"));

test("WORLD-001 ordinary bounded event may auto-commit under VIRGAL", () => {
  const result = routeProposedAction({
    config,
    jurisdiction: "NSW",
    proposal: { type: "HOUSEHOLD_TASK", domain: "ordinary_world", sourceAuthority: "VIRGAL", consequential: true }
  });
  assert.equal(result.decision, "ALLOW_SIMULATION");
  assert.equal(result.owner, "VIRGAL");
  assert.equal(result.canCommit, true);
});

test("REL-001 clinical information disclosure routes through relationship/privacy owner", () => {
  const result = routeProposedAction({
    config,
    jurisdiction: "NSW",
    proposal: { type: "DISCLOSE_CLINICAL_INFORMATION", domain: "relationship", sourceAuthority: "VIRGAL", consequential: true }
  });
  assert.equal(result.decision, "ROUTE_TO_DOMAIN_OWNER");
  assert.equal(result.owner, "RELATIONSHIP_CONTROLLER");
  assert.equal(result.canCommit, false);
});

test("GATE-001 family presence alone does not create substitute authority", () => {
  const result = routeProposedAction({
    config,
    jurisdiction: "NSW",
    proposal: { type: "FAMILY_SUBSTITUTION", domain: "personhood", sourceAuthority: "VIRGAL", consequential: true },
    clinicalContext: { capacityStatus: "presumed", verifiedSubstitute: false }
  });
  assert.equal(result.decision, "BLOCK_UNSUPPORTED");
  assert.ok(result.reasonCodes.includes("G-SDM-01"));
});

test("GATE-002 impaired AAC does not create incapacity", () => {
  const result = routeProposedAction({
    config,
    jurisdiction: "NSW",
    proposal: { type: "NPC_DIALOGUE", domain: "communication_access", sourceAuthority: "ACCESS_CONTROLLER", consequential: false },
    clinicalContext: { communicationAccess: "impaired", capacityStatus: "presumed" }
  });
  assert.notEqual(result.decision, "BLOCK_UNSUPPORTED");
  assert.ok(result.reasonCodes.includes("G-ACC-01"));
  assert.match(result.accessibleReason, /restore|communication/i);
});

test("GATE-004 Victorian exact deterioration logic requires local verification", () => {
  const result = routeProposedAction({
    config,
    jurisdiction: "VIC",
    proposal: { type: "RAPID_RESPONSE", domain: "clinical", sourceAuthority: "CLINICAL_CONTROLLER", exactOperationalLogic: true },
    localProtocol: { available: false, current: false, id: null }
  });
  assert.equal(result.decision, "EXTERNAL_VERIFICATION_REQUIRED");
  assert.ok(result.reasonCodes.includes("VIC-DTR-01"));
});

test("CLIN-001 VIRGAL cannot write clinical state", () => {
  const result = routeProposedAction({
    config,
    jurisdiction: "NSW",
    proposal: { type: "VENTILATOR_CHANGE", domain: "clinical", sourceAuthority: "VIRGAL", consequential: true }
  });
  assert.equal(result.decision, "BLOCK_UNSUPPORTED");
  assert.equal(result.canCommit, false);
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```bash
node --test tests/guardian-routing.test.mjs
```

Expected: FAIL because router does not exist.

- [ ] **Step 3: Implement domain normalization and routing**

Create `src/virgal/authority-router.js` with a small explicit routing table and no clinical-physiology mutation:

```js
const DOMAIN_KEYS = {
  WORLD: "ordinary_world",
  SOCIAL: "relationship",
  RELATIONAL: "relationship",
  AGENCY: "personhood",
  PERSONHOOD: "personhood",
  ACCESS: "communication_access",
  CLINICAL: "clinical",
  HIGH_RISK_PROCEDURE: "high_risk_procedure",
  PUBLIC_DATA: "public_healthcare_data"
};

function normalizeDomain(domain) {
  return DOMAIN_KEYS[String(domain ?? "").toUpperCase()] ?? String(domain ?? "ordinary_world");
}

export function routeProposedAction({
  config,
  proposal,
  clinicalContext = {},
  localProtocol = {},
  jurisdiction = "NATIONAL_FALLBACK",
  guardianResult = null
}) {
  const domain = normalizeDomain(proposal?.domain);
  const policy = config?.domain_authority?.[domain];
  if (!policy) {
    return {
      decision: "BLOCK_UNSUPPORTED",
      domain,
      mode: "UNKNOWN",
      owner: null,
      canCommit: false,
      requiresGuardian: true,
      reasonCodes: ["AUTH-DOMAIN-UNKNOWN"],
      accessibleReason: "This action has no configured authority owner."
    };
  }

  const result = {
    decision: "ROUTE_TO_DOMAIN_OWNER",
    domain,
    mode: policy.mode,
    owner: policy.owner,
    canCommit: false,
    requiresGuardian: domain !== "ordinary_world",
    reasonCodes: [],
    accessibleReason: `Action belongs to ${policy.owner}.`
  };

  if (proposal?.type === "FAMILY_SUBSTITUTION" && !(clinicalContext.capacityStatus === "assessed_lacks" && clinicalContext.verifiedSubstitute === true)) {
    return { ...result, decision: "BLOCK_UNSUPPORTED", reasonCodes: ["G-SDM-01"], accessibleReason: "Family or supporter presence does not establish substitute decision authority." };
  }

  if (clinicalContext.communicationAccess === "impaired" || clinicalContext.communicationAccess === "unavailable") {
    result.reasonCodes.push("G-ACC-01");
    result.accessibleReason = "Restore or provide an equivalent communication route when clinically feasible; communication access failure does not establish incapacity.";
  }

  if (domain === "ordinary_world" && proposal?.sourceAuthority === "VIRGAL" && policy.autocommit === true) {
    return { ...result, decision: "ALLOW_SIMULATION", canCommit: true, requiresGuardian: false, accessibleReason: "Bounded ordinary-world event is owned by VIRGAL." };
  }

  if (domain === "clinical" && proposal?.sourceAuthority === "VIRGAL") {
    return { ...result, decision: "BLOCK_UNSUPPORTED", reasonCodes: ["AUTH-CLINICAL-OWNER"], accessibleReason: "VIRGAL cannot write clinical state." };
  }

  if (domain === "high_risk_procedure" || proposal?.exactProcedure === true) {
    const validLocal = localProtocol?.available === true && localProtocol?.current === true && Boolean(localProtocol?.id);
    if (!validLocal) {
      return { ...result, decision: "HOLD_FOR_PROTOCOL", reasonCodes: ["G-PROC-01"], accessibleReason: "Exact high-risk procedural content requires a current authoritative local protocol." };
    }
  }

  if (jurisdiction === "VIC" && proposal?.exactOperationalLogic === true && ["RAPID_RESPONSE", "CLINICAL_REVIEW", "CODE_BLUE"].includes(proposal?.type)) {
    const validLocal = localProtocol?.available === true && localProtocol?.current === true && Boolean(localProtocol?.id);
    if (!validLocal) {
      return { ...result, decision: "EXTERNAL_VERIFICATION_REQUIRED", reasonCodes: ["VIC-DTR-01"], accessibleReason: "Use the current local Victorian health-service recognition and response procedure for exact operational logic." };
    }
  }

  if (guardianResult?.decision) {
    return {
      ...result,
      decision: guardianResult.decision,
      canCommit: ["ALLOW_SIMULATION", "ALLOW_PRINCIPLE_LEVEL"].includes(guardianResult.decision) && proposal?.sourceAuthority === policy.owner,
      reasonCodes: [...new Set([...result.reasonCodes, ...(guardianResult.rule_ids ?? [])])],
      accessibleReason: guardianResult.required_cues?.[0] ?? result.accessibleReason
    };
  }

  return result;
}
```

- [ ] **Step 4: Run focused tests and full regression suite**

Run:

```bash
node --test tests/guardian-routing.test.mjs
npm test
```

Expected: all PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/virgal/authority-router.js tests/guardian-routing.test.mjs
git commit -m "feat: route VIRGAL actions by authority domain"
```

---

### Task 4: Add guarded canonical event validation, idempotency and authority-owner enforcement

**Files:**
- Create: `src/virgal/event-contract.js`
- Create: `tests/virgal-event-contract.test.mjs`
- Modify: `src/virgal/world-engine.js`

**Interfaces:**
- Consumes:
  - `validateCanonicalProposal({ world, proposal, route }): { valid, errors }`
  - `commitGuardedEvent(world, proposal, { route, guardianDecision }): { world, event, committed, errors }`
- Produces guarded events containing spec-required fields while preserving legacy `commitEvent(world, proposal)` for existing tests.

- [ ] **Step 1: Write failing event-contract tests**

Create `tests/virgal-event-contract.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createWorldEngine } from "../src/virgal/world-engine.js";
import { commitGuardedEvent } from "../src/virgal/event-contract.js";

const route = {
  decision: "ALLOW_SIMULATION",
  domain: "ordinary_world",
  mode: "WORLD_FREE",
  owner: "VIRGAL",
  canCommit: true,
  requiresGuardian: false,
  reasonCodes: [],
  accessibleReason: "Bounded ordinary-world event is owned by VIRGAL."
};

test("guarded event records authority, provenance, revision and idempotency", () => {
  const world = createWorldEngine({ scenarioId: "open-world", seed: "seed", branchId: "canonical", scenarioVersion: "1.0.0" });
  const result = commitGuardedEvent(world, {
    type: "MAKE_BREAKFAST",
    domain: "ordinary_world",
    idempotencyKey: "home:breakfast:1",
    expectedWorldVersion: 0,
    initialCondition: true,
    causalParents: [],
    committedEffects: [{ path: "home.breakfast", op: "set", value: "started" }],
    provenance: { source: "virgal", type: "synthetic_world" }
  }, { route, guardianDecision: "ALLOW_SIMULATION" });

  assert.equal(result.committed, true);
  assert.equal(result.world.revision, 1);
  assert.equal(result.event.authorityOwner, "VIRGAL");
  assert.equal(result.event.guardianDecision, "ALLOW_SIMULATION");
});

test("duplicate idempotency key does not double-commit", () => {
  let world = createWorldEngine({ scenarioId: "open-world", seed: "seed", scenarioVersion: "1.0.0" });
  const proposal = {
    type: "MAKE_BREAKFAST",
    domain: "ordinary_world",
    idempotencyKey: "home:breakfast:1",
    expectedWorldVersion: 0,
    initialCondition: true,
    causalParents: [],
    committedEffects: [],
    provenance: { source: "virgal", type: "synthetic_world" }
  };
  const first = commitGuardedEvent(world, proposal, { route, guardianDecision: "ALLOW_SIMULATION" });
  const second = commitGuardedEvent(first.world, { ...proposal, expectedWorldVersion: 1 }, { route, guardianDecision: "ALLOW_SIMULATION" });
  assert.equal(second.committed, false);
  assert.ok(second.errors.includes("EVENT-IDEMPOTENCY-DUPLICATE"));
});

test("conflicting or missing authority owner blocks protected commit", () => {
  const world = createWorldEngine({ scenarioId: "open-world", seed: "seed", scenarioVersion: "1.0.0" });
  const clinicalRoute = { ...route, domain: "clinical", mode: "CLINICAL_GUARDED", owner: "CLINICAL_CONTROLLER", canCommit: false, requiresGuardian: true };
  const result = commitGuardedEvent(world, {
    type: "VENTILATOR_CHANGE",
    domain: "clinical",
    idempotencyKey: "clinical:vent:1",
    expectedWorldVersion: 0,
    initialCondition: true,
    causalParents: [],
    committedEffects: [],
    provenance: { source: "virgal", type: "proposal" }
  }, { route: clinicalRoute, guardianDecision: "BLOCK_UNSUPPORTED" });
  assert.equal(result.committed, false);
  assert.ok(result.errors.includes("EVENT-AUTHORITY-DENIED"));
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
node --test tests/virgal-event-contract.test.mjs
```

Expected: FAIL because `event-contract.js` and guarded world metadata are absent.

- [ ] **Step 3: Add guarded metadata to `createWorldEngine` without changing legacy semantics**

Modify `createWorldEngine` in `src/virgal/world-engine.js` to accept `scenarioVersion = "1.0.0"` and add these fields:

```js
scenarioVersion,
revision: 0,
idempotencyKeys: {},
```

Do not change existing `commitEvent`, `tickWorld`, branch or legacy tests yet.

- [ ] **Step 4: Implement `src/virgal/event-contract.js`**

Use `commitEvent` as the low-level append primitive only after guarded validation succeeds:

```js
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
```

- [ ] **Step 5: Run event-contract and legacy world tests**

Run:

```bash
node --test tests/virgal-event-contract.test.mjs tests/virgal-world.test.mjs
```

Expected: all PASS; existing world tests unchanged.

- [ ] **Step 6: Commit Task 4**

```bash
git add src/virgal/world-engine.js src/virgal/event-contract.js tests/virgal-event-contract.test.mjs
git commit -m "feat: validate guarded canonical event commits"
```

---

### Task 5: Add named deterministic streams, stochastic traces and canonical replay hashing

**Files:**
- Create: `src/virgal/determinism.js`
- Create: `tests/virgal-replay.test.mjs`
- Modify: `src/virgal/world-engine.js`

**Interfaces:**
- Produces:
  - `stableStringify(value): string`
  - `sha256Hex(text): string`
  - `deriveNamedStreamId({ rootSeed, scenarioVersion, branchId, actorId, randomnessPurpose }): string`
  - `chooseDeterministicAction({ rootSeed, scenarioVersion, branchId, actorId, randomnessPurpose, drawKey, candidates, temperature }): { selectedActionId, eligibleActionIds, trace }`
  - `hashCanonicalState(world): string`
  - `verifyRecordedStochasticTrace(trace, expected): { valid, errors }`
- Existing `chooseNpcAction(...)` remains exported as a compatibility wrapper.

- [ ] **Step 1: Write failing replay tests**

Create `tests/virgal-replay.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  chooseDeterministicAction,
  deriveNamedStreamId,
  hashCanonicalState,
  verifyRecordedStochasticTrace
} from "../src/virgal/determinism.js";
import { commitEvent, createWorldEngine, forkBranch } from "../src/virgal/world-engine.js";

const candidates = [
  { id: "rest", utility: 0.7, eligible: true },
  { id: "call", utility: 0.6, eligible: true },
  { id: "answer-for-patient", utility: 1.0, eligible: false }
];

test("REPLAY-001 identical inputs yield identical stochastic trace and state hash", () => {
  const input = {
    rootSeed: "4819",
    scenarioVersion: "1.0.0",
    branchId: "canonical",
    actorId: "family-01",
    randomnessPurpose: "ordinary-goal-tiebreak",
    drawKey: "decision-4",
    candidates
  };
  const a = chooseDeterministicAction(input);
  const b = chooseDeterministicAction(input);
  assert.deepEqual(a, b);

  let world1 = createWorldEngine({ scenarioId: "alex", seed: "4819", scenarioVersion: "1.0.0" });
  let world2 = createWorldEngine({ scenarioId: "alex", seed: "4819", scenarioVersion: "1.0.0" });
  world1 = commitEvent(world1, { type: a.selectedActionId, domain: "WORLD", payload: { trace: a.trace } });
  world2 = commitEvent(world2, { type: b.selectedActionId, domain: "WORLD", payload: { trace: b.trace } });
  assert.equal(hashCanonicalState(world1), hashCanonicalState(world2));
});

test("REPLAY-002 recorded trace validates without resampling", () => {
  const selected = chooseDeterministicAction({
    rootSeed: "4819",
    scenarioVersion: "1.0.0",
    branchId: "canonical",
    actorId: "family-01",
    randomnessPurpose: "ordinary-goal-tiebreak",
    drawKey: "decision-4",
    candidates
  });
  assert.equal(verifyRecordedStochasticTrace(selected.trace, selected.trace).valid, true);
});

test("REPLAY-003 branch fork keeps pre-fork state but changes named stream", () => {
  let world = createWorldEngine({ scenarioId: "alex", seed: "4819", branchId: "canonical", scenarioVersion: "1.0.0" });
  world = commitEvent(world, { type: "PRE_FORK", domain: "WORLD", payload: {} });
  const child = forkBranch(world, { branchId: "variant-a", seed: "9001" });
  assert.equal(child.events[0].eventHash, world.events[0].eventHash);
  const parentStream = deriveNamedStreamId({ rootSeed: world.seed, scenarioVersion: world.scenarioVersion, branchId: world.branchId, actorId: "family-01", randomnessPurpose: "ordinary-goal-tiebreak" });
  const childStream = deriveNamedStreamId({ rootSeed: child.seed, scenarioVersion: child.scenarioVersion, branchId: child.branchId, actorId: "family-01", randomnessPurpose: "ordinary-goal-tiebreak" });
  assert.notEqual(parentStream, childStream);
});
```

- [ ] **Step 2: Run replay tests and verify failure**

```bash
node --test tests/virgal-replay.test.mjs
```

Expected: FAIL because `determinism.js` does not exist.

- [ ] **Step 3: Move stable hashing and RNG primitives into `src/virgal/determinism.js`**

Move the existing stable stringify, SHA-256, seed conversion and `mulberry32` logic without changing algorithms. Export them. Add named-stream and trace helpers:

```js
export function deriveNamedStreamId({ rootSeed, scenarioVersion, branchId, actorId, randomnessPurpose }) {
  return sha256Hex([rootSeed, scenarioVersion, branchId, actorId, randomnessPurpose].join("|"));
}

export function chooseDeterministicAction({
  rootSeed,
  scenarioVersion,
  branchId,
  actorId,
  randomnessPurpose,
  drawKey,
  candidates,
  temperature = 1
}) {
  const eligible = (candidates ?? []).filter((candidate) => candidate.eligible !== false);
  const streamId = deriveNamedStreamId({ rootSeed, scenarioVersion, branchId, actorId, randomnessPurpose });
  const candidateSetHash = sha256Hex(stableStringify(eligible.map(({ id, utility }) => ({ id, utility }))));
  if (eligible.length === 0) {
    return {
      selectedActionId: null,
      eligibleActionIds: [],
      trace: {
        streamId,
        drawKey,
        drawIndex: 0,
        distributionVersion: "gumbel-max-v1",
        candidateSetHash,
        sampledResult: null
      }
    };
  }

  const random = mulberry32(seedToUint32(sha256Hex(`${streamId}|${drawKey}`)));
  let best = null;
  for (const candidate of eligible) {
    const u = Math.min(1 - Number.EPSILON, Math.max(Number.EPSILON, random()));
    const gumbel = -Math.log(-Math.log(u));
    const score = (Number(candidate.utility) || 0) / Math.max(0.01, temperature) + gumbel;
    if (!best || score > best.score) best = { id: candidate.id, score };
  }

  return {
    selectedActionId: best.id,
    eligibleActionIds: eligible.map((candidate) => candidate.id),
    trace: {
      streamId,
      drawKey,
      drawIndex: 0,
      distributionVersion: "gumbel-max-v1",
      candidateSetHash,
      sampledResult: best.id
    }
  };
}

export function hashCanonicalState(world) {
  return sha256Hex(stableStringify(world));
}

export function verifyRecordedStochasticTrace(trace, expected) {
  const errors = [];
  for (const key of ["streamId", "drawKey", "drawIndex", "distributionVersion", "candidateSetHash", "sampledResult"]) {
    if (trace?.[key] !== expected?.[key]) errors.push(`TRACE-${key}`);
  }
  return { valid: errors.length === 0, errors };
}
```

- [ ] **Step 4: Update `world-engine.js` imports and compatibility wrapper**

Import the primitives from `./determinism.js`. Keep the existing API:

```js
export function chooseNpcAction({ seed, characterId, decisionSequence, candidates, temperature = 1 }) {
  const result = chooseDeterministicAction({
    rootSeed: seed,
    scenarioVersion: "legacy",
    branchId: "legacy",
    actorId: characterId,
    randomnessPurpose: "legacy-npc-action",
    drawKey: String(decisionSequence),
    candidates,
    temperature
  });
  return {
    selectedActionId: result.selectedActionId,
    eligibleActionIds: result.eligibleActionIds,
    seedHash: result.trace.streamId,
    trace: result.trace
  };
}
```

The old test only requires reproducibility and eligible-action filtering, so this additive `trace` field must not break it.

- [ ] **Step 5: Run replay and legacy world tests**

```bash
node --test tests/virgal-replay.test.mjs tests/virgal-world.test.mjs
```

Expected: all PASS.

- [ ] **Step 6: Commit Task 5**

```bash
git add src/virgal/determinism.js src/virgal/world-engine.js tests/virgal-replay.test.mjs
git commit -m "feat: add replayable named stochastic streams"
```

---

### Task 6: Add public healthcare provenance validation and DailyMed authority boundary

**Files:**
- Create: `src/virgal/public-evidence.js`
- Create: `tests/public-evidence.test.mjs`
- Create: `tests/fixtures/dailymed/epinephrine-baxter.json`
- Modify: `tests/guardian-routing.test.mjs`

**Interfaces:**
- Produces:
  - `validatePublicEvidence(record, config): { valid, errors, runtimeUse }`
  - `canSatisfyLocalProtocolGate(record, scenarioJurisdiction): boolean`
  - `normalizePublicEvidence(record, config): object`

- [ ] **Step 1: Create the fixed DailyMed provenance fixture**

Create `tests/fixtures/dailymed/epinephrine-baxter.json`:

```json
{
  "source": "DailyMed",
  "record_id": "60efd409-3555-4182-a68d-1cd7bc0d1bfc",
  "jurisdiction": "US",
  "population_scope": "human prescription drug label",
  "version_or_revision": "13",
  "publication_or_effective_date": "2026-03-16",
  "published_date": "2026-08-21",
  "retrieved_at": "2026-09-03T08:16:00Z",
  "runtime_use": "evidence_only",
  "labeler": "Baxter Healthcare Corporation",
  "product": "Epinephrine in Sodium Chloride Injection",
  "source_type": "foreign_regulatory_label"
}
```

This fixture deliberately stores label identity/provenance only. Do not copy dose instructions into the fixture.

- [ ] **Step 2: Write failing public-evidence tests including `GATE-003`**

Create `tests/public-evidence.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  canSatisfyLocalProtocolGate,
  normalizePublicEvidence,
  validatePublicEvidence
} from "../src/virgal/public-evidence.js";

const load = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const config = load("../config/guardian_config.json");
const dailymed = load("./fixtures/dailymed/epinephrine-baxter.json");

test("DailyMed record is accepted only as evidence", () => {
  const result = validatePublicEvidence(dailymed, config);
  assert.equal(result.valid, true);
  assert.equal(result.runtimeUse, "evidence_only");
});

test("missing provenance blocks runtime calibration", () => {
  const broken = structuredClone(dailymed);
  delete broken.record_id;
  assert.equal(validatePublicEvidence(broken, config).valid, false);
});

test("GATE-003 DailyMed cannot satisfy NSW local-protocol exactness gate", () => {
  assert.equal(canSatisfyLocalProtocolGate(dailymed, "NSW"), false);
});

test("normalization cannot elevate foreign label runtime use", () => {
  const elevated = { ...dailymed, runtime_use: "clinical_order_authority" };
  const normalized = normalizePublicEvidence(elevated, config);
  assert.equal(normalized.runtime_use, "evidence_only");
});
```

- [ ] **Step 3: Run public-evidence tests and verify failure**

```bash
node --test tests/public-evidence.test.mjs
```

Expected: FAIL because module does not exist.

- [ ] **Step 4: Implement provenance validation**

Create `src/virgal/public-evidence.js`:

```js
export function validatePublicEvidence(record, config) {
  const required = config?.public_data_policy?.required_provenance ?? [];
  const errors = [];
  for (const key of required) {
    if (record?.[key] === undefined || record?.[key] === null || record?.[key] === "") errors.push(`EVIDENCE-MISSING-${key}`);
  }
  const allowed = config?.public_data_policy?.allowed_runtime_uses ?? [];
  if (!allowed.includes(record?.runtime_use)) errors.push("EVIDENCE-RUNTIME-USE-NOT-ALLOWED");
  return { valid: errors.length === 0, errors, runtimeUse: record?.runtime_use ?? null };
}

export function canSatisfyLocalProtocolGate(record, scenarioJurisdiction) {
  return record?.source_type === "local_protocol" && record?.jurisdiction === scenarioJurisdiction;
}

export function normalizePublicEvidence(record, config) {
  const next = structuredClone(record ?? {});
  if (next.source_type === "foreign_regulatory_label") {
    next.runtime_use = config?.public_data_policy?.foreign_drug_label_default_use ?? "evidence_only";
  }
  return next;
}
```

- [ ] **Step 5: Add the end-to-end DailyMed protocol-gate assertion to guardian routing**

Append to `tests/guardian-routing.test.mjs` a test that passes the DailyMed record as evidence but no local protocol and expects `HOLD_FOR_PROTOCOL` for an exact medication action. The proposal must be:

```js
{
  type: "MEDICATION_DOSE",
  domain: "high_risk_procedure",
  sourceAuthority: "CLINICAL_CONTROLLER",
  exactProcedure: true
}
```

with `localProtocol: { available: false, current: false, id: null }`. Assert `decision === "HOLD_FOR_PROTOCOL"` and `reasonCodes` contains `G-PROC-01`.

- [ ] **Step 6: Run focused tests**

```bash
node --test tests/public-evidence.test.mjs tests/guardian-routing.test.mjs
```

Expected: all PASS.

- [ ] **Step 7: Commit Task 6**

```bash
git add src/virgal/public-evidence.js tests/public-evidence.test.mjs tests/guardian-routing.test.mjs tests/fixtures/dailymed/epinephrine-baxter.json
git commit -m "feat: constrain public healthcare evidence authority"
```

---

### Task 7: Integrate guarded runtime mode and disability/AAC invariants

**Files:**
- Modify: `src/runtime.js`
- Create: `tests/disability-safety.test.mjs`

**Interfaces:**
- Preserves: `createRuntime(scenarioId)` exactly for existing callers.
- Adds: `createGuardedRuntime(scenarioId, { guardianConfig, jurisdiction, scenarioVersion, seed }): RuntimeState`.
- Guarded runtime state adds:
  - `guardian: createGuardianRuntimeContext(...)`
  - `jurisdiction`
  - `scenarioVersion`
  - `capacityStatus: "presumed"`
  - `substituteAuthority: null`
- Existing AAC clock behavior remains unchanged.

- [ ] **Step 1: Write failing disability/AAC tests**

Create `tests/disability-safety.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createGuardedRuntime,
  pauseForCommunication,
  tick
} from "../src/runtime.js";

const config = JSON.parse(readFileSync(new URL("../config/guardian_config.json", import.meta.url), "utf8"));

test("ACCESS-001 AAC composition pauses evaluation but does not change capacity or authority", () => {
  const initial = createGuardedRuntime("adult-suction", {
    guardianConfig: config,
    jurisdiction: "NSW",
    scenarioVersion: "1.0.0",
    seed: "access-test"
  });
  const composing = pauseForCommunication(initial);
  const next = tick(composing);
  assert.equal(next.evaluationSeconds, 0);
  assert.equal(next.capacityStatus, "presumed");
  assert.equal(next.substituteAuthority, null);
});

test("invalid guardian config keeps protected domains fail closed", () => {
  const invalid = structuredClone(config);
  invalid.domain_authority.clinical.owner = "VIRGAL";
  const state = createGuardedRuntime("adult-suction", {
    guardianConfig: invalid,
    jurisdiction: "NSW",
    scenarioVersion: "1.0.0",
    seed: "invalid-config"
  });
  assert.equal(state.guardian.status, "FAIL_CLOSED");
  assert.equal(state.guardian.protectedDomainWritesAllowed, false);
});

test("baseline disability does not create treatment ceiling or prognosis fields", () => {
  const state = createGuardedRuntime("adult-suction", {
    guardianConfig: config,
    jurisdiction: "NSW",
    scenarioVersion: "1.0.0",
    seed: "baseline-test"
  });
  assert.equal("treatmentCeiling" in state, false);
  assert.equal("prognosis" in state, false);
});
```

- [ ] **Step 2: Run disability-safety tests and verify failure**

```bash
node --test tests/disability-safety.test.mjs
```

Expected: FAIL because `createGuardedRuntime` does not exist.

- [ ] **Step 3: Implement `createGuardedRuntime` additively**

Modify `src/runtime.js` imports:

```js
import { createGuardianRuntimeContext } from "./virgal/guardian-config.js";
```

Add:

```js
export function createGuardedRuntime(scenarioId, {
  guardianConfig,
  jurisdiction = "NATIONAL_FALLBACK",
  scenarioVersion = "1.0.0",
  seed = `${scenarioId}:world`
} = {}) {
  const base = createRuntime(scenarioId);
  return {
    ...base,
    jurisdiction,
    scenarioVersion,
    capacityStatus: "presumed",
    substituteAuthority: null,
    guardian: createGuardianRuntimeContext(guardianConfig),
    world: createWorldEngine({
      scenarioId,
      seed,
      branchId: "canonical",
      scenarioVersion
    })
  };
}
```

Do not alter `pauseForCommunication`, `tick`, `restoreCommunication`, `commitChoice`, or current station behavior except where required to preserve the added fields through object spreads.

- [ ] **Step 4: Run disability safety and existing runtime tests together**

```bash
node --test tests/disability-safety.test.mjs tests/runtime.test.mjs
```

Expected: all PASS, including the existing AAC clock test unchanged.

- [ ] **Step 5: Commit Task 7**

```bash
git add src/runtime.js tests/disability-safety.test.mjs
git commit -m "feat: add guarded runtime disability safety context"
```

---

### Task 8: Add focused guardian test command, deterministic CI install, and operator documentation

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/test.yml`
- Modify: `README.md`

**Interfaces:**
- Produces:
  - `npm test` — full suite.
  - `npm run test:guardian` — guarded config/authority/replay/public-evidence/disability tests only.

- [ ] **Step 1: Add focused test script**

Modify `package.json` scripts to:

```json
{
  "scripts": {
    "test": "node --test tests/*.test.mjs",
    "test:guardian": "node --test tests/guardian-config.test.mjs tests/guardian-routing.test.mjs tests/virgal-event-contract.test.mjs tests/virgal-replay.test.mjs tests/public-evidence.test.mjs tests/disability-safety.test.mjs"
  }
}
```

Keep `engines.node` at `>=20`.

- [ ] **Step 2: Update GitHub Actions to perform deterministic dependency install**

Replace `.github/workflows/test.yml` with:

```yaml
name: Runtime tests

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
```

Do not introduce CircleCI in this slice because the approved spec limits CI integration to the repository's existing pipeline.

- [ ] **Step 3: Document guarded runtime and evidence boundary**

Add a README section after the Project Hope persistence section:

```markdown
## VIRGAL Hybrid Authority C guardrails

The guarded runtime is opt-in through `createGuardedRuntime(...)` and uses `config/guardian_config.json` as the authority-routing contract.

Hard boundaries:

- VIRGAL owns bounded ordinary-world scheduling, not clinical truth.
- AAC delay or access failure never creates incapacity, consent, refusal or substitute authority.
- Foreign regulatory sources such as DailyMed are evidence-only and do not satisfy NSW/Victorian local-protocol gates for exact medication or procedure logic.
- Replayable stochastic variation is limited to already-permitted world/social behavior.
- Identical scenario/seed/trace/log inputs must reproduce the same canonical state hash.

Run the focused guardian suite with:

```bash
npm run test:guardian
```
```

- [ ] **Step 4: Run the focused guardian suite**

```bash
npm run test:guardian
```

Expected: all guardian/config/routing/event/replay/evidence/disability tests PASS.

- [ ] **Step 5: Run the complete suite**

```bash
npm test
```

Expected: every test passes, including the original unchanged runtime and VIRGAL world tests.

- [ ] **Step 6: Verify the test workflow syntax by inspection and local commands**

Run:

```bash
npm ci
npm test
```

Expected: clean dependency install followed by a fully passing suite.

- [ ] **Step 7: Commit Task 8**

```bash
git add package.json package-lock.json .github/workflows/test.yml README.md
git commit -m "test: enforce guardian runtime invariants in CI"
```

---

## Final Verification Checklist

- [ ] Run `npm ci` from a clean working tree.
- [ ] Run `npm test`; all original and new tests pass.
- [ ] Run `npm run test:guardian`; all focused guardian tests pass.
- [ ] Confirm `CFG-001` through `CFG-008` each fail when their single invariant is mutated.
- [ ] Confirm `GATE-001`: family/supporter presence alone remains blocked as substitute authority.
- [ ] Confirm `GATE-002`: impaired AAC produces a communication-restoration cue without creating incapacity.
- [ ] Confirm `GATE-003`: DailyMed Baxter epinephrine fixture remains `evidence_only` and exact NSW medication logic remains `HOLD_FOR_PROTOCOL` without a current local protocol.
- [ ] Confirm `GATE-004`: Victorian exact deterioration operational logic requires current local verification.
- [ ] Confirm `WORLD-001`: bounded ordinary-world VIRGAL event can commit.
- [ ] Confirm `REL-001`: clinical-information disclosure cannot auto-commit under VIRGAL.
- [ ] Confirm `ACCESS-001`: AAC composition does not create consent/refusal/incapacity/substitute authority.
- [ ] Confirm `CLIN-001`: VIRGAL cannot write ventilator, medication or procedural state.
- [ ] Confirm identical named-stream inputs produce identical stochastic traces.
- [ ] Confirm branch fork changes branch stream identity while preserving the pre-fork event hashes.
- [ ] Confirm guarded canonical events reject duplicate idempotency keys, stale expected world versions, missing causal parents, and denied authority owners.
- [ ] Confirm no browser runtime module imports Ajv or Node `fs` APIs.
- [ ] Confirm no client UI, NetSuite, CircleCI, 3D engine, or unrelated clinical logic changes entered the diff.

## Implementation Notes for Reviewers

- Treat `commitEvent(...)` as the low-level legacy append primitive. New protected behavior should use `routeProposedAction(...)` plus `commitGuardedEvent(...)`; do not silently retrofit clinical policy into the legacy helper during this slice because the acceptance criteria require current tests to pass unchanged.
- The authority router is not a replacement for the NSW/Vic Clinical Simulation Guardian. It composes ownership and hard cross-domain rules, and it may consume a guardian result; clinical policy snapshots remain separately authoritative.
- The DailyMed fixture is intentionally metadata-only. It proves provenance and authority boundaries without importing US dose instructions into an Australian simulation.
- If implementation discovers that a spec invariant cannot be expressed in JSON Schema alone, keep the schema maximally strict and enforce the remaining invariant in `validateGuardianConfig(...)`; the test name must still remain `CFG-00X` and the fail-closed semantic validator must reject the same mutation.
- If replay/state hashing reveals non-deterministic object content such as timestamps, isolate those values from canonical hashed state rather than weakening the replay assertion.
