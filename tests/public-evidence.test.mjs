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
