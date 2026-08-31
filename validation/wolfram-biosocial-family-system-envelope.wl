(* Project Hope / Disability Medical Simulations
   Nonlinear bounded family-system validation envelope.
   Synthetic engineering model only. Not a psychological diagnosis, capacity assessment,
   legal-authority model, prognosis tool, or treatment decision system. *)

ClearAll[tr, au, cf, inf, bur, st, fields, equilibriumReport];

ModelVersion = "0.1.0-wolfram-family-envelope";

(* State interpretation, all dimensionless and bounded to [0,1]:
   tr  = network trust
   au  = autonomy support
   cf  = conflict load
   inf = information clarity
   bur = supporter/caregiver burden
   st  = crisis stress

   These are aggregate simulation constructs, not clinical or psychological measurements. *)

Parameters = <|
  "trustReliableGain" -> 0.45,
  "trustRepairGain" -> 0.35,
  "trustExclusionLoss" -> 0.65,
  "trustConflictLoss" -> 0.20,
  "autonomyDirectGain" -> 0.60,
  "autonomyRepairGain" -> 0.25,
  "autonomyOverrideLoss" -> 0.85,
  "conflictOverrideGain" -> 0.75,
  "conflictStressGain" -> 0.25,
  "conflictRepairLoss" -> 0.55,
  "conflictClarityLoss" -> 0.35,
  "clarityReliableGain" -> 0.65,
  "clarityDirectGain" -> 0.30,
  "clarityUncertaintyLoss" -> 0.70,
  "burdenOverloadGain" -> 0.55,
  "burdenStressGain" -> 0.25,
  "burdenSupportLoss" -> 0.55,
  "burdenClarityLoss" -> 0.20,
  "stressCrisisGain" -> 0.60,
  "stressUncertaintyGain" -> 0.50,
  "stressConflictGain" -> 0.25,
  "stressClarityLoss" -> 0.35,
  "stressSupportLoss" -> 0.30
|>;

(* Inputs are also normalized [0,1]:
   reliableInfo, directPatientVoice, exclusionOrOverride, repair,
   clinicalCrisis, uncertainty, roleOverload, practicalSupport. *)

fields[{reliableInfo_, directPatientVoice_, exclusionOrOverride_, repair_, clinicalCrisis_, uncertainty_, roleOverload_, practicalSupport_}] := {
  Parameters["trustReliableGain"] reliableInfo (1 - tr) +
    Parameters["trustRepairGain"] repair (1 - tr) -
    Parameters["trustExclusionLoss"] exclusionOrOverride tr -
    Parameters["trustConflictLoss"] cf tr,

  Parameters["autonomyDirectGain"] directPatientVoice (1 - au) +
    Parameters["autonomyRepairGain"] repair (1 - au) -
    Parameters["autonomyOverrideLoss"] exclusionOrOverride au,

  Parameters["conflictOverrideGain"] exclusionOrOverride (1 - cf) +
    Parameters["conflictStressGain"] st (1 - cf) -
    Parameters["conflictRepairLoss"] repair cf -
    Parameters["conflictClarityLoss"] inf cf,

  Parameters["clarityReliableGain"] reliableInfo (1 - inf) +
    Parameters["clarityDirectGain"] directPatientVoice (1 - inf) -
    Parameters["clarityUncertaintyLoss"] uncertainty inf,

  Parameters["burdenOverloadGain"] roleOverload (1 - bur) +
    Parameters["burdenStressGain"] st (1 - bur) -
    Parameters["burdenSupportLoss"] practicalSupport bur -
    Parameters["burdenClarityLoss"] inf bur,

  Parameters["stressCrisisGain"] clinicalCrisis (1 - st) +
    Parameters["stressUncertaintyGain"] uncertainty (1 - st) +
    Parameters["stressConflictGain"] cf (1 - st) -
    Parameters["stressClarityLoss"] inf st -
    Parameters["stressSupportLoss"] practicalSupport st
};

EquilibriumReport[input_List] := Module[
  {f = fields[input], vars = {tr, au, cf, inf, bur, st}, eq, rule, jac, eigs},
  eq = Quiet@NSolve[
    Join[Thread[f == 0], Thread[0 <= vars <= 1]],
    vars,
    Reals
  ];
  rule = If[Length[eq] > 0, First[eq], {}];
  jac = D[f, {vars}];
  eigs = If[rule =!= {}, N[Eigenvalues[jac /. rule]], {}];
  <|
    "equilibrium" -> rule,
    "eigenvalues" -> eigs,
    "maxRealPart" -> If[eigs =!= {}, Max[Re[eigs]], Missing["NoEquilibrium"]],
    "localAsymptoticStabilityQ" -> If[eigs =!= {}, Max[Re[eigs]] < 0, False],
    "equilibriumWithinUnitIntervalQ" -> If[
      rule =!= {},
      And @@ Thread[0 <= N[vars /. rule] <= 1],
      False
    ]
  |>
];

StableContextInputs = {.7, .8, .1, .4, .2, .2, .3, .6};
AcuteCrisisInputs = {.4, .7, .2, .2, .9, .8, .7, .4};

ValidationSummary = <|
  "ModelVersion" -> ModelVersion,
  "StableContext" -> EquilibriumReport[StableContextInputs],
  "AcuteCrisisContext" -> EquilibriumReport[AcuteCrisisInputs],
  "Interpretation" -> {
    "All aggregate states are synthetic normalized constructs, not psychological measurements.",
    "The vector field uses saturating gain/loss terms so positive inputs do not force unbounded state growth.",
    "For the documented illustrative parameter set, both representative contexts have equilibria inside the unit interval and negative Jacobian eigenvalue real parts.",
    "A stable context should converge toward higher trust/autonomy/information clarity and lower conflict/burden/stress than an acute crisis context.",
    "Numerical stability does not establish empirical validity of the coefficients."
  },
  "RightsInvariants" -> {
    "Autonomy support is a social/access state, not a capacity score.",
    "Clinical crisis may increase modeled stress but never creates substitute authority or a treatment ceiling.",
    "Communication difficulty is modeled as an access/information problem before any separate decision-specific capacity assessment.",
    "Family conflict is repairable state and is never treated as evidence that the patient's life is less valuable."
  }
|>;

ValidationSummary

(* Expected illustrative output from the parameter set above:
   StableContext equilibrium approximately:
     tr=.7988, au=.8722, cf=.2480, inf=.8323, bur=.3425, st=.3743
     maximum real eigenvalue approximately -0.5412

   AcuteCrisisContext equilibrium approximately:
     tr=.5073, au=.7344, cf=.5638, inf=.4563, bur=.6522, st=.7944
     maximum real eigenvalue approximately -0.4928

   Re-run in Wolfram after any coefficient change. *)
