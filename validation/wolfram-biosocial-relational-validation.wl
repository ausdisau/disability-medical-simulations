(* Project Hope / Disability Medical Simulations
   Wolfram validation harness for the biosocial family relational substrate.
   All values are synthetic normalized states in [0,1].
   This is not a psychological diagnostic model, capacity assessment, legal-authority model,
   prognosis tool, or treatment decision system. *)

ClearAll[Clip01, NormalizeRows, LinearStressCore, StressStep, TrustStep, BoundCheck];

ModelVersion = "0.1.0-wolfram-biosocial";

Clip01[x_] := Min[1., Max[0., N[x]]];
NormalizeRows[m_] := Map[If[Total[#] > 0, #/Total[#], #] &, N[m]];

(* Nodes: patient, mother, friend, nurse, consultant. These weights are illustrative only. *)
InfluenceMatrix = NormalizeRows[{
  {0., .25, .15, .35, .25},
  {.30, 0., .10, .30, .30},
  {.25, .25, 0., .25, .25},
  {.25, .20, .10, 0., .45},
  {.20, .20, .10, .50, 0.}
}];

Dt = .25;
StressRecovery = .55;
StressContagion = .20;

LinearStressCore[dt_: Dt, recovery_: StressRecovery, contagion_: StressContagion] :=
  (1 - dt recovery) IdentityMatrix[Length[InfluenceMatrix]] + dt contagion InfluenceMatrix;

LinearCore = LinearStressCore[];
LinearEigenvalues = Eigenvalues[N[LinearCore]];
LinearSpectralRadius = Max[Abs[LinearEigenvalues]];

StressStep[s_List, threat_List, supportBuffer_List,
  dt_: Dt, recovery_: StressRecovery, contagion_: StressContagion] :=
 Map[Clip01,
  s + dt (threat + contagion InfluenceMatrix.s - recovery s - supportBuffer)
 ];

TrustStep[trust_, directVoice_, boundaryRespect_, boundaryViolation_, communicationReliability_, dt_: Dt] :=
 Clip01[
  trust + dt (
    .22 directVoice + .18 boundaryRespect - .30 boundaryViolation - .20 (1 - communicationReliability)
  )
 ];

StressInitial = {.35, .55, .25, .30, .25};
AcuteThreat = {.70, .60, .20, .55, .45};
SupportBuffer = {.10, .05, .10, .08, .08};
StressAfterAcuteThreat = StressStep[StressInitial, AcuteThreat, SupportBuffer];
StressAfterCalm = Nest[
  StressStep[#, ConstantArray[0., Length[#]], SupportBuffer] &,
  StressAfterAcuteThreat,
  20
];

MotherPatientTrustStart = .62;
TrustAfterPrivateBoundaryRespected = Nest[
  TrustStep[#, 1., 1., 0., .95] &,
  MotherPatientTrustStart,
  4
];
TrustAfterBoundaryOverride = Nest[
  TrustStep[#, 0., 0., 1., .65] &,
  MotherPatientTrustStart,
  4
];

BoundCheck[x_] := And @@ Thread[0 <= N[Flatten[{x}]] <= 1];

ValidationSummary = <|
  "ModelVersion" -> ModelVersion,
  "InfluenceMatrixRowSums" -> Total[InfluenceMatrix, {2}],
  "LinearizedEigenvalues" -> LinearEigenvalues,
  "LinearSpectralRadius" -> LinearSpectralRadius,
  "StableLinearCoreQ" -> (LinearSpectralRadius < 1),
  "StressInitial" -> StressInitial,
  "StressAfterAcuteThreat" -> StressAfterAcuteThreat,
  "StressAfterCalm" -> StressAfterCalm,
  "MotherPatientTrustStart" -> MotherPatientTrustStart,
  "TrustAfterPrivateBoundaryRespected" -> TrustAfterPrivateBoundaryRespected,
  "TrustAfterBoundaryOverride" -> TrustAfterBoundaryOverride,
  "AllReportedStatesBoundedQ" -> BoundCheck[{
    StressInitial,
    StressAfterAcuteThreat,
    StressAfterCalm,
    MotherPatientTrustStart,
    TrustAfterPrivateBoundaryRespected,
    TrustAfterBoundaryOverride
  }],
  "Interpretation" -> {
    "The representative normalized social-influence matrix has row sums of 1.",
    "For the illustrative dt/recovery/contagion choice, the linearized stress core has spectral radius below 1.",
    "An acute threat raises stress in the synthetic example; a calm/supportive period allows recovery.",
    "Boundary-respecting direct patient voice can be represented as a trust-repair input, while an authored boundary violation can erode trust.",
    "These dynamics demonstrate numerical coherence only; they are not empirical family-psychology coefficients."
  },
  "RightsInvariants" -> {
    "Family presence never creates legal authority.",
    "Communication access failure never creates incapacity.",
    "Stress or conflict never creates treatment futility.",
    "Role-play free text is not permitted to mutate deterministic state directly."
  }
|>;

ValidationSummary

(* Optional parameter sweep for engineering stability exploration. *)
StabilitySweep = Flatten@Table[
  With[{a = LinearStressCore[dt, recovery, contagion]},
    <|
      "dt" -> dt,
      "recovery" -> recovery,
      "contagion" -> contagion,
      "spectralRadius" -> Max[Abs[Eigenvalues[N[a]]]],
      "stableLinearCoreQ" -> (Max[Abs[Eigenvalues[N[a]]]] < 1)
    |>
  ],
  {dt, {.1, .25, .5, 1.}},
  {recovery, {.2, .4, .55, .8}},
  {contagion, {.05, .1, .2, .35}}
];

(* Export examples:
   Export["biosocial-validation-summary.json", ValidationSummary, "RawJSON"];
   Export["biosocial-stability-sweep.json", StabilitySweep, "RawJSON"];
*)
