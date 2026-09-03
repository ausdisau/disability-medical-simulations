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
