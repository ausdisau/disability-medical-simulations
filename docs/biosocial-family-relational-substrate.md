# Biosocial Family Relational Substrate

## Status

Educational/research prototype for Project Hope / Disability Medical Simulations.

This backend models a synthetic relational network around a patient during critical illness. It is designed to interact with the existing biomedical cardiorespiratory engine, accessible respiratory simulation signals, AI Roleplay Chat Simulator, and the external Patient Autonomy and Rights Safeguards gate.

It is **not** a psychological diagnostic system, capacity assessment, legal-authority engine, prognosis tool, treatment decision system, or model of any real family.

## Architecture

```text
PROJECT HOPE CLINICAL / RESPIRATORY ENGINE
                 |
                 v
      ACCESSIBLE RESPIRATORY ADAPTER
                 |
      clinical threat / uncertainty
      communication access reliability
      direct patient voice availability
                 |
                 v
      BIOSOCIAL RELATIONAL SUBSTRATE
        |                         |
        v                         v
     ACTORS                    EDGES
 stress / threat         trust / conflict
 coping reserve          autonomy alignment
 information need        communication reliability
 control impulse         boundary respect
 role clarity            support availability
        |                         |
        +------------+------------+
                     v
            DYNAMIC NPC RENDERER
                     |
            descriptive dialogue
                     |
                     v
         AI ROLEPLAY CHAT ADAPTER
                     |
                     v
              MODERATOR / CONTROLLER
                     |
             typed relational event
                     |
                     v
                 RIGHTS GATE
```

The core rule is:

```text
dialogue generation != state mutation
```

The dynamic NPC layer may render fear, hesitation, disagreement, information seeking, repair or support. Only a separately validated typed event changes relational state.

## Actor state

Each actor can carry bounded normalized values such as:

- stress;
- coping reserve;
- perceived threat;
- information need;
- control impulse;
- emotional availability;
- direct communication skill;
- role clarity;
- support capacity;
- threat sensitivity.

These are simulation-control variables, not diagnoses or claims about a real person's personality.

## Directed relationship state

Each relationship edge can carry:

- influence weight;
- closeness;
- trust;
- conflict;
- autonomy alignment;
- communication reliability;
- boundary respect;
- support availability.

Edges are directed. A patient's trust in a supporter need not numerically equal the supporter's trust in the patient.

## Current authored event set

The substrate supports events including:

- `RESPIRATORY_DETERIORATION`
- `ICU_TRANSFER`
- `CARDIAC_ARREST`
- `ROSC`
- `AAC_ACCESS_DISRUPTED`
- `AAC_ACCESS_RESTORED`
- `PRIVATE_CONVERSATION_REQUEST`
- `FAMILY_DISAGREEMENT`
- `BOUNDARY_RESPECTED`
- `BOUNDARY_OVERRIDE_ATTEMPT`
- `PATIENT_VOICE_ACKNOWLEDGED`
- `REPAIR_CONVERSATION`
- `SUPPORT_OFFERED`
- `INFORMATION_CLARIFIED`

Clinical events can increase threat or uncertainty but do not alter legal authority, capacity or treatment ceilings.

## Respiratory integration

`adaptRespiratorySimulationSignal()` accepts only a narrow safe interface:

```js
{
  clinicalThreat,
  uncertainty,
  communicationAccessReliability,
  directPatientVoiceAvailable
}
```

It intentionally excludes disability severity, wheelchair use, AAC use as a capacity proxy, and family presence as legal authority.

## AI Roleplay integration

`src/features/ai-roleplay-relational-adapter.js` creates read-only roleplay payloads from the deterministic substrate.

`src/features/dynamic-npc-response-engine.js` adds state-aware response rendering. It ranks descriptive intents such as:

- boundary resistance;
- anxious information seeking;
- tentative boundary respect;
- repair attempt;
- supportive presence;
- clinical clarification.

The selected response remains descriptive. The moderator must separately decide whether an event such as `BOUNDARY_RESPECTED`, `BOUNDARY_OVERRIDE_ATTEMPT` or `REPAIR_CONVERSATION` actually occurred.

## Rights invariants

The backend is designed around the following non-negotiable constraints:

- communication failure does not equal incapacity;
- family presence does not equal substitute authority;
- relational stress or conflict does not equal treatment futility;
- disability does not determine a person's relational baseline;
- free-text roleplay cannot directly mutate deterministic state;
- severe clinical threat does not itself change decision-making authority;
- generated dialogue cannot prescribe treatment.

## Example: Maya's ICU privacy request

A current state might include high clinical threat, high uncertainty, elevated supporter stress, reduced information clarity and substantial conflict.

Maya uses AAC to state:

```text
I WANT FIVE MINUTES ALONE WITH THE DOCTOR.
```

The dynamic NPC renderer may produce a high-probability family response such as:

> I heard what Maya asked. I am still struggling with being sent out when things are this serious. Can someone tell me what happens while I am outside?

That dialogue does not itself mean the privacy boundary was breached.

The moderator must separately commit one of the relevant event paths, for example:

```text
PRIVATE_CONVERSATION_REQUEST respected=true
```

or, if scenario facts establish an attempted override:

```text
BOUNDARY_OVERRIDE_ATTEMPT
```

The rights gate then evaluates whether progression is permissible.

## Wolfram validation

Two synthetic engineering validation layers are maintained under `validation/`:

1. `wolfram-biosocial-relational-validation.wl` — normalized graph influence/stress stability and bounded-state checks;
2. `wolfram-biosocial-family-system-envelope.wl` — nonlinear six-state family-system envelope for trust, autonomy support, conflict load, information clarity, supporter burden and crisis stress.

Negative Jacobian eigenvalue real parts in representative synthetic equilibria establish local numerical convergence for those illustrative coefficients only. They do not empirically validate family psychology.

## Accessibility

The runtime should provide:

- captions and transcripts;
- speaker identification;
- AAC dwell/scanning time without learner penalty;
- keyboard and switch-accessible response choices;
- reduced-motion presentation;
- non-colour status cues;
- an explicit pause/repair path when communication access fails;
- patient-first direct address when the patient is participating.

## Validation boundary

Before use with real-person data, psychological profiling, competency assessment, autonomous decision support or research participants, the project requires additional construct validation, paid lived-experience review, clinical/accessibility review, privacy/data governance and any applicable research governance.
