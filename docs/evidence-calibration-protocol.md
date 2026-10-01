# Evidence-Calibrated Cardiorespiratory Validation Protocol

Status: **research/simulation engineering only**  
Branch: `feature/cardiorespiratory-biomedical-model`  
Model family: Project Hope / Disability Medical Simulations

## Purpose

This protocol turns the current artificial-ventilation/cardiovascular model into a staged validation program rather than treating a visually plausible simulation as physiological truth.

The design keeps four things separate:

1. **physiology** — deterministic equations and state transitions;
2. **scenario authorship** — when a PEA/asystole/ROSC event is committed;
3. **patient authority and communication access** — never inferred from physiology;
4. **clinical use** — prohibited until separate clinical validation/governance exists.

## Evidence packet

### Clinical / physiological evidence

| Source | Access | Supported use here | Limitation |
|---|---|---|---|
| Pinsky MR. *Heart-lung interactions during mechanical ventilation: the basics.* Ann Transl Med. 2018. PMID 30370276; PMCID PMC6186561. | ABSTRACT_INSPECTED | Positive-pressure ventilation changes intrathoracic pressure, venous return, RV/LV loading and cardiac output; hypovolaemia magnifies haemodynamic effects. | Review-level physiology; does not identify a universal numeric coupling coefficient. |
| Mahmood SS et al. *Respiratory-Cardiovascular Interactions During Mechanical Ventilation: Physiology and Clinical Implications.* Compr Physiol. 2022. PMID 35578946. | ABSTRACT_INSPECTED | PEEP/positive pressure can reduce preload and cardiac output while effects depend on tidal volume, PEEP, lung/chest-wall compliance, volume status and ventricular function. | Does not justify a single fixed pressure-to-output function. |
| Hardman JG et al. *A physiology simulator: validation of its respiratory components and its ability to predict the patient's response to changes in mechanical ventilation.* Br J Anaesth. 1998. PMID 9861113. | ABSTRACT_INSPECTED | Simulator validation can compare predicted PaO2/PaCO2/pH responses against measured responses after ventilation changes. Useful reference inputs included shunt, dead-space fraction, VO2, RQ, CO, FiO2, minute ventilation, Hb, temperature and base excess. | Older simulator; clinical context and model architecture differ from Project Hope. |
| Webb JB et al. *Parameterization of Respiratory Physiology and Pathophysiology for Real-Time Simulation.* EMBC 2020. PMID 33018461. | ABSTRACT_INSPECTED | Supports parameterising lung volumes, compliance and resistance and validating pressures, flows, volumes and substance outputs. | Pulse-specific implementation. |
| Webb JB et al. *Implementation of a Dynamic and Extensible Mechanical Ventilator Model for Real-Time Physiological Simulation.* ANNSIM 2022. PMID 37250852; PMCID PMC10224749. | FULL_TEXT_AVAILABLE / ABSTRACT_AND_METHODS_INSPECTED | Pulse ventilator implementation is suitable as a higher-detail comparison target and has been compared with physical lung-simulator/ventilator setups. | Pulse is still a model; agreement with Pulse is not human clinical validation. |
| van Oostrom JH, Wehry H. *Verification and validation of physiology simulators.* EMBC 2015. PMID 26738102. | ABSTRACT_INSPECTED | Supports explicit verification/validation rather than informal visual plausibility. | Abstract inspected only. |
| Cheng L et al. *An integrated mathematical model of the human cardiopulmonary system: model validation under hypercapnia and hypoxia.* AJP Heart Circ Physiol. 2016. PMID 26747507. | ABSTRACT_INSPECTED | Supports validating abnormal dynamic responses over perturbation ranges and using sensitivity analysis, not only one steady-state endpoint. | Population-average validation rather than individual prediction. |
| Pruett WA et al. *Physiological Modeling and Simulation—Validation, Credibility, and Application.* Annu Rev Biomed Eng. 2020. PMID 32501771. | ABSTRACT_INSPECTED | Supports treating model credibility as application-specific rather than declaring a model generically “valid.” | Review; does not supply Project Hope parameter values. |

### Disability / baseline / access evidence

Use `Project_Hope_Patient_Perspective_Provenance_v0.5.json` as the disability-specific provenance layer. Its supported rules include:

- adult cerebral-palsy respiratory illness is plausible at population level;
- resting oxygenation must not be inferred from motor severity;
- eating/drinking/swallowing ability is individualised;
- silent aspiration is possible but not the default explanation;
- positioning may matter but fixed oxygenation gains must not be invented;
- direct communication and supporter assistance can coexist without transferring decision authority;
- population mortality evidence must not become individual prognosis or treatment ceilings.

These rules constrain scenario construction; they do **not** provide numerical cardiorespiratory coefficients.

### JSTOR / disability-studies context

| Source | Access | Role in this protocol | Limitation |
|---|---|---|---|
| Monteleone R. *The Double Bind of Disability: How Medical Technology Shapes Bodily Authority.* University of Minnesota Press, 2025. JSTOR stable 10.5749/jj.28414746. | METADATA/PUBLISHER_DESCRIPTION_INSPECTED | Rights-design warning: medical technology should not displace lived experience or bodily authority. | Publisher description, not full-text evidentiary inspection. |
| Morris J. *Impairment and Disability: Constructing an Ethics of Care That Promotes Human Rights.* Hypatia 16(4), 2001. JSTOR 3810780. | METADATA_ONLY | Candidate ethics framework for keeping care/support and human rights together. | Full argument not inspected here. |
| *Giving voice or making voice?: The principle of autonomy and everyday patient values in care for people with learning disabilities.* In *Reinventing the Good Life*, 2023. JSTOR jj.16430724.10. | METADATA_ONLY | Candidate debrief source for distinguishing supporting a person's expression from manufacturing a voice for them. | Full argument not inspected here; title/metadata must not be over-interpreted. |

## Calibration decision 1 — reference equilibrium first

The current Wolfram review identified that nominal positive-pressure ventilation drifts a synthetic baseline from CO 5 L/min and MAP 90 mmHg toward lower values even when that ventilated condition is supposed to be the reference state.

### Required invariant

A declared **reference state must be a fixed point of its own reference inputs**.

Recommended implementation concept:

```text
referenceMeanAirwayPressure = mean airway pressure at baseline/reference ventilation

DeltaPaw = currentMeanAirwayPressure - referenceMeanAirwayPressure
DeltaPith = pressureCoupling(DeltaPaw, lung/chest-wall state, volume state)
```

This is an engineering calibration rule, not a clinical treatment rule.

Do **not** apply the full absolute mean airway pressure as a new perturbation when the supplied baseline haemodynamics already describe a patient under that same positive-pressure state.

### Internal acceptance test

At reference ventilation + reference cardiovascular inputs:

- PaCO2, PaO2, CO and MAP should remain at their declared reference values to numerical tolerance;
- no event state should be generated;
- no disability field should participate in the equilibrium solution.

This verifies internal consistency only.

## Calibration decision 2 — replace one gas-exchange “efficiency” knob with interpretable components

The current `gasExchangeEfficiency` scalar is useful for a prototype but conflates several mechanisms.

Evidence-informed next representation:

```text
respiratory mechanics
  compliance
  airway resistance
  dead-space fraction

pulmonary gas exchange
  shunt fraction
  diffusion / V-Q impairment term

metabolism / transport
  VO2
  VCO2 or RQ
  haemoglobin
  cardiac output
```

Hardman et al. provides precedent for validating PaO2/PaCO2 response using shunt, physiological dead space, VO2/RQ, cardiac output, FiO2, ventilation and Hb. Pulse provides a practical whole-body reference implementation for compliance/resistance and ventilator interaction.

## Calibration decision 3 — remove the brittle venous-return discontinuity before claiming high fidelity

The current prototype uses a clipped linear relationship similar to:

```text
VR = max(0, (Pms - Pra) / Rvenous)
```

The Wolfram harness showed a sharp transition to zero flow in the synthetic shock case.

For the next version:

- retain the physiological direction of the pressure gradient;
- parameterise volume status explicitly;
- represent vascular collapse/flow limitation with a continuous model or a documented piecewise Starling-resistor model;
- validate the transition region against a higher-detail reference before using it to drive learner-facing shock transitions.

The literature supports complex dependence on volume status, lung volume, right-heart function and pressures; it does **not** support choosing an arbitrary smoothing coefficient and calling it clinical truth.

## Seven matched validation scenarios

Each scenario must begin from a documented reference state and must expose the same observable variables in Project Hope and Pulse.

### S1 — Reference artificial ventilation

Purpose: prove fixed-point equilibrium.

Expected logic:
- reference ventilator state;
- reference volume/vasomotor/contractility state;
- sinus rhythm;
- no meaningful drift in CO, MAP, gases.

This is a **verification** case before external validation.

### S2 — Gas-exchange failure

Purpose: isolate oxygenation failure without pretending it automatically causes arrest.

Perturbation:
- reduce V/Q/diffusion performance or increase shunt in a controlled sweep;
- maintain the same ventilator mechanics initially.

Compare:
- PaO2;
- PaCO2;
- SpO2;
- oxygen content;
- oxygen delivery;
- time constants / time-to-threshold.

Scenario translation: severe pneumonia may supply the narrative cause, but cerebral palsy does not.

### S3 — Increased airway pressure / cardiopulmonary interaction

Purpose: quantify pressure-mediated haemodynamic effects.

Perturbation:
- change mean airway pressure relative to the reference state;
- sweep across at least two volume states rather than assuming one universal response.

Compare:
- right-atrial pressure or closest available analogue;
- venous return/preload proxy;
- stroke volume;
- cardiac output;
- MAP;
- oxygen delivery.

### S4 — Shock

Purpose: validate a progressive low-perfusion state without a hidden automatic arrest threshold.

Perturbation:
- volume state and/or vasomotor state according to the authored shock mechanism;
- no PEA/asystole unless the scenario controller explicitly commits that event.

Compare:
- CO;
- MAP;
- systemic flow;
- oxygen delivery;
- trend shape.

### S5 — PEA

Purpose: verify electrical/mechanical decoupling.

Invariant:
- electrical activity may persist;
- native mechanical cardiac output is zero by authored event state;
- shockability is not inferred by the physiology model;
- no ceiling-of-care decision is generated.

### S6 — CPR / external perfusion

Purpose: verify that externally generated perfusion is not falsely labelled native cardiac output.

Invariant:

```text
nativeCardiacOutput = 0 during PEA/asystole
externalPerfusion > 0 when the scenario supplies it
effectiveSystemicFlow = native + external
```

Compare:
- effective systemic flow;
- MAP or pressure proxy;
- oxygen delivery;
- gas trends where Pulse exposes them.

Do not use this validation model to prescribe CPR technique.

### S7 — Post-ROSC

Purpose: verify explicit transition from arrest into unstable spontaneous circulation.

Inputs must be authored rather than invented:
- rhythm/electrical rate;
- contractility;
- volume/vasomotor state;
- ventilation state.

Compare:
- CO;
- MAP;
- PaO2/PaCO2;
- oxygen delivery;
- time to new equilibrium.

ROSC is not recovery, and the model must not infer neurological prognosis.

## Pulse comparison contract

Export matched time-series data at a common sampling interval:

```text
timeSeconds
scenarioId
rhythm
PaO2MmHg
PaCO2MmHg
SpO2Fraction
meanArterialPressureMmHg
nativeCardiacOutputLMin
effectiveSystemicFlowLMin
venousReturnOrPreloadProxy
oxygenDeliveryMlMin
meanAirwayPressureCmH2O
```

For each variable calculate:

- MAE;
- RMSE;
- normalized RMSE;
- steady-state bias;
- peak/maximum absolute deviation;
- sign/direction-of-change agreement;
- time-to-threshold difference where a threshold is part of the authored test;
- event-state agreement for PEA/asystole/ROSC.

Do not invent universal pass/fail cutoffs before the benchmark distribution is available. Set tolerances per variable and intended educational use after reference traces are inspected.

## Validation ladder

Use a credibility ladder rather than one binary “validated” flag:

1. **unit verification** — equations, units, fixed-point reference state, event invariants;
2. **Wolfram analytic verification** — sensitivities, stability and parameter sweeps;
3. **Pulse cross-model comparison** — matched synthetic scenarios;
4. **bench/hybrid comparison** — ventilator/physical lung simulator where feasible;
5. **published clinical-data comparison** — de-identified aggregate/reference datasets appropriate to the variable;
6. **clinical expert review**;
7. **paid lived-experience/disability review** for representation, access and patient-authority behavior.

A higher rung does not erase the limits of the lower-level model.

## Disability and autonomy invariants

The biomedical engine must never use these as causal physiology inputs unless a separately validated, individualised clinical variable is explicitly supplied:

- cerebral palsy diagnosis/severity;
- AAC use;
- dysarthria;
- wheelchair use;
- amount of personal assistance;
- support-person presence;
- clinician rating of “quality of life.”

The simulation controller must preserve:

- patient communication access when clinically feasible;
- direct address to the patient;
- decision-specific capacity assessment rather than diagnosis-based assumptions;
- patient values/goals as a separate state from physiological severity;
- family/supporter presence as `support_available`, not automatic substitute authority;
- emergency treatment as an ordinary clinical emergency pathway, never research-consent bypass.

## Governance boundary

Current work is synthetic educational simulation research. It may proceed without a human-subject branch.

Before any human-data calibration, prospective study, autonomous clinical decision support, patient-specific digital twin, or treatment/device-control use:

- obtain the appropriate research/clinical governance review;
- verify consent/authority and data provenance;
- establish privacy/de-identification controls;
- perform separate clinical validation;
- re-run the patient-autonomy/rights gate.
