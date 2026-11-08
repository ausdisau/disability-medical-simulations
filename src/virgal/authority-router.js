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

function hasVerifiedExactProtocol(localProtocol, jurisdiction, proposal) {
  return localProtocol?.available === true &&
    localProtocol?.current === true &&
    localProtocol?.authoritative === true &&
    Boolean(localProtocol?.id) &&
    Boolean(localProtocol?.version) &&
    localProtocol?.jurisdiction === jurisdiction &&
    proposal?.proceduralTrainingScope === true;
}

function hasVerifiedOperationalProtocol(localProtocol, jurisdiction) {
  return localProtocol?.available === true &&
    localProtocol?.current === true &&
    localProtocol?.authoritative === true &&
    Boolean(localProtocol?.id) &&
    Boolean(localProtocol?.version) &&
    localProtocol?.jurisdiction === jurisdiction;
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
    if (!hasVerifiedExactProtocol(localProtocol, jurisdiction, proposal)) {
      return {
        ...result,
        decision: "HOLD_FOR_PROTOCOL",
        reasonCodes: ["G-PROC-01"],
        accessibleReason: "Exact high-risk procedural content requires a current authoritative local protocol with identifier, version, matching jurisdiction, and explicit procedural-training scope."
      };
    }
  }

  if (jurisdiction === "VIC" && proposal?.exactOperationalLogic === true && ["RAPID_RESPONSE", "CLINICAL_REVIEW", "CODE_BLUE"].includes(proposal?.type)) {
    if (!hasVerifiedOperationalProtocol(localProtocol, jurisdiction)) {
      return {
        ...result,
        decision: "EXTERNAL_VERIFICATION_REQUIRED",
        reasonCodes: ["VIC-DTR-01"],
        accessibleReason: "Use the current local Victorian health-service recognition and response procedure for exact operational logic."
      };
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
