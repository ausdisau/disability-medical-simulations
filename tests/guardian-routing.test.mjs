import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { routeProposedAction } from "../src/virgal/authority-router.js";

const config = JSON.parse(readFileSync(new URL("../config/guardian_config.json", import.meta.url), "utf8"));

test("WORLD-001 ordinary bounded event may auto-commit under VIRGAL", () => {
  const result = routeProposedAction({ config, jurisdiction: "NSW", proposal: { type: "HOUSEHOLD_TASK", domain: "ordinary_world", sourceAuthority: "VIRGAL", consequential: true } });
  assert.equal(result.decision, "ALLOW_SIMULATION");
  assert.equal(result.owner, "VIRGAL");
  assert.equal(result.canCommit, true);
});

test("REL-001 clinical information disclosure routes through relationship/privacy owner", () => {
  const result = routeProposedAction({ config, jurisdiction: "NSW", proposal: { type: "DISCLOSE_CLINICAL_INFORMATION", domain: "relationship", sourceAuthority: "VIRGAL", consequential: true } });
  assert.equal(result.decision, "ROUTE_TO_DOMAIN_OWNER");
  assert.equal(result.owner, "RELATIONSHIP_CONTROLLER");
  assert.equal(result.canCommit, false);
});

test("GATE-001 family presence alone does not create substitute authority", () => {
  const result = routeProposedAction({ config, jurisdiction: "NSW", proposal: { type: "FAMILY_SUBSTITUTION", domain: "personhood", sourceAuthority: "VIRGAL", consequential: true }, clinicalContext: { capacityStatus: "presumed", verifiedSubstitute: false } });
  assert.equal(result.decision, "BLOCK_UNSUPPORTED");
  assert.ok(result.reasonCodes.includes("G-SDM-01"));
});

test("GATE-002 impaired AAC does not create incapacity", () => {
  const result = routeProposedAction({ config, jurisdiction: "NSW", proposal: { type: "NPC_DIALOGUE", domain: "communication_access", sourceAuthority: "ACCESS_CONTROLLER", consequential: false }, clinicalContext: { communicationAccess: "impaired", capacityStatus: "presumed" } });
  assert.notEqual(result.decision, "BLOCK_UNSUPPORTED");
  assert.ok(result.reasonCodes.includes("G-ACC-01"));
  assert.match(result.accessibleReason, /restore|communication/i);
});

test("GATE-004 Victorian exact deterioration logic requires local verification", () => {
  const result = routeProposedAction({ config, jurisdiction: "VIC", proposal: { type: "RAPID_RESPONSE", domain: "clinical", sourceAuthority: "CLINICAL_CONTROLLER", exactOperationalLogic: true }, localProtocol: { available: false, current: false, id: null } });
  assert.equal(result.decision, "EXTERNAL_VERIFICATION_REQUIRED");
  assert.ok(result.reasonCodes.includes("VIC-DTR-01"));
});

test("CLIN-001 VIRGAL cannot write clinical state", () => {
  const result = routeProposedAction({ config, jurisdiction: "NSW", proposal: { type: "VENTILATOR_CHANGE", domain: "clinical", sourceAuthority: "VIRGAL", consequential: true } });
  assert.equal(result.decision, "BLOCK_UNSUPPORTED");
  assert.equal(result.canCommit, false);
});

test("GATE-003 foreign regulatory evidence cannot unlock exact medication logic", () => {
  const result = routeProposedAction({ config, jurisdiction: "NSW", proposal: { type: "MEDICATION_DOSE", domain: "high_risk_procedure", sourceAuthority: "CLINICAL_CONTROLLER", exactProcedure: true }, localProtocol: { available: false, current: false, id: null } });
  assert.equal(result.decision, "HOLD_FOR_PROTOCOL");
  assert.ok(result.reasonCodes.includes("G-PROC-01"));
});
