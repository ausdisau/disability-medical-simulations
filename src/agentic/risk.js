export const RISK_DIMENSIONS = [
  "clinicalSafety",
  "consentAndAutonomy",
  "communicationAccess",
  "privacyAndDataProtection",
  "reversibility",
  "provenanceAndEvidence",
  "simulationIntegrity",
  "fairnessAndDisabilityBias",
  "operationalReliability",
  "cascadingImpact"
];

export const DEFAULT_WEIGHTS = Object.freeze({
  clinicalSafety: 1.5,
  consentAndAutonomy: 1.4,
  communicationAccess: 1.4,
  privacyAndDataProtection: 1,
  reversibility: 1.1,
  provenanceAndEvidence: 1,
  simulationIntegrity: 1.4,
  fairnessAndDisabilityBias: 1.3,
  operationalReliability: 1,
  cascadingImpact: 1
});

export function normaliseDimension(input = {}, weights = DEFAULT_WEIGHTS) {
  return Object.fromEntries(RISK_DIMENSIONS.map((dimension) => {
    const value = input[dimension] ?? {};
    return [dimension, {
      score: Math.max(0, Math.min(1, Number(value.score ?? 0))),
      weight: Number(value.weight ?? weights[dimension] ?? 1),
      rationale: value.rationale ?? "No elevated risk identified.",
      mitigationIds: [...(value.mitigationIds ?? [])]
    }];
  }));
}

export function calculateRiskProfile(input, weights = DEFAULT_WEIGHTS) {
  const dimensions = normaliseDimension(input, weights);
  const rows = Object.entries(dimensions);
  const totalWeight = rows.reduce((sum, [, value]) => sum + value.weight, 0);
  const rawGamma = rows.reduce((sum, [, value]) => sum + value.weight * value.score, 0);
  const weightedMean = totalWeight === 0 ? 0 : rawGamma / totalWeight;
  const weightedVariance = totalWeight === 0 ? 0 : rows.reduce(
    (sum, [, value]) => sum + value.weight * Math.pow(value.score - weightedMean, 2),
    0
  ) / totalWeight;
  const normalisedGamma = totalWeight === 0 ? 0 : 100 * rawGamma / totalWeight;
  const concentration = Math.min(100, 200 * Math.sqrt(weightedVariance));
  const topDimensions = rows
    .map(([id, value]) => ({ id, contribution: value.weight * value.score, ...value }))
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3);

  return {
    dimensions,
    totalWeight,
    rawGamma,
    normalisedGamma,
    weightedVariance,
    concentration,
    label: normalisedGamma < 30 ? "low" : normalisedGamma < 60 ? "medium" : "high",
    topDimensions
  };
}
