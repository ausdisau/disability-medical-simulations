# Shared Visual Simulation Registry v0.1

Date: 2026-09-15
Status: Design for review
Repository: `ausdisau/disability-medical-simulations`
Base runtime: VIRGAL Character-World v0.4 (`feat/virgal-character-world-v04`)

## Purpose

Create a reusable visual-equipment runtime for Project Hope and Disability Medical Simulations so documentary-realistic scene images, equipment cards, AAC views, monitoring views and inventory photographs become accessible, evidence-gated simulation controls without becoming sources of clinical truth.

The registry is shared across Maya, Rohan, Eli and future fictional characters. Each scenario decides which visual assets are present, what they represent, which interactions are available, and which evidence gates must be satisfied before a proposed action can be committed.

The design preserves the existing VIRGAL authority hierarchy: protected patient facts and authored choices first; deterministic world and clinical state next; guardian and rights gates next; bounded model/NPC proposal layers after that; visual and narrative rendering last.

## Non-goals

This design does not:

- convert images into diagnoses or treatment indications;
- let a hotspot directly mutate physiology, medication state, device settings, consent, capacity or legal authority;
- provide medication doses, invasive airway technique, ventilator prescriptions, shock energy or device-specific procedural instructions;
- treat an image model or vision model as a clinical controller;
- require React Native or Hugging Face models for the web runtime to function;
- store identifiable real-patient health data.

## Core invariant

`VISIBLE != INDICATED != AUTHORISED != COMMITTED`

Visual affordance means the learner can perceive or interact with an object. It never proves that the object is clinically indicated, ready, compatible, authorised or effective.

## Runtime position

```text
scenario manifest
      |
character/world state
      |
visual registry + hotspot registry
      |
learner input
      |
visual action proposal
      |
evidence gate
      |
clinical / rights / guardian checks
      |
VIRGAL commit
      |
consequence reducer
      |
clinical/access/world state update
      |
scene renderer + accessible announcement
```

The visual layer proposes. Only the canonical runtime commits.

## Compatibility with current Project Hope runtime

The existing runtime already provides:

- append-only VIRGAL events;
- deterministic replay and event hashes;
- separate world, clinical and learner-evaluation time;
- AAC composition semantics;
- scenario-defined equipment stations;
- persistent Character-World state;
- protected patient claims and privacy rules;
- spatial affordances that remain separate from clinical indication.

SVSR extends those concepts rather than creating a parallel state engine.

## Canonical type contract

The repository is currently browser-compatible JavaScript with Node tests. The interchange contract below is language-neutral JSON. TypeScript/Zod is the authoring contract and may live in an authoring/validation package without forcing an immediate repository-wide TypeScript migration.

### Visual asset

```ts
export type VisualAssetType =
  | "scene"
  | "equipment_detail"
  | "inventory_card"
  | "monitor_view"
  | "communication_view"
  | "overlay";

export type VisualVisibilityState =
  | "hidden"
  | "visible"
  | "focused"
  | "inspected"
  | "disabled";

export type VisualInteractionMode =
  | "inspect"
  | "select"
  | "assign"
  | "request_commit";

export interface VisualAsset {
  id: string;
  title: string;
  assetType: VisualAssetType;
  source: {
    kind: "bundled" | "generated" | "licensed_external";
    path: string;
    provenanceRef: string;
    fictionalDepiction: boolean;
  };
  sceneIds: string[];
  equipmentId?: string;
  station?: "airway" | "breathing" | "circulation" | "communication" | "monitoring" | "utility";
  hotspotIds: string[];
  interactionModes: VisualInteractionMode[];
  visibleWhen: EvidenceExpression[];
  altText: string;
  extendedAltText?: string;
  narrationText?: string;
  sortOrder: number;
  safety: {
    canCreateClinicalFact: false;
    canCreateConsent: false;
    canCreateAuthority: false;
    canMutatePhysiology: false;
  };
}
```

### Hotspot

```ts
export interface VisualHotspot {
  id: string;
  visualAssetId: string;
  equipmentId?: string;
  label: string;
  geometry: {
    x: number;
    y: number;
    width: number;
    height: number;
    units: "percent";
  };
  tabOrder: number;
  interaction: VisualInteractionMode;
  visibleWhen: EvidenceExpression[];
  enabledWhen: EvidenceExpression[];
  disabledReason: string;
  altText: string;
  group?: string;
}
```

Geometry is percentage-based so the same authored hotspot remains stable across responsive web layouts and native wrappers.

### Evidence expression

```ts
export type EvidenceExpression = {
  fact: string;
  operator: "eq" | "neq" | "includes" | "exists";
  value?: string | number | boolean;
  source: "controller" | "scenario" | "world" | "access" | "guardian";
};
```

Evidence expressions may reveal or enable a visual affordance. They cannot author the underlying fact.

### Equipment linkage

The existing equipment record remains authoritative for equipment semantics.

```ts
export interface EquipmentVisualBinding {
  equipmentId: string;
  visualAssetIds: string[];
  defaultVisualAssetId: string;
  stateSource: "equipment_runtime";
}
```

Equipment state remains:

```text
available -> selected -> checked -> assigned -> committed
```

SVSR adds presentation state only:

```text
hidden | visible | focused | inspected | disabled
```

Presentation state must never replace equipment state.

## Scenario manifest contract

Each scenario receives a visual manifest rather than hard-coded image logic.

```ts
export interface ScenarioVisualManifest {
  version: "0.1";
  scenarioId: string;
  scenes: Array<{
    sceneId: string;
    primaryVisualAssetId: string;
    enabledVisualAssetIds: string[];
    initialFocusId?: string;
  }>;
  equipmentBindings: EquipmentVisualBinding[];
  accessibility: {
    announceOnFocus: true;
    announceStateChanges: true;
    pauseEvaluationClockDuringAACComposition: true;
    colourOnlyStatusProhibited: true;
    pointerOnlyInteractionProhibited: true;
  };
}
```

Example scenario JSON:

```json
{
  "version": "0.1",
  "scenarioId": "adult-suction",
  "scenes": [
    {
      "sceneId": "ed-arrival",
      "primaryVisualAssetId": "maya-ed-arrival",
      "enabledVisualAssetIds": [
        "maya-ed-arrival",
        "maya-aac-view",
        "monitor-respiratory-trend",
        "oxygen-interface-13"
      ],
      "initialFocusId": "hotspot-maya-aac"
    }
  ],
  "equipmentBindings": [
    {
      "equipmentId": "13",
      "visualAssetIds": ["oxygen-interface-13"],
      "defaultVisualAssetId": "oxygen-interface-13",
      "stateSource": "equipment_runtime"
    }
  ],
  "accessibility": {
    "announceOnFocus": true,
    "announceStateChanges": true,
    "pauseEvaluationClockDuringAACComposition": true,
    "colourOnlyStatusProhibited": true,
    "pointerOnlyInteractionProhibited": true
  }
}
```

## Runtime action contract

All visual input is normalised to one proposal shape.

```ts
export interface VisualActionProposal {
  actionId: string;
  scenarioId: string;
  sceneId: string;
  actorId: string;
  visualAssetId: string;
  hotspotId?: string;
  equipmentId?: string;
  action: "inspect" | "select" | "assign" | "request_commit";
  roleAssignment?: string;
  basedOnHeadEventHash: string;
  requestedAtWorldTime: number;
}
```

The reducer returns a decision, not a side effect:

```ts
export interface VisualActionDecision {
  status: "allowed" | "held" | "repair_required" | "stale";
  proposal: VisualActionProposal;
  evidenceGate: {
    status: "open" | "closed" | "unknown";
    satisfied: string[];
    missing: string[];
  };
  guardianRefs: string[];
  rightsGateRequired: boolean;
  eventProposal?: {
    type: "VISUAL_ASSET_INSPECTED" | "EQUIPMENT_SELECTED" | "WORKSTREAM_ASSIGNED" | "EQUIPMENT_COMMIT_REQUESTED";
    domain: "SYSTEM" | "ACCESS" | "CLINICAL";
    payload: Record<string, unknown>;
  };
  feedback: string;
}
```

If `basedOnHeadEventHash` no longer equals the current VIRGAL head, return `stale`. The visual action must be re-evaluated against current world state.

## Event model

SVSR introduces proposal/commit events that remain auditable and replayable:

- `VISUAL_ASSET_FOCUSED`
- `VISUAL_ASSET_INSPECTED`
- `EQUIPMENT_SELECTED`
- `EQUIPMENT_CHECKED`
- `WORKSTREAM_ASSIGNED`
- `EQUIPMENT_COMMIT_REQUESTED`
- `EQUIPMENT_COMMITTED`
- `EQUIPMENT_COMMIT_HELD`
- `ACCESS_ANNOUNCEMENT_EMITTED`

`EQUIPMENT_COMMIT_REQUESTED` is intentionally different from `EQUIPMENT_COMMITTED`.

A request may be held by evidence, rights, clinical, protocol, compatibility or authority rules while other safe workstreams continue.

## Rights and autonomy gate

The Patient Autonomy and Rights Safeguards layer runs before any rights-sensitive action commit.

Mandatory invariants:

- AAC failure maps to reduced information reliability, not incapacity.
- Slow response maps to processing/communication time, not refusal.
- Family/supporter presence maps to support availability, not substitute authority.
- A hotspot over a person's body, wheelchair, AAC device or personal equipment does not authorise touching or moving it.
- A learner cannot use a visual control to override a competent patient's refusal.
- Filming/teaching visuals remain fictional/de-identified unless appropriate permission exists.
- Emergency authority is narrow, necessary, proportionate, time-limited and automatically reconsidered when supported participation becomes feasible.

If a rights hard-stop is active, only the affected branch is held. Already-authorised immediate emergency care may continue in parallel.

## Guardian integration

The visual action pipeline uses domain ownership rather than voting.

```text
visual proposal
   |
evidence gate
   |
NSW/Vic clinical simulation guardian
   |
patient autonomy / rights guardian
   |
pharmacology guardian when medication-related
   |
sovereign ethical review when high-impact / novel
   |
guardian mediator
   |
VIRGAL commit or branch hold
```

A narrative or personhood repair may occur in parallel with otherwise-authorised emergency care. A clinical contraindication or rights hard-stop is not averaged away.

## Initial shared asset pack

Version 0.1 ships with five reusable categories:

1. Maya ED arrival scene.
2. Maya ICU respiratory-support scene.
3. Paediatric retrieval equipment-preparation scene.
4. Oxygen interface equipment detail, mapped to equipment asset 13.
5. Equipment inventory/readiness card.

Each asset requires short alt text, extended alt text where useful, provenance, fictional-depiction status, and at least one non-pointer access route.

## Evidence-gated oxygen example

The oxygen-interface visual can be visible and inspectable before commitment.

Its presence does not resolve:

- airway obstruction;
- secretion burden;
- ineffective ventilation;
- equipment incompatibility;
- unresolved cause of deterioration.

The learner may inspect, select and assign the oxygen workstream when the scenario makes that relevant. Clinical effect occurs only after a controller-authorised committed action and subsequent deterministic consequence.

## Accessibility contract

Every hotspot must be keyboard reachable and have a stable logical order independent of its visual coordinates.

Minimum announcement:

`<item>. <station>. Current state: <state>. <warning or readiness>. Available actions: <actions>.`

Example:

`Oxygen interface. Breathing station. Current state: relevant. Compatibility not yet verified. Available actions: inspect, assign.`

Required access modes:

- keyboard;
- touch/mouse;
- switch scanning;
- eye-gaze dwell selection;
- voice input where available;
- facilitator-entered action.

The browser runtime remains fully usable without voice or local AI.

No critical alarm or state may be conveyed only by colour, pitch, animation or a visual hotspot.

## React Native adapter boundary

React Native is a presentation adapter, not a second simulation engine.

The native client consumes the same scenario manifest, registry records and event/action contracts. It must not duplicate clinical or guardian logic.

Native implementation constraints:

- percentage hotspot geometry maps to measured image bounds;
- long equipment lists use virtualised lists rather than unbounded scroll containers;
- visual state subscriptions are scoped to the active scene to avoid broad re-render cascades;
- large documentary images use bounded resolution/caching and explicit memory cleanup;
- switch/external input is normalised to the same `VisualActionProposal` contract;
- reduced motion and system accessibility preferences are respected.

A native app is deferred until the web contract and deterministic tests are stable. This is a sequencing decision, not a missing requirement.

## Optional Hugging Face / local-model adapter

Local or browser ML is optional progressive enhancement.

Permitted roles include:

- learner speech-to-text;
- non-clinical scene caption assistance;
- semantic search over scenario authoring assets;
- candidate hotspot/object suggestions for author review;
- accessibility transforms.

Model output must remain a proposal. A model cannot write clinical facts, infer capacity, issue treatment indications, commit equipment, or replace authored alt text without review.

Production integration requires a pinned model revision, inspected model card/licence, evaluation on disability-related speech/representation, fallback controls and explicit memory cleanup. If no suitable validated model exists, the simulation remains fully functional without it.

## Research basis and limits

Biomedical evidence supports making communication access a core teaching objective rather than an optional UX feature. A 2025 mixed-methods systematic review of 32 ICU studies found low-technology AAC improved patient satisfaction and communication and highlighted implementation barriers such as tool availability and staff attitudes (PMID 38866691). A 2024 scoping review of critically ill tracheostomy patients found communication strategies have benefits and limitations and require continuous multidisciplinary evaluation rather than a single universal solution (PMID 38627116). Recent ICU nursing studies also identify limited AAC training and improvement in knowledge after structured training (PMIDs 40690241 and 42341409).

These publications support communication-access learning objectives and multimodal alternatives. They do not validate this simulator's clinical outcomes, physiology or credentialing value.

Disability-studies and sociology sources add a separate design rationale. Monteleone's 2025 *The Double Bind of Disability* examines how medical technology can undermine bodily authority when lived experience is displaced by medical expertise. Gill's analysis of doctor-patient interaction distinguishes patient authority over lived experience from professional causal interpretation. These sources inform the simulator's authority and representation design; they are not clinical treatment evidence.

## Public health data boundary

Population or system-performance data may later provide scenario context, prevalence, service access or equity indicators. Public aggregate data must never be projected onto an individual simulated patient as a diagnosis, prognosis, capacity assessment or treatment ceiling.

The runtime therefore accepts external public-data evidence only through a versioned evidence registry. It cannot directly mutate a character state.

## Vercel deployment model

The existing Vercel project `breathing-support-learning-hub` remains the deployment target. Preview deployments are required for feature branches.

SVSR is primarily static client code plus existing server-side persistence/AI proposal endpoints. Documentary images should be served as versioned bundled assets in v0.1 to keep replay and provenance deterministic.

Deployment sequence after implementation:

1. push implementation branch;
2. allow Git integration to create a Preview deployment;
3. run automated runtime/accessibility tests;
4. verify the preview visually and with keyboard/screen-reader semantics;
5. inspect build/runtime errors;
6. obtain clinical, accessibility and lived-experience review evidence;
7. merge through normal review;
8. promote/deploy production only after verification.

Production is not updated by this design document.

## Persistence and replay

Snapshots may persist:

- registry version;
- scenario visual manifest version;
- visual asset IDs;
- equipment state;
- committed visual/action events;
- accessibility preference state when non-identifying;
- asset provenance references.

Snapshots do not need image bytes. Replay resolves exact versioned asset IDs from the release manifest.

Changing an image without changing its content-addressed asset revision is prohibited because it would make historical replay visually non-deterministic.

## Privacy and provenance

Every visual asset includes a provenance record with:

- source kind;
- creator/generator source when known;
- licence/permission state;
- fictional-depiction flag;
- creation/import date;
- content hash;
- approved uses;
- accessibility-review status;
- clinical-review status when the image represents clinical equipment or state.

Generated visuals cannot become evidence merely because they look realistic.

## Error handling

- Missing image: show the semantic asset card and retain full simulation functionality.
- Missing alt text: fail validation; the asset cannot enter a release manifest.
- Unknown equipment binding: hold the interaction; do not guess.
- Closed evidence gate: keep the item understandable and visible when appropriate, explain why commit is unavailable.
- Stale event head: return `stale`; re-evaluate before commit.
- Guardian unavailable on a rights-sensitive/high-risk commit: hold only that branch.
- AI/model unavailable: use deterministic/manual input paths.

## Test strategy

### Schema tests

Validate every visual asset, hotspot, equipment binding and scenario manifest.

### Deterministic reducer tests

Prove:

- inspect never mutates physiology;
- select never becomes commit;
- assignment never becomes indication;
- commit request cannot bypass evidence gates;
- stale proposals cannot commit;
- same committed event sequence rebuilds identical visual/equipment state.

### Rights/accessibility tests

Prove:

- AAC loss does not create incapacity;
- support-worker presence does not create substitute authority;
- communication composition pauses learner-evaluation time according to runtime policy;
- every hotspot has a keyboard/switch route and semantic label;
- locked items remain understandable;
- no state depends on colour alone;
- patient-controlled equipment/body interactions can route through consent/rights checks.

### Guardian tests

Prove clinical, rights and protocol holds remain branch-scoped and cannot be overridden by narrative or UI state.

### Visual regression tests

Verify hotspot alignment at representative desktop, tablet and mobile aspect ratios. Visual regression tests validate interface geometry only, not clinical accuracy.

### Deployment tests

Preview build must pass Node runtime tests and static asset resolution. Runtime logs must show no missing asset/manifest errors during the scripted smoke scenario.

## Migration strategy

Phase 1 keeps the current JavaScript runtime intact and introduces the language-neutral JSON contract plus JavaScript validation/fixtures.

Phase 2 adds the TypeScript/Zod authoring package and generated JSON manifests. Runtime consumes generated JSON rather than importing TypeScript directly.

Phase 3 migrates existing station definitions into shared equipment records and maps the five initial visual assets.

Phase 4 adds the accessible interactive renderer and event reducer integration.

Phase 5 adds optional React Native and local-model adapters after web-runtime acceptance criteria are green.

This avoids a repository-wide TypeScript migration as a prerequisite for visual interaction.

## Acceptance criteria

1. Maya and Rohan can use the same visual/equipment registry without sharing scenario-specific clinical state.
2. Every visual interaction becomes an auditable proposal/event path.
3. No image or hotspot can directly create clinical truth, consent, incapacity, authority or physiological change.
4. Equipment commitment remains evidence-gated and guardian-aware.
5. A missing image never prevents access to the underlying semantic interaction.
6. Keyboard, touch, switch and eye-gaze interaction can reach every critical action.
7. AAC communication time remains protected by the existing timing semantics.
8. Replay resolves the same versioned visual assets and action sequence.
9. Existing VIRGAL v0.4 Character-World protections remain intact.
10. Existing simulation runtime tests remain green.
11. Preview deployment passes runtime and accessibility smoke tests before merge.
12. Clinical, accessibility and paid lived-experience review remain required before accredited or public training claims.

## Design decisions locked by this spec

- Shared registry across characters and scenarios.
- Scenario-specific visibility/relevance/clinical state.
- Visual assets are proposal surfaces, never authority surfaces.
- Language-neutral JSON is the runtime contract.
- TypeScript/Zod is an authoring/validation layer, not a mandatory runtime migration.
- VIRGAL remains the only canonical commit path.
- Rights and clinical holds are branch-scoped.
- Web runtime is implemented first; React Native is an adapter after contract stability.
- Local/Hugging Face models are optional enhancement only.
- Vercel Preview is the first deploy target after implementation, not production.
