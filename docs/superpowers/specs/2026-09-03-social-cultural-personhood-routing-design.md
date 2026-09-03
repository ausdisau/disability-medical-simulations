# Social & Cultural Personhood Subagent Routing — Design Specification

Date: 2026-09-03
Status: Design approved in conversation; implementation not yet started
Target: Project Hope v1 Alpha architecture
Base branch: `release/v1-alpha-rc`

## 1. Purpose

Add a Social & Cultural Personhood subsystem to Project Hope that can enrich fictional simulation interactions without allowing generative social or cultural interpretation to overwrite canonical patient facts, clinical state, communication, consent, decision authority, learner actions, or deterministic consequences.

The subsystem uses two user-selectable lanes:

- **Lane A — Context Interpretation:** evidence-bound interpretation of explicitly authored social, cultural, linguistic, relational, community and identity context.
- **Lane B — Behaviour Generation:** bounded generation of fictional NPC social behaviour, interpersonal tone, culturally situated interaction and relational responses.

Users may switch dynamically between Context Only and Dual Lane during a simulation. Regeneration is permitted, but only as a presentation-layer transformation subject to fidelity warnings, storynode scope limits and a degradation guard.

## 2. Core invariants

The subsystem MUST preserve these invariants:

- `PATIENT MODEL != PATIENT`
- `CULTURE != PERSONAL BELIEF`
- `ETHNICITY != BEHAVIOUR`
- `RELIGION != ASSUMED PRACTICE`
- `FAMILY PRESENCE != AUTHORITY`
- `COMMUNITY NORM != PATIENT PREFERENCE`
- `STATISTICAL PATTERN != INDIVIDUAL TRUTH`
- `GENERATED SOCIAL BEHAVIOUR != PATIENT-AUTHORED IDENTITY`
- `MODE SWITCH != NEW PATIENT PREFERENCE`
- `MODE SWITCH != NEW CULTURAL FACT`
- `REGENERATE PRESENTATION != REWRITE CANONICAL HISTORY`

The subsystem MUST NOT create or alter:

- patient-authored speech or AAC content;
- consent or refusal;
- capacity findings;
- legal or substitute decision authority;
- diagnosis, prognosis, physiology or clinical observations;
- learner actions;
- committed clinical or rights consequences;
- authored identity, culture, religion, language, values, goals or relationships;
- resuscitation limits or treatment ceilings;
- real-person records or profile data.

## 3. Authority order

The social-cultural subsystem is proposal-only and remains below deterministic and rights authority. Its generated output must pass both the Social Fidelity Guard and the Personhood Guardian before it can reach VIRGIL or a renderer.

```text
Protected patient facts / authored decisions
        ↓
Deterministic clinical + communication + agency + system state
        ↓
Clinical-practice / evidence rules
        ↓
Rights Gate
        ↓
Social & Cultural Personhood Router
        ├── Lane A: Context Interpretation
        └── Lane B: Behaviour Generation
        ↓
Social Fidelity / Stereotype Guard
        ↓
Personhood Guardian
        ↓
VIRGIL advisory context
        ↓
NPC / narrative / visual renderer
```

The Social & Cultural Personhood Router is never an authority source for canonical state. The Personhood Guardian retains final personhood precedence over all social/cultural rendering proposals.

## 4. User-selectable operating modes

### 4.1 Context Only

Lane A is active. Lane B is disabled.

Allowed outputs include:

- confirmed social/cultural/relationship context;
- uncertainty and missing-context warnings;
- stereotype-risk detection;
- culturally relevant access questions;
- relationship-role clarification;
- language/communication considerations;
- prompts to ask rather than assume.

### 4.2 Dual Lane

Lane A and Lane B are active.

Lane B may generate fictional NPC presentation such as:

- interpersonal tone;
- phrasing and conversational style;
- gesture or non-clinical body language;
- relationship-aware responses;
- humour, concern, frustration, familiarity or conflict;
- culturally situated but non-deterministic interaction;
- social-world consequences that do not alter protected clinical or patient-authored facts.

### 4.3 Dynamic switching

Users may switch between Context Only and Dual Lane at any point.

A switch MUST:

1. append a deterministic `SOCIAL_MODE_CHANGED` command/event;
2. preserve all canonical history;
3. leave patient-authored communication untouched;
4. leave clinical and rights state untouched;
5. apply only to future rendering unless regeneration is explicitly requested;
6. never interrupt active AAC composition or steal focus from communication access controls.

Default fallback when no user preference is present: **Context Only**.

## 5. Subagent routes

The router exposes small, separable subagents. Each subagent reads structured context and returns proposals, findings or rendering constraints. None may write canonical state.

### 5.1 Identity Context Interpreter

Reads only explicitly authored identity fields.

Outputs:

- confirmed identity descriptors;
- unresolved identity dimensions;
- forbidden inferences;
- terminology constraints.

### 5.2 Relationship & Kinship Context Interpreter

Reads authored relationship roles and authority metadata.

Outputs:

- confirmed relationship roles;
- support/witness/information roles;
- unresolved decision-authority questions;
- relational continuity risks.

It MUST preserve `supporter != substitute authority`.

### 5.3 Culture & Community Context Interpreter

Reads explicit cultural, community and belonging information.

Outputs:

- confirmed cultural/community context;
- culturally relevant questions;
- stereotype-risk flags;
- missing-context markers.

It MUST NOT infer beliefs or practices from ethnicity, nationality, religion, disability, class, gender or family structure.

### 5.4 Language & Communication Context Interpreter

Reads authored language, AAC and communication-access information.

Outputs:

- preferred communication methods;
- language/interpreter needs if authored;
- AAC access conditions;
- communication repair obligations;
- `UNKNOWN` where reliable communication is not established.

This route must defer to Project Hope communication-access state and dual-clock semantics.

### 5.5 Social Dynamics Generator

Lane B only.

Generates plausible fictional interpersonal behaviour from confirmed relationship and scene context.

May generate:

- NPC tone;
- interaction pacing;
- relational tension or support;
- non-clinical gestures;
- conversational framing.

May not generate patient-authored preferences, consent, capacity, clinical facts or legal authority.

### 5.6 Cultural Interaction Generator

Lane B only.

May enrich fictional NPC behaviour when a scenario explicitly contains cultural context.

It may propose culturally situated interaction but must treat all such output as optional presentation, never as fact about a person or group.

If cultural support is weak or ambiguous, it MUST degrade to Context Only behaviour and surface `CULTURAL_CONTEXT_UNKNOWN`.

### 5.7 Stereotype & Essentialism Guard

Audits both lanes for:

- ethnicity-to-behaviour assumptions;
- religion-to-practice assumptions;
- disability-to-capacity/prognosis assumptions;
- family-role-to-authority assumptions;
- community norm-to-individual preference assumptions;
- exoticisation, infantilisation, pity framing or inspiration-porn framing.

Any violation is a render blocker.

### 5.8 Social Fidelity Guard

Compares proposed regenerated presentation against protected anchors and canonical state.

It assigns a fidelity level and either allows, marks or blocks rendering. Even an allowed proposal remains subject to the Personhood Guardian before display.

## 6. Regenerative mode

Regeneration is a presentation operation, not a state mutation.

### 6.1 Default scope

Default regeneration window:

```text
Current scene
+ last 3–5 NPC turns
```

The product default is `recent_window` with `maxNpcTurns: 5`. Storynodes may explicitly reduce or broaden that scope within their authored policy.

### 6.2 Storynode-specific scope

A storynode may explicitly widen or narrow regeneration:

```json
{
  "storyNodeId": "family-arrival-after-airway-event",
  "regenerationPolicy": {
    "scope": "whole_storynode",
    "maxNpcTurns": 6,
    "minimumFidelity": "F1",
    "protectedAnchors": [
      "patient.aac.authored_message",
      "airway_event.resolved",
      "supporter.role.support_only",
      "learner_action.reassessment"
    ],
    "reason": "Maintain relational continuity across the family's arrival."
  }
}
```

Allowed `scope` values:

- `none`
- `current_turn`
- `recent_window`
- `whole_storynode`

The storynode defines maximum scope. A model may request broader regeneration but cannot grant itself permission.

### 6.3 Regeneration request flow

```text
NPC / VIRGIL detects continuity problem
        ↓
REGENERATION_REQUEST
        ↓
Storynode policy lookup
        ↓
Requested scope reduced to authored maximum
        ↓
Protected anchors resolved
        ↓
Social / cultural regeneration proposal
        ↓
Fidelity + stereotype + authority checks
        ↓
Personhood Guardian
        ↓
ALLOW / MARK INTERPRETIVE / BLOCK
```

## 7. Fidelity warning

Before the first regenerative operation in a run, the UI MUST display a clear warning:

> Regenerative social rendering may change the wording or presentation of recent fictional NPC behaviour. Clinical state, patient-authored communication and committed actions will not change.

The warning must not appear as a modal that blocks AAC composition or urgent accessibility interaction.

The user must have direct actions to:

- accept regenerated rendering;
- keep original rendering;
- inspect differences.

## 8. Fidelity degradation model

### F0 — Canonical

No regeneration. Original authored or deterministic rendering only.

### F1 — High Fidelity

Changes presentation only:

- wording;
- tone;
- gesture;
- pacing;
- social framing.

No new facts or meanings.

F1 may be presented as a high-confidence regeneration candidate. In v1 Alpha, the user still accepts or rejects the candidate; automatic acceptance is not part of this design.

### F2 — Interpretive

Adds plausible social context without creating protected facts.

Requirements:

- visible `INTERPRETIVE` marker;
- provenance showing which contextual inputs were used;
- explicit user acceptance before display replaces the current presentation.

### F3 — Degraded

The proposal adds, contradicts, erases or alters protected information.

F3 MUST be blocked and cannot be accepted by the user.

Automatic F3 triggers include any change or unsupported invention involving:

- patient speech;
- cultural identity;
- belief or religious practice;
- family authority;
- consent or refusal;
- capacity;
- clinical observation;
- diagnosis or prognosis;
- relationship fact;
- patient value, goal or preference;
- learner action;
- deterministic consequence;
- rights-gate outcome.

## 9. Protected anchors

Protected anchors are references to immutable meanings used during regeneration.

Anchor classes:

- `patient_authored`
- `clinical_canonical`
- `communication_access`
- `agency_authority`
- `rights_gate`
- `learner_action`
- `deterministic_consequence`
- `relationship_fact`
- `identity_fact`

Every regeneration proposal must resolve and compare against the active anchor set before rendering.

## 10. Runtime state additions

All new state remains RAM-only and is destroyed on reload/session exit unless the user explicitly exports JSON.

Proposed state shape:

```js
socialCultural: {
  mode: "context_only" | "dual_lane",
  regenerationEnabled: boolean,
  regenerationWindow: {
    scope: "none" | "current_turn" | "recent_window" | "whole_storynode",
    maxNpcTurns: 5
  },
  currentStoryNodeId: null,
  lastRegenerationId: null,
  lastFidelityLevel: "F0",
  activeWarnings: [],
  contextFindings: [],
  behaviourProposal: null
}
```

No user/account identifier is required.

## 11. Deterministic command and event additions

Commands:

- `SET_SOCIAL_MODE`
- `SET_REGENERATION_ENABLED`
- `REQUEST_SOCIAL_REGENERATION`
- `ACCEPT_SOCIAL_REGENERATION`
- `REJECT_SOCIAL_REGENERATION`

Events:

- `SOCIAL_MODE_CHANGED`
- `SOCIAL_REGENERATION_REQUESTED`
- `SOCIAL_REGENERATION_PROPOSED`
- `SOCIAL_REGENERATION_ACCEPTED`
- `SOCIAL_REGENERATION_REJECTED`
- `SOCIAL_REGENERATION_BLOCKED`
- `SOCIAL_FIDELITY_DEGRADED`
- `CULTURAL_CONTEXT_UNKNOWN`

Replay must reproduce the same canonical state and the same sequence of accepted/rejected regeneration decisions when using the same scenario, rule-pack version, seed and accepted proposal identifiers.

Generative wording itself may be versioned separately from canonical replay if the generating model is nondeterministic. Canonical replay must therefore depend on stored accepted render payloads or deterministic local generation inputs in the in-memory log/export, not on re-querying a model during replay.

## 12. Relationship to Personhood Guardian

The Personhood Guardian is the final personhood gate for any social/cultural rendering.

The Social & Cultural subsystem provides additional checks for:

- identity essentialism;
- cultural stereotyping;
- relational substitution;
- invented values;
- social erasure;
- culturally framed paternalism;
- communication bypass presented as cultural deference.

If the Personhood Guardian and Social Fidelity Guard disagree, the stricter outcome wins.

## 13. Relationship to VIRGIL

VIRGIL may:

- consume approved context findings;
- surface social/cultural unknowns;
- request a broader storynode regeneration;
- recommend asking the patient or supporter for clarification;
- suggest educational reflection questions.

VIRGIL may not:

- activate Dual Lane by itself;
- grant regeneration scope;
- alter storynode policy;
- resolve an unknown cultural fact into a known fact;
- convert generated behaviour into canonical personhood information.

## 14. UI behaviour

Persistent control:

```text
SOCIAL & CULTURAL PERSONHOOD
[ Context Only ] [ Dual Lane ]
Regeneration: On / Off
```

The control must explain that mode changes affect generative latitude, not patient facts.

When regeneration is proposed, show:

- scope;
- fidelity level;
- protected-anchor status;
- original vs proposed rendering;
- source/context provenance;
- Accept / Keep Original actions.

Fidelity must not be encoded by colour alone.

## 15. Accessibility requirements

- Fully keyboard-, switch-, touch- and screen-reader-operable.
- Changing mode must not steal focus from AAC or patient communication controls.
- Active AAC composition prevents regeneration UI from interrupting the patient interaction.
- Screen reader announcement for mode change:
  - `Social and cultural behaviour generation enabled. Existing canonical simulation state unchanged.`
- Difference inspection must be available as structured text, not visual red/green diff only.
- `Keep Original` and `Accept Rendering` must be directly reachable.
- Reduced-motion mode suppresses transition animation during regeneration.
- Large-text mode stacks original/proposed comparisons vertically.
- Low-sensory mode removes decorative social animation without hiding content.

## 16. JSON export additions

The user-initiated simulation JSON may include:

- current social/cultural mode;
- regeneration preferences;
- storynode regeneration policies used;
- regeneration request/decision history;
- accepted render payloads needed for replay;
- fidelity outcomes;
- blocked regeneration reasons;
- source/provenance identifiers.

It MUST NOT add real-person profile data, external account IDs or hidden persistence identifiers.

Platform retention remains `none`.

## 17. Failure behaviour

On model failure, missing context, policy ambiguity or guard uncertainty:

- fall back to Context Only;
- keep canonical rendering;
- surface `UNKNOWN` or `CULTURAL_CONTEXT_UNKNOWN`;
- never fabricate a social/cultural explanation;
- do not block necessary clinical simulation progression unless the higher-level rights/personhood guard requires it.

## 18. Testing strategy

### Unit tests

- Context lane never invents cultural beliefs.
- Relationship interpreter never grants supporter authority from presence alone.
- Lane B cannot modify patient-authored speech.
- Lane B cannot modify clinical/agency/rights state.
- dynamic mode changes append commands/events.
- mode changes do not modify prior canonical state.
- storynode policy clamps regeneration scope.
- model requests cannot self-expand scope.
- protected anchors are enforced.
- F1 is presented as high-fidelity and remains user-accept/reject in v1 Alpha.
- F2 is marked interpretive and requires user acceptance.
- all F3 triggers are blocked.
- missing cultural context falls back to `CULTURAL_CONTEXT_UNKNOWN`.
- AAC composition prevents disruptive regeneration UI transitions.

### Replay tests

- accepted regeneration decisions replay from stored accepted render payloads without querying an external model;
- canonical state deep-equals the original run after replay;
- rejection/block events preserve original rendering.

### Accessibility tests

- keyboard path over mode switch, regeneration toggle, diff inspection, Accept and Keep Original;
- screen-reader labels and live announcements;
- large-text reflow;
- reduced-motion and low-sensory behaviour;
- no colour-only fidelity meaning.

### Safety regression tests

Block any regeneration that invents or changes:

- patient preference;
- consent/refusal;
- capacity;
- family authority;
- cultural belief/practice;
- clinical observation;
- prognosis;
- treatment ceiling;
- deterministic consequence.

## 19. Non-goals for v1 Alpha

Not included in the first implementation:

- demographic prediction models;
- automatic ethnicity/religion inference;
- real-person social graph ingestion;
- persistent user cultural profiles;
- cultural scoring;
- personality scoring;
- autonomous relationship authority;
- clinical decision-making based on cultural stereotypes;
- background storage of generated social history.

## 20. Acceptance criteria

The feature is acceptable for Alpha review when:

1. users can switch Context Only / Dual Lane during a running simulation;
2. switching never changes canonical state;
3. regeneration defaults to current scene + a bounded recent NPC window;
4. authored storynodes can grant narrower or broader bounded regeneration scope;
5. models may request but never self-authorise broader scope;
6. all regeneration passes protected-anchor, stereotype, authority and Personhood Guardian checks;
7. F3 content is reliably blocked;
8. patient-authored communication cannot be regenerated;
9. communication access and AAC timing remain intact;
10. deterministic canonical replay remains valid;
11. accepted social renderings can replay without re-querying a nondeterministic model;
12. the subsystem remains RAM-only with user-initiated JSON as the only durable output;
13. the Personhood Guardian retains final precedence over social/cultural rendering.
