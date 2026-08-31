# Biomedical Cardiorespiratory Model v0.1

Educational simulation model for coupling artificial ventilation, gas exchange, venous return, cardiac output, arterial pressure, oxygen delivery, PEA/asystole, and post-ROSC states.

## Scope

This model is designed for deterministic simulation state inside Disability Medical Simulations / Project Hope. It is not a bedside calculator, ventilator controller, medication engine, prognostic instrument, or clinical decision-maker.

The runtime keeps five concerns separate:

1. scenario definition and patient baseline;
2. deterministic physiology;
3. discrete cardiovascular events;
4. communication/access state;
5. provenance and audit.

## Respiratory mechanics and gas exchange

The model calculates effective alveolar ventilation from respiratory rate, tidal volume, dead space, and a circuit-patency factor:

`VA = RR * max(VT - VD, 0) * circuitPatency`

PaCO2 moves toward a target inversely related to alveolar ventilation:

`targetPaCO2 = baselinePaCO2 * metabolicCO2Relative * baselineVA / max(VA, epsilon)`

Alveolar oxygen is approximated with a simplified alveolar-gas relationship:

`PAO2 = FiO2 * (PB - PH2O) - targetPaCO2 / RQ`

A scenario-defined `gasExchangeEfficiency` factor represents aggregate shunt/V-Q/diffusion impairment without pretending to be a full lung model. PaO2 and PaCO2 approach their targets using separate first-order time constants.

## Ventilation-circulation coupling

Mean airway pressure is represented as:

`meanAirwayPressure = PEEP + inspiratoryPressureAbovePEEP * inspiratoryDutyFraction`

A configurable coupling coefficient maps mean airway pressure to an intrathoracic-pressure increment. Right atrial pressure then rises with intrathoracic pressure, and venous return follows a Guyton-style pressure-gradient relationship:

`VR = max(0, (Pms - Pra) / Rvr)`

This intentionally makes increased positive intrathoracic pressure capable of reducing venous return/preload in the simulation.

Wolfram symbolic verification confirmed that, for positive coupling and venous resistance,

`d(VR)/d(Pith) = -kPith/Rvr < 0`.

## Cardiac output and arterial pressure

Preload is derived from venous return relative to the supplied patient baseline. A simplified Frank-Starling-style relationship modifies baseline stroke volume with preload, contractility, and afterload factors.

`CO = HR * SV / 1000`

`MAP_target = Pra + effectiveSystemicFlow * SVR`

MAP approaches its target with a configurable first-order time constant.

External perfusion is a separate input so CPR or mechanical-circulatory-support effects can be represented without falsely labeling them as native cardiac output.

## Oxygen transport

Arterial oxygen content is estimated from haemoglobin, oxygen saturation, and dissolved oxygen:

`CaO2 = 1.34 * Hb * SaO2 + 0.003 * PaO2`

Oxygen delivery is:

`DO2 = effectiveSystemicFlow * 10 * CaO2`

The engine tracks a dimensionless oxygen-debt index from delivery relative to the patient's reference baseline. This is a simulation trend variable only; it is not a validated prognostic score.

## Cardiovascular event states

Discrete events are explicit scenario-engine actions rather than hidden thresholds:

- `PEA`: electrical activity may remain, native mechanical output is zero.
- `ASYSTOLE`: electrical rate and native mechanical output are zero.
- `ROSC`: requires scenario-provided electrical rate and contractility; the biomedical engine does not invent recovery physiology.
- `SINUS`: restores an ordinary native rhythm state from explicit inputs/default baseline.

This separation allows a scenario to model hypoxaemia, hypercapnia, shock, PEA/asystole, CPR-related external perfusion, and post-ROSC instability without making an unvalidated equation autonomously decide when a person arrests or recovers.

## Project Hope provenance contract

The module incorporates the source-register rules from `Project_Hope_Patient_Perspective_Provenance_v0.5.json`:

- adult CP respiratory illness is plausible but population evidence is not individual prognosis;
- baseline oxygenation must not be inferred from motor severity;
- dysphagia/eating and drinking ability are individualised;
- silent aspiration is possible but never assumed from CP;
- positioning is a qualitative/scenario-specific modifier rather than a universal fixed SpO2 gain;
- communication partners may support communication but do not replace patient authority;
- patient concern and deterioration escalation remain explicit state/events;
- population mortality evidence must not set a treatment ceiling.

The uploaded provenance source is the authority for these disability-specific constraints. Numeric physiology parameters in this prototype are engineering assumptions requiring separate clinical validation.

## Validation status

Automated invariants currently test that:

- an explicit internally coherent baseline is mandatory;
- higher positive airway pressure reduces modeled venous return;
- impaired gas exchange lowers modeled oxygenation over time;
- PEA preserves electrical activity while eliminating native mechanical output;
- asystole removes electrical rate and native mechanical output;
- ROSC cannot occur without explicit scenario-provided recovery state;
- disability-severity inference is blocked by provenance constraints.

### Required next validation layers

1. clinician review of dimensional equations and parameter ranges;
2. comparison against a validated physiology engine such as Pulse for predefined synthetic cases;
3. sensitivity analysis for gas-exchange and intrathoracic-pressure coupling coefficients;
4. verification against de-identified waveform/ventilator datasets where licensing permits;
5. disabled-person/lived-experience review of baseline, communication, and outcome framing;
6. explicit unit tests for CPR/external-perfusion and post-ROSC shock scenarios.

## Integration contract

The biomedical engine must never directly alter medication doses, ventilator device controls, patient consent, capacity, scoring, or ceilings of care. It should emit physiological observables to the existing simulation runtime, which remains responsible for learner actions, communication access, branching, and audit.
