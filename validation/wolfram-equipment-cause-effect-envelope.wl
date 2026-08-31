(*
  Project Hope equipment cause/effect synthetic validation harness.

  This is an engineering model for bounded causal visualization only.
  Coefficients are synthetic and must not be interpreted as clinical treatment
  effect sizes, prognosis, or patient-specific prediction.
*)

ClearAll[step, clip, x0, gates, scenarios, keys];

keys = {
  "oxygenationReserve",
  "ventilationReserve",
  "airwayPatency",
  "secretionBurden",
  "workOfBreathing",
  "hemodynamicReserve",
  "postureSupport",
  "aacAccess",
  "signalReliability"
};

clip[z_] := Clip[N[z], {0., 1.}];

x0 = AssociationThread[keys -> {
  0.46, 0.34, 0.90, 0.35, 0.78, 0.42, 0.60, 0.92, 0.88
}];

gates = <|
  "oxygenIndicated" -> 1.,
  "secretionsEvidence" -> 0.,
  "ventilationFailure" -> 0.,
  "shockableArrest" -> 0.,
  "positioningCompatible" -> 1.,
  "aacObstructed" -> 1.
|>;

step[x_Association, u_Association, g_Association] := Module[
  {ox, vent, suction, rep, defib, aac, vals},

  ox = u["oxygen"] g["oxygenIndicated"];
  vent = u["manualVentilation"] g["ventilationFailure"];
  suction = u["suction"] g["secretionsEvidence"];
  rep = u["reposition"] g["positioningCompatible"];
  defib = u["defib"] g["shockableArrest"];
  aac = u["aacRestore"] g["aacObstructed"];

  vals = {
    clip[x["oxygenationReserve"] + 0.10 ox + 0.03 vent + 0.02 rep - 0.04 x["workOfBreathing"]],
    clip[x["ventilationReserve"] + 0.16 vent + 0.04 rep - 0.03 x["workOfBreathing"]],
    clip[x["airwayPatency"] + 0.10 suction - 0.02 x["secretionBurden"]],
    clip[x["secretionBurden"] - 0.14 suction + 0.01 x["secretionBurden"]],
    clip[x["workOfBreathing"] - 0.12 vent - 0.07 rep + 0.03 x["secretionBurden"]],
    clip[x["hemodynamicReserve"] + 0.04 defib - 0.02 x["workOfBreathing"]],
    clip[x["postureSupport"] + 0.12 rep],
    clip[x["aacAccess"] + 0.08 aac + 0.03 rep],
    clip[x["signalReliability"] - 0.03 u["suction"] (1 - g["secretionsEvidence"]) -
      0.04 u["defib"] (1 - g["shockableArrest"])]
  };

  AssociationThread[keys -> vals]
];

scenarios = <|
  "baseline" -> <|
    "oxygen" -> 0., "suction" -> 0., "manualVentilation" -> 0.,
    "reposition" -> 0., "defib" -> 0., "aacRestore" -> 0.
  |>,
  "oxygen" -> <|
    "oxygen" -> 1., "suction" -> 0., "manualVentilation" -> 0.,
    "reposition" -> 0., "defib" -> 0., "aacRestore" -> 0.
  |>,
  "suctionWithoutGate" -> <|
    "oxygen" -> 0., "suction" -> 1., "manualVentilation" -> 0.,
    "reposition" -> 0., "defib" -> 0., "aacRestore" -> 0.
  |>,
  "manualVentWithoutGate" -> <|
    "oxygen" -> 0., "suction" -> 0., "manualVentilation" -> 1.,
    "reposition" -> 0., "defib" -> 0., "aacRestore" -> 0.
  |>,
  "repositionAndAAC" -> <|
    "oxygen" -> 0., "suction" -> 0., "manualVentilation" -> 0.,
    "reposition" -> 1., "defib" -> 0., "aacRestore" -> 1.
  |>,
  "defibNonShockable" -> <|
    "oxygen" -> 0., "suction" -> 0., "manualVentilation" -> 0.,
    "reposition" -> 0., "defib" -> 1., "aacRestore" -> 0.
  |>
|>;

results = AssociationThread[
  Keys[scenarios] -> (step[x0, #, gates] & /@ Values[scenarios])
];

allBounded = And @@ Flatten[
  (Map[0. <= # <= 1. &, Values[#]] & /@ Values[results])
];

summary = AssociationThread[
  Keys[results] -> (KeyTake[#, {
    "oxygenationReserve",
    "ventilationReserve",
    "workOfBreathing",
    "postureSupport",
    "aacAccess",
    "signalReliability"
  }] & /@ Values[results])
];

validation = <|
  "Initial" -> x0,
  "OneStepSummary" -> summary,
  "AllBounded" -> allBounded,
  "ExpectedProperties" -> <|
    "oxygenAffectsOxygenationNotVentilationDirectly" ->
      results["oxygen"]["oxygenationReserve"] > results["baseline"]["oxygenationReserve"] &&
      results["oxygen"]["ventilationReserve"] == results["baseline"]["ventilationReserve"],

    "suctionBenefitBlockedWithoutSecretionsGate" ->
      results["suctionWithoutGate"]["airwayPatency"] == results["baseline"]["airwayPatency"],

    "manualVentilationBenefitBlockedWithoutVentilationFailureGate" ->
      results["manualVentWithoutGate"]["ventilationReserve"] == results["baseline"]["ventilationReserve"],

    "repositioningCanImproveSyntheticPostureAndAccess" ->
      results["repositionAndAAC"]["postureSupport"] > results["baseline"]["postureSupport"] &&
      results["repositionAndAAC"]["aacAccess"] >= results["baseline"]["aacAccess"],

    "nonShockableDefibHasNoSyntheticHemodynamicBenefit" ->
      results["defibNonShockable"]["hemodynamicReserve"] == results["baseline"]["hemodynamicReserve"]
  |>
|>;

validation
