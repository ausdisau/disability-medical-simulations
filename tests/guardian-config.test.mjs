import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createGuardianRuntimeContext,
  validateGuardianConfig
} from "../src/virgal/guardian-config.js";

const loadJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const canonical = loadJson("../config/guardian_config.json");
const schema = loadJson("../config/guardian_config.schema.json");
const clone = (value) => structuredClone(value);

function expectRejected(mutator, id) {
  const candidate = clone(canonical);
  mutator(candidate);
  const result = validateGuardianConfig(candidate);
  assert.equal(result.valid, false, `${id} must be rejected`);
  assert.ok(result.errors.includes(id));
}

test("guardian schema is Draft 2020-12 and locks Hybrid Authority profile", () => {
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.properties.profile.const, "VIRGAL_HYBRID_AUTHORITY_C");
  assert.equal(schema.properties.authority_model.properties.mode.const, "HYBRID");
});

test("canonical guardian config validates", () => {
  assert.deepEqual(validateGuardianConfig(canonical), { valid: true, errors: [] });
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
  expectRejected((c) => { c.accessibility.aac_delay_may_not_trigger = ["incapacity"]; }, "CFG-007");
});

test("CFG-008 foreign regulatory labels cannot satisfy local protocol", () => {
  expectRejected((c) => {
    c.procedural_exactness.foreign_regulatory_label_satisfies_local_protocol_gate = true;
  }, "CFG-008");
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
