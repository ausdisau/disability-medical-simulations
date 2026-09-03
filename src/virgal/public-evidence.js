export function validatePublicEvidence(record, config) {
  const required = config?.public_data_policy?.required_provenance ?? [];
  const errors = [];
  for (const key of required) {
    if (record?.[key] === undefined || record?.[key] === null || record?.[key] === "") {
      errors.push(`EVIDENCE-MISSING-${key}`);
    }
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
