# Equipment Cause-and-Effect Simulation

## Purpose

This module makes equipment effects visible without turning the UI into an autonomous treatment engine.

It is designed for the Project Hope / Disability Medical Simulations runtime and follows the Accessible Respiratory Simulation Author rule that every committable object progresses through:

`available -> selected -> checked -> assigned -> committed`

Selection is never an indication and never changes the patient state.

## Educational boundary

The body model uses bounded synthetic variables rather than direct clinical measurements:

- oxygenation reserve
- ventilation reserve
- airway patency
- secretion burden
- work of breathing
- haemodynamic reserve
- posture support
- AAC access
- signal reliability

They are engineering variables for causal visualization only. They are not validated risk scores, prognosis tools, treatment effect estimates or substitutes for measured observations.

The engine deliberately keeps the following outside this module:

- medication selection/doses
- invasive airway or tracheostomy technique
- ventilator settings
- defibrillation energy or execution
- diagnosis
- prognosis
- capacity
- substitute decision-making authority
- treatment ceilings

## Equipment stations

### Oxygen delivery

Evidence gate: `oxygenIndicated`

Primary visible effect: oxygenation reserve.

Important non-effect: oxygen does not automatically restore ventilation. The interface should therefore permit an oxygenation value/visual to improve while ventilation reserve and work of breathing remain concerning.

### Suction

Evidence gate: `secretionsEvidence`

Primary visible effects: airway patency and secretion burden.

If the evidence gate is absent, the action is blocked and no synthetic benefit is displayed. This prevents the 'tracheostomy = suction' shortcut.

### Manual ventilation

Evidence gate: `ventilationFailure`

Primary visible effects: ventilation reserve and work of breathing, with a smaller synthetic oxygenation coupling.

This is an airway-trained clinician workstream. The learner may identify/escalate a ventilation problem without receiving an unsafe procedural walkthrough.

### Positioning / postural support

Evidence gate: `positioningCompatible`

Primary visible effects: postural support, work of breathing, ventilation reserve and AAC reachability.

The coefficient direction is deliberately qualitative. The model does not claim a universal fixed SpO2 improvement from repositioning.

### Defibrillator

Evidence gate: `shockableArrest`

The equipment cause/effect layer does not directly change haemodynamics or produce ROSC. A committed, valid action emits `ALS_DEFIBRILLATION_ATTEMPT`; the clinical event controller owns rhythm and outcome state.

For PEA/asystole or no arrest, the evidence gate is closed.

### AAC restoration

Evidence gate: `aacAccessImpaired`

Primary visible effect: communication reachability.

It never changes cognition, capacity or legal authority.

## Interactive body visualization

The UI can derive a non-clinical `visualDeteriorationIndex` from the synthetic state. It drives only presentation:

- vertical stability / supported-versus-slumped pose
- visible chest effort
- posture-support cues
- AAC reachability
- warning annotations for low synthetic reserves

Do not label this index as NEWS, SOFA, APACHE, mortality risk or any other clinical score.

### Example interaction

1. Learner selects oxygen.
2. No body change occurs.
3. Learner checks readiness/compatibility and the oxygen-indication gate.
4. Appropriate workstream is assigned.
5. Preview shows only the evidence-gated synthetic oxygenation effect.
6. Learner commits.
7. UI animates the permitted state transition.
8. Reassessment remains mandatory; ventilation can remain impaired despite a better oxygenation visual.

This lets a learner see `oxygenation != ventilation` rather than memorising it as text.

## Cause-and-effect graph contract

Each equipment station can be represented as a directed graph:

`equipment -> evidence gate -> synthetic state variable -> observable cue -> reassessment`

Every edge has:

- direction (`increase` or `decrease`)
- synthetic magnitude for visualization
- `synthetic: true`
- reassessment requirements

Blocked equipment produces no causal edge.

## Moderator control

The engine supports two layers:

- `previewEquipmentEffect(...)`: read-only what-if view.
- `commitEquipmentEffect(...)`: applies a synthetic effect only after the station is actually committed and all gates are satisfied.

Clinical outcomes that require an authoritative event remain controller-owned.

## Wolfram validation

The companion Wolfram harness checks:

- all synthetic state values stay within `[0,1]`;
- oxygen can improve the oxygenation channel while leaving ventilation unchanged;
- suction and manual ventilation have no modeled benefit when their evidence gates are closed;
- repositioning/AAC restoration can improve posture/access channels;
- a non-shockable defibrillator selection does not create a beneficial clinical state transition.

The coefficients are synthetic engineering assumptions. Numerical coherence is not empirical clinical validation.

## Event ledger / VillageSQL integration boundary

Every preview/commit can be serialized with `buildEquipmentLedgerEntry(...)` using:

- run ID
- actor ID
- equipment ID
- lifecycle state
- evidence gate
- allowed/blocked reasons
- before state
- preview-after state
- moderator event ID
- engine/version provenance

This is suitable for an append-only event store or analytics database.

A VillageSQL VEF extension is **not** claimed by this module. The VillageSQL extension-builder workflow requires its own Phase 0 environment and SDK/server discovery before any VEF scaffold is created. The simulator therefore exposes a storage-neutral ledger contract first.

## Disability and communication safeguards

- AAC interruption is an access fault, not incapacity.
- Equipment placement can reduce AAC reachability and should be visually detectable.
- Communication/scanning time must pause the simulation clock.
- No support-person presence changes decision authority.
- Disability does not alter an emergency threshold or treatment indication.
- Recovery is compared with Maya's baseline/goals, not with becoming nondisabled.

## Suggested visual scene

Show Maya in an ICU bed with the code cart and respiratory equipment represented as interactive stations. Clicking an object reveals its current lifecycle state and evidence gate. A translucent causal line may illuminate only after the gate is satisfied. The body visualization should change gradually in posture/chest-effort/access cues rather than displaying dramatic collapse unless the clinical controller has actually authored that deterioration.
