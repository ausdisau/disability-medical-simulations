# Dynamic NPC Response Renderer

Status: educational simulation prototype.

## Purpose

`src/features/dynamic-npc-response-engine.js` renders state-aware NPC dialogue from the current biosocial relational substrate without allowing generated prose to alter deterministic state.

It is designed for moderated Project Hope / Disability Medical Simulations scenes and maps cleanly to the AI Roleplay Chat Simulator `continue-conversation` contract.

## Inputs

```js
buildDynamicNPCResponse(state, {
  npcActorId,
  targetActorId,
  studentAction,
  turnIndex,
  envelope
})
```

- `state`: authoritative current relational substrate.
- `npcActorId`: actor whose dialogue should be rendered.
- `targetActorId`: actor being addressed; defaults to the patient.
- `studentAction`: latest learner/moderator text; used only for response classification.
- `turnIndex`: deterministic variation seed.
- `envelope`: optional synthetic family-system context for rendering/debug display; never committed to relational state.

## Response intents

The renderer ranks six descriptive intents:

1. `BOUNDARY_RESISTANCE`
2. `ANXIOUS_INFORMATION_SEEKING`
3. `TENTATIVE_BOUNDARY_RESPECT`
4. `REPAIR_ATTEMPT`
5. `SUPPORTIVE_PRESENCE`
6. `CLINICAL_CLARIFICATION`

Ranking uses the current actor and relationship state, clinical threat/uncertainty, communication access and limited text signals from the learner's action.

The ranking is not a psychiatric assessment, diagnosis, legal finding, competence score, or prediction of a real person's behaviour.

## Deterministic boundary

The module guarantees:

```text
generated dialogue
      !=
relational event
```

The renderer may describe hesitation, fear, boundary resistance, information seeking or repair. It does not commit `PRIVATE_CONVERSATION_REQUEST`, `BOUNDARY_RESPECTED`, `BOUNDARY_OVERRIDE_ATTEMPT`, `REPAIR_CONVERSATION` or any other state-changing event.

A moderator/scenario controller separately validates and commits a typed event through `applyRelationalEvent`.

## AI Roleplay Chat Simulator mapping

The returned `roleplayPayload` contains:

```js
{
  otherPersonMessage,
  possibleUserResponses
}
```

with two to four accessible learner response choices.

Patient actors are marked with `delivery: "aac"`; family/friend/clinician NPCs use `delivery: "spoken"` unless a future actor-specific communication adapter overrides this.

## Example: ICU 03:10

Current scene:

```text
Clinical Threat: 0.78
Uncertainty: 0.82
Trust: 0.507
Autonomy Support: 0.734
Conflict Load: 0.564
Information Clarity: 0.456
Supporter Burden: 0.652
Crisis Stress: 0.794
```

Learner/student action:

```text
Maya asked for five minutes alone with the doctor.
```

A high-stress/high-control mother-to-Maya edge may rank `BOUNDARY_RESISTANCE` or `ANXIOUS_INFORMATION_SEEKING` highly and render a line such as:

> I heard what Maya asked. I am still struggling with being sent out when things are this serious. Can someone tell me what happens while I am outside?

That line does not itself mean Maya's mother has overridden the boundary. A moderator must decide what event, if any, actually occurred.

## Rights/access invariants

- AAC difficulty does not establish incapacity.
- Family presence does not establish substitute decision-making authority.
- Stress or conflict does not establish futility.
- Disability severity does not set relational baseline.
- Generated text cannot create legal authority.
- Generated text cannot choose treatment.
- Patient actors remain directly addressable when communication access is available.

## Accessibility

The renderer should be paired with:

- full captions/transcripts;
- AAC dwell/scanning time without learner penalty;
- keyboard and switch-accessible response selection;
- explicit speaker labels;
- non-colour status cues;
- reduced-motion presentation mode;
- a moderator option to pause dialogue while communication access is repaired.
