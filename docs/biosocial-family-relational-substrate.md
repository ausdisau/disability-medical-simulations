# Biosocial Family Relational Substrate

Version: 0.1.0  
Status: educational simulation backend / research prototype

## Purpose

The biosocial family relational substrate adds a deterministic social-state layer beneath Project Hope / Disability Medical Simulations. It models how acute illness, uncertainty, communication access, family/support relationships, boundaries, trust and repair change over time without turning family behavior into a stereotype or letting social-state variables determine clinical treatment, capacity, prognosis or legal authority.

It is intended to sit beside the biomedical model, not inside it.

```text
Biomedical physiology      Respiratory/access state
        │                            │
        └───────── normalized signals ─────────┐
                                               ▼
                                 Biosocial relational substrate
                                  actors + directed relationships
                                               │
                           ┌───────────────────┼──────────────────┐
                           ▼                   ▼                  ▼
                    scenario cues       role-play context    debrief telemetry
                           │                   │                  │
                           └──────────────┬────┴──────────────────┘
                                          ▼
                                   rights/autonomy gate
                                   remains authoritative
```

## What the substrate models

### Actor state

Each actor has explicit, scenario-authored normalized values in `[0,1]`:

- stress;
- coping reserve;
- perceived threat;
- information need;
- control impulse;
- emotional availability;
- direct-communication skill;
- role clarity;
- support capacity;
- threat sensitivity.

These are **simulation state variables**, not diagnoses, personality assessments, or claims about real families.

### Relationship state

Relationships are directed edges. A mother-to-patient relationship can therefore differ from patient-to-mother state.

Each edge contains:

- influence weight;
- closeness;
- trust;
- conflict;
- autonomy alignment;
- communication reliability;
- boundary respect;
- support availability.

### Environment and access

The substrate receives normalized, scenario-controlled signals:

- `clinicalThreat`;
- `uncertainty`;
- `staffContinuity`;
- family/support presence;
- `communicationAccessReliability`;
- privacy reliability;
- direct patient voice availability.

It does not infer those inputs from disability severity.

## Rights invariants

The model hard-codes architectural invariants rather than asking social dynamics to decide them:

```text
communication failure != incapacity
family presence != substitute authority
relational stress != treatment futility
disability severity != relational baseline
role-play free text != deterministic state mutation
```

`rightsContext` is a read-only snapshot supplied by the external autonomy/rights layer. The relational substrate can carry it for rendering and audit, but its update functions do not promote a supporter to substitute decision-maker or perform capacity assessment.

## Respiratory coupling

The Accessible Respiratory Simulation Author model requires four concurrent layers: personal baseline, acute clinical change, access state and system state. This substrate consumes only normalized signals from those layers.

Example:

```js
const signal = adaptRespiratorySimulationSignal({
  clinicalThreat: 0.8,
  uncertainty: 0.6,
  communicationAccessReliability: 0.45,
  directPatientVoiceAvailable: true
});

state = stepRelationalSubstrate(state, signal, 1);
```

The adapter deliberately strips unrelated fields such as cerebral-palsy severity, wheelchair use or family status so they cannot silently become social/clinical proxies.

## Supported authored events

The initial event vocabulary is:

```text
RESPIRATORY_DETERIORATION
ICU_TRANSFER
CARDIAC_ARREST
ROSC
AAC_ACCESS_DISRUPTED
AAC_ACCESS_RESTORED
PRIVATE_CONVERSATION_REQUEST
FAMILY_DISAGREEMENT
BOUNDARY_RESPECTED
BOUNDARY_OVERRIDE_ATTEMPT
PATIENT_VOICE_ACKNOWLEDGED
REPAIR_CONVERSATION
SUPPORT_OFFERED
INFORMATION_CLARIFIED
```

Events produce transient deterministic stimuli. A cardiac arrest can raise stress and threat, for example, but it does not create a treatment ceiling or an assumption that family decision authority has changed.

## Dynamical model

### Social stress

For actor `i`, the update is conceptually:

```text
socialStress_i = sum(normalizedInfluence_ji * stress_j)

Δstress_i =
    threatGain * threat_i
  + contagionGain * socialStress_i
  + uncertaintyGain * uncertainty * informationNeed_i
  - recoveryRate * copingReserve_i * stress_i
  - supportBuffer * receivedSupport_i
  - communicationRelief * accessReliability * communicationSkill_i
  + authoredEventShock
```

The result is projected into `[0,1]`.

This is a **synthetic interaction model**. The coefficients are not presented as empirical family-psychology constants.

### Control impulse

The backend includes a bounded `controlImpulse` variable to represent a scenario pattern in which acute fear, uncertainty and unclear supporter roles can increase the urge to take control.

It is never treated as inevitable behavior. It changes only from an explicitly authored baseline and current scenario inputs.

Crucially:

```text
controlImpulse high
        !=
legal authority
```

### Trust and conflict

Relationship trust can be repaired by authored events such as direct patient voice, boundary respect, clarification and repair conversations. It can be eroded by explicitly authored boundary violations, conflict, misinformation and poor communication reliability.

The model therefore supports both rupture and recovery rather than producing a permanently adversarial family after one disagreement.

### Autonomy alignment

`autonomyAlignment` represents whether an interaction pattern is currently aligned with the patient's expressed choices. It is not a capacity score and does not define legal authority.

Examples:

```text
patient asks for a private conversation + supporter respects it
  -> boundary respect signal
  -> role clarity can improve
  -> autonomy alignment and trust can recover

supporter tries to override the patient's expressed boundary
  -> authored boundary violation
  -> conflict can rise
  -> trust/autonomy alignment can fall
  -> repair remains possible
```

## Wolfram verification

A representative five-node network was checked in Wolfram Language using a row-normalized influence matrix and the linearized stress update core.

For the illustrative parameters:

```text
dt = 0.25
recovery = 0.55
contagion = 0.20
```

Wolfram produced a spectral radius of approximately:

```text
0.9125
```

for the linearized core, below one. This supports numerical stability of that illustrative local update before projection/clamping.

The same synthetic check showed:

```text
stress initial:
{0.35, 0.55, 0.25, 0.30, 0.25}

stress after acute threat:
{0.469, 0.626625, 0.25875, 0.393, 0.325875}
```

and demonstrated that a boundary-respecting direct-voice signal can drive trust upward while an authored boundary override can drive it downward.

These results establish numerical coherence only; they do not validate the coefficients as real human psychology.

See `validation/wolfram-biosocial-relational-validation.wl` for the reproducible calculation and parameter sweep.

## AI Roleplay Chat Simulator integration

The role-play engine is treated as a **dialogue renderer and rehearsal surface**, not a source of deterministic truth.

`deriveRoleplayContext(state, actorId, targetId)` produces a bounded context object containing:

- current actor stress/threat/information need;
- current relationship trust/conflict/autonomy alignment;
- communication reliability;
- clinical threat/uncertainty;
- explicit rights constraints.

The returned instruction states that free text must not mutate relational state directly.

Recommended integration:

```text
relational substrate
       │
       ▼
deriveRoleplayContext()
       │
       ▼
AI role-play conversation
       │
       ▼
learner / facilitator interprets outcome
       │
       ▼
explicit authored event
BOUNDARY_RESPECTED / REPAIR_CONVERSATION / etc.
       │
       ▼
deterministic state transition
```

Avoid this unsafe pattern:

```text
LLM says "Mum is furious"
       ↓
automatically set conflict = 1
```

That would make model prose an unreviewed state controller.

## Example Maya-family network

A simulation can define:

```text
Maya (patient)
  ↕
Mother (trusted family supporter)

Maya
  ← Aisha (friend)

Maya
  ← ICU nurse

Mother
  ← ICU nurse
```

The mother can be highly frightened and still remain capable of respecting Maya's boundaries. Aisha can provide identity continuity and ordinary social support. The nurse can reduce uncertainty and improve role clarity. None of those relationships changes Maya's decision-making authority by itself.

## Example sequence

```js
state = applyRelationalEvent(state, {
  type: "CARDIAC_ARREST"
});
state = stepRelationalSubstrate(state, {}, 1);

state = applyRelationalEvent(state, {
  type: "ROSC"
});
state = stepRelationalSubstrate(state, {}, 1);

state = applyRelationalEvent(state, {
  type: "PRIVATE_CONVERSATION_REQUEST",
  supporterId: "mother",
  respected: true
});
state = stepRelationalSubstrate(state, {}, 1);
```

The expected result is not "happy family" or "conflict resolved." Instead, the substrate keeps a continuous state in which stress can remain high while trust, role clarity and boundary respect improve.

## Backend boundary with biomedical model

The biomedical model can provide a normalized `clinicalThreat` signal through the scenario controller, but the relational layer should not directly inspect raw measurements and invent social meaning.

For example:

```text
PaO2 / MAP / ventilation data
        │
        ▼
scenario + clinical interpretation
        │
        ▼
normalized clinicalThreat + uncertainty
        │
        ▼
relational substrate
```

This separation prevents a numeric blood-pressure threshold from automatically deciding that a family member becomes panicked, coercive, or legally authoritative.

## Accessibility behavior

- AAC access has a first-class state variable.
- Loss of eye-gaze reliability reduces information reliability, not presumed cognition.
- Direct patient voice remains a separate signal from family/support presence.
- The simulation clock can still pause for AAC/switch scanning at the main runtime layer.
- All relational states must be available as text, not color-only diagrams.
- A relationship graph needs an equivalent keyboard/screen-reader list representation.
- Role-play interfaces should allow extra response time and a clear pause/stop route.

## Audit telemetry

Each deterministic step records:

```text
time
clinical threat
uncertainty
communication access reliability
```

Each authored event records its type and payload.

For a production implementation, additionally persist:

- scenario/case version;
- relational model version;
- actor/edge definition version;
- rights-gate snapshot version;
- dialogue-model/version when role play is used;
- learner-selected event/outcome;
- facilitator override and reason.

## Safety and validation boundary

This substrate is not a family-therapy model, psychological assessment, mental-health diagnosis, capacity assessment, legal decision-maker classifier or predictor of how a real relative will behave.

Before using relational scores in research involving real people, validate the construct definitions, obtain appropriate research governance, minimise identifiable data and review the model with disabled people and family/support representatives.

For clinical education, relational variables should drive plausible cues and debrief prompts rather than high-stakes automated scoring about whether a learner, patient or family is "good," "difficult," "compliant" or "unsafe."
