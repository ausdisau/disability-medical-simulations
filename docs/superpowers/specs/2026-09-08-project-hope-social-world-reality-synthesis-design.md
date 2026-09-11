# Project Hope Social World & Reality Synthesis Design

Date: 2026-09-08
Status: Approved architecture design; implementation not yet started
Target: `ausdisau/disability-medical-simulations`
Context: Extends VIRGAL Character–World Runtime v0.4 without changing the rule that deterministic clinical/world controllers own canonical truth.

## 1. Purpose

Project Hope needs a persistent non-medical world around each fictional patient so hospitalisation does not erase home, school, family, friendships, community, ordinary plans, privacy, humour, conflict, access needs, and future orientation.

The first rich instantiation is an Eli-specific World Pack, but the runtime is reusable for future Project Hope characters.

The design deliberately separates:

- canonical world truth;
- what each person perceives and believes;
- authored biography;
- generated candidate material;
- personal memory;
- relational memory;
- research-derived lived-experience evidence;
- clinical state.

No language model may directly author physiology, consent, capacity, treatment ceilings, diagnosis, or other protected clinical/rights claims.

## 2. Primary invariants

1. `GENERATED != CANON`.
2. `NPC_BELIEF != WORLD_TRUTH`.
3. `VISIBLE != KNOWN`; `KNOWN != SHAREABLE`.
4. Relationships are directional and do not create authority.
5. Silence, AAC failure, dysarthria, fatigue, disability, or altered consciousness never imply consent, refusal, incapacity, or reduced personhood.
6. Hospital proximity does not define narrative importance.
7. Off-screen people and settings continue to exist.
8. Research narratives inform plausible interpretation but never become a character's autobiography.
9. One lived-experience story never stands for a population.
10. Stochastic generation proposes; VIRGAL and guardians decide what becomes committed history.
11. Accessibility is environmental and relational infrastructure, not a deficit score attached to Eli.
12. Personhood is invariant and never represented numerically.

## 3. Top-level architecture

```text
VIRGAL CANONICAL WORLD / CLINICAL TRUTH
        |
        v
Character–World Projection
        |
        v
SocialWorldRuntime
        |
        +-- WorldClock
        +-- SettingRegistry
        +-- FidelityManager
        +-- CharacterSpawner
        +-- CharacterLifecycleManager
        +-- EventScheduler
        +-- KnowledgeRouter
        +-- CommunicationChannels
        +-- RelationalContinuityEngine
        +-- LivedExperienceDialecticMediator
        +-- PeerReviewedNarrativeCaseBank
        +-- PersonhoodCanonGate
        |
        v
VIRGAL Reality Synthesis & Emergence Engine (RSEE)
        |
        +-- PerceptionEngine
        +-- RealityFrictionEngine
        +-- CounterfactualShadowWorlds
        +-- EmergentEventGenerator
        +-- MacroMicroCalibration
        +-- MemoryReconstruction
        +-- ModelDisagreementMonitor
        +-- NarrativeConsistencyAuditor
        +-- CanonCommitGate
```

RSEE runtime verbs: **Perceive -> Imagine -> Challenge -> Commit -> Remember**.

## 4. Eli World Pack

The reusable engine is instantiated with an Eli-specific World Pack containing only authored canon, committed history, and explicitly unresolved fields.

Initial domains may include:

- family home;
- mainstream school;
- friend group;
- online/messaging spaces;
- Jewish/community spaces where explicitly authored;
- local shops and leisure spaces;
- accessible transport;
- neighbourhood;
- hospital/PICU edge;
- AAC and communication-access infrastructure.

The World Pack stores facts by epistemic class:

- `AUTHORED_CANON`;
- `COMMITTED_HISTORY`;
- `GENERATED_CANDIDATE`;
- `INFERRED_TEMPORARY`;
- `UNKNOWN`.

Generated candidates never silently promote themselves.

## 5. Character model tiers

### Tier 1: Persistent autonomous people

Used for parents, siblings, close friends, and other materially important recurring relationships.

Each receives:

- CorporalMoralAgentKernel;
- persistent memory;
- directional relationships;
- goals and routines;
- private knowledge;
- communication channels;
- personal off-screen life.

### Tier 2: Recurring context NPCs

Examples: classmates, teachers, neighbours, regular transport/support staff, community contacts.

They maintain limited schedule, local memory, relationship continuity, and epistemic state.

### Tier 3: Ephemeral population

Examples: shop staff, event attendees, strangers, substitute staff.

They receive only enough state for the active interaction.

### Promotion lifecycle

```text
GENERATED_CANDIDATE
 -> EPHEMERAL
 -> RECURRING
 -> PERSISTENT
 -> DORMANT/ARCHIVED
```

Promotion requires one or more of:

- explicit authoring;
- repeated committed interaction;
- a significant committed relational event;
- moderator-approved promotion.

Promotion must pass a Personhood Canon Gate that checks for invented intimacy, history, private facts, trust, or authority.

## 6. CorporalMoralAgentKernel

Tier-1 people are modelled as persistent persons with temporally changing states.

### Persistent/slow-changing layers

- identity;
- personality trait distributions;
- values and moral commitments;
- long-term goals;
- relationships;
- enduring routines;
- autobiographical memory.

### Fast-changing layers

- fatigue and sleep debt;
- hunger/thirst/physical comfort;
- sensory load;
- arousal and stress;
- attention;
- current appraisal;
- temporal emotional field;
- perceived control;
- current action tendencies.

Personality defines behavioural priors, not deterministic outputs. Values are plural and conflict-capable rather than collapsed into a morality score.

### Appraisal cycle

```text
EVENT
 -> PERCEPTION
 -> APPRAISAL AGAINST GOALS/VALUES/MEMORY
 -> TEMPORAL EMOTIONAL FIELD
 -> MORAL/VALUE CONFLICT
 -> ACTION TENDENCIES
 -> CANDIDATE BEHAVIOUR
```

A frightened or angry moment does not rewrite personality. Deep personality/value change requires repeated committed evidence over longer time scales.

## 7. LivedExperienceDialecticMediator

The kernel must not resolve social/moral dilemmas only from synthetic personality variables. Significant situations are mediated through peer-reviewed lived-experience evidence.

### Runtime contract

1. form an initial appraisal;
2. retrieve analogous lived-experience cases;
3. retrieve counter-cases, minority/edge cases, and contradictory findings;
4. compare contextual differences;
5. produce a provisional or plural synthesis;
6. preserve unresolved disagreement where evidence does not support one answer;
7. return candidate action tendencies, never a forced moral verdict.

### Required anti-overgeneralisation rules

- one story is not everyone;
- group experience is not Eli's individual experience;
- parent account is not the child's account;
- clinician account is not the patient's account;
- qualitative theme is not a deterministic rule;
- culture/faith category does not populate individual beliefs;
- research evidence never migrates into autobiographical memory.

## 8. PeerReviewedNarrativeCaseBank

A curated, versioned research corpus sits outside the live dialogue loop.

Preferred evidence ordering:

1. qualitative systematic reviews / meta-syntheses;
2. participatory or co-designed qualitative work with direct lived-experience voices;
3. qualitative interviews, ethnography, narrative inquiry;
4. sibling/family perspectives labelled as proxy/family perspectives;
5. clinician perspectives labelled as clinician perspectives;
6. quantitative evidence for contextual calibration, not as a substitute for stories.

Each Narrative Evidence Packet records:

- source identifiers (PMID/DOI/database);
- year and jurisdiction;
- whose perspective is represented;
- population and setting;
- communication/access context where reported;
- themes of what mattered, harmed, helped, or changed;
- value tensions;
- counter-patterns;
- transferability limits;
- evidence inspection status and provenance.

The bank should be reviewed with disabled people and other relevant lived-experience contributors before use in production training or competency assessment.

## 9. RelationalContinuityEngine

Relationships are directional, memory-bearing, and multi-dimensional.

`A -> B` is not assumed equal to `B -> A`.

Possible internal dimensions include:

- affection;
- trust;
- psychological safety;
- familiarity;
- intimacy;
- reciprocity;
- protectiveness;
- resentment;
- admiration;
- jealousy;
- obligation;
- conflict load;
- repair readiness;
- privacy permeability.

There is no single relationship-quality score.

### Relationship memory classes

1. canonical world history;
2. personal episodic memory;
3. relational meaning memory;
4. cultural/research memory.

Personal recall may be incomplete, emotionally weighted, or later reinterpreted, while canonical event history remains deterministic.

### Conflict and repair

Conflict is normal rather than automatically pathological. Valid trajectories include escalation, withdrawal, boundary-setting, partial repair, reconciliation, and non-reconciliation.

Repair may involve acknowledgement, apology, explanation, restitution, changed behaviour, forgiveness, partial forgiveness, or refusal to reconcile. Apology alone does not reset trust.

## 10. Privacy and information routing

Privacy is directional and scoped.

Each information packet records:

- sender;
- recipients;
- content classification;
- disclosure authority;
- send time;
- delivery time;
- read/seen state;
- forwarding events;
- misunderstandings/corrections.

Information may move through speech, AAC, SMS, group chat, video call, email, school notice, family update, or social media only when an explicit channel/event exists.

No telepathy and no automatic family-wide knowledge propagation.

## 11. Setting sub-models

Every important place owns persistent local state:

- identity/location;
- schedule;
- active population;
- local norms;
- accessibility affordances/barriers;
- physical/social friction;
- communication channels;
- current events;
- local knowledge;
- local memories.

Accessibility is multidimensional:

```text
access_experience =
physical access
+ communication access
+ predictability
+ time cost
+ assistance availability
+ social attitudes
+ sensory conditions
+ fatigue cost
+ dignity/autonomy cost
```

`technically_accessible != welcoming`.

## 12. Fidelity management

The world runs at variable fidelity:

- `F1 ACTIVE_SCENE`: second/minute detail with dialogue, perception, emotion, and actions;
- `F2 NEAR_WORLD`: minute/hour events, movement, communication, goals;
- `F3 DISTANT_WORLD`: hour/day summarized state transitions.

A future implementation may preserve the existing v0.4 `F0/F1/F2/F3` projection by mapping the Social World active-scene definition onto the repository's current fidelity contract rather than redefining public enums blindly.

Fidelity follows narrative relevance, not hospital-centric importance.

## 13. Event-driven off-screen world

The runtime schedules events rather than continuously sampling every person every second.

Examples:

- school starts;
- sibling leaves home;
- friend sends a message;
- accessible transport is delayed;
- device needs charging;
- venue changes access conditions;
- family member sleeps, eats, works, or disengages.

When a distant zone becomes active, the runtime reconstructs only from committed intervening events and known state.

## 14. VIRGAL Reality Synthesis & Emergence Engine (RSEE)

RSEE improves realism without becoming sovereign world truth.

### 14.1 Perception Engine

Each person receives only what is perceptually available given:

- location;
- line-of-sight;
- hearing/noise;
- attention;
- fatigue;
- device/screen access;
- communication access;
- current focus;
- information channel availability.

Perception failure is allowed and becomes causally meaningful.

### 14.2 Reality Friction Engine

Intentions do not instantly become actions. The world models ordinary constraints such as:

- travel time;
- public transport delays;
- school/work timetables;
- sleep and fatigue;
- queues;
- money/resource limits where authored/relevant;
- device charge;
- environmental access;
- weather exposure where available;
- competing family obligations;
- limited human attention.

### 14.3 Counterfactual Shadow Worlds

Before a consequential social event commits, the reasoning model may generate several plausible near-future candidates.

Each candidate is checked against:

- canonical world state;
- spatial/temporal feasibility;
- knowledge boundaries;
- relationship history;
- personhood constraints;
- rights/privacy constraints;
- clinical-state boundaries where applicable.

Only one branch may be committed. Rejected candidates are not hidden history.

### 14.4 Emergent Event Generator

Events arise from interacting goals, schedules, barriers, relationships, communication, and stochastic variation. Emergence may create opportunities, coincidences, misunderstandings, and conflicts but may not create protected clinical truth or retrospective biography.

### 14.5 Macro/Micro Calibration

Individual behaviour is generated at the micro level, while aggregate distributions may be constrained by empirical data when credible population data exist. Calibration must avoid forcing every individual toward a demographic average.

### 14.6 Memory Reconstruction

Agents retrieve memories through salience, recency, emotional meaning, and relevance. Canonical history remains exact underneath subjective recall.

### 14.7 Model Disagreement Monitor

For consequential interpretations, multiple independent candidate readings may be compared. High disagreement increases uncertainty or triggers evidence retrieval rather than averaging disagreement into artificial certainty.

### 14.8 Narrative Consistency Auditor

Checks for:

- teleportation/telepathy;
- impossible travel or timing;
- personality discontinuity;
- invented relationships/history;
- privacy leaks;
- clinical-state contamination;
- stereotype amplification;
- unexplained knowledge;
- forgotten accessibility requirements;
- contradictions with committed events.

### 14.9 Canon Commit Gate

Canonical event contract:

```text
MODEL PROPOSAL
 -> WORLD/CAUSALITY VALIDATION
 -> LIVED-EXPERIENCE CHALLENGE WHEN RELEVANT
 -> RIGHTS/PERSONHOOD GUARDIANS
 -> VIRGAL COMMIT
 -> OBSERVABLE CONSEQUENCE
 -> MEMORY/RELATIONSHIP PROJECTION
```

No candidate dialogue may directly mutate canonical truth.

## 15. Long-horizon model use

A high-context reasoning model such as GPT-6 Astra may be used for:

- long-horizon scene synthesis;
- counterfactual candidate generation;
- research interpretation;
- continuity review across many scenes;
- character dialogue constrained by read-only state;
- discrepancy detection;
- multi-perspective social reasoning.

It must remain a proposal layer. Model eloquence or apparent empathy is not evidence of psychological truth.

## 16. Evaluation strategy

Realism must be measured rather than inferred from fluent dialogue.

### Deterministic tests

- no telepathic knowledge propagation;
- generated candidates cannot mutate canon;
- relationship state cannot create authority/consent/capacity;
- information disclosure respects privacy state;
- off-screen events replay deterministically;
- accessibility state survives transitions;
- rejected counterfactual branches do not leak into memory.

### Persona consistency tests

Run repeated semantically equivalent probes against persistent characters to detect excessive personality drift, value drift, or model-seed instability.

### Social realism tests

Measure:

- behavioural diversity;
- conflict frequency without forced melodrama;
- repair diversity;
- mundane-event frequency;
- knowledge asymmetry;
- travel/time consistency;
- relationship-direction asymmetry;
- family-role expiration after crisis;
- ordinary non-disability-driven life events.

### Participatory review

Disabled people, AAC users, siblings, parents, clinicians, educators, and relevant community contributors should be able to separately flag scenes as:

- authentic;
- implausible;
- stereotyped;
- patronising;
- over-medicalised;
- excessively harmonious;
- excessively tragic;
- privacy-eroding;
- inaccessible;
- psychologically overconfident.

Reviewer feedback is evaluation data, not automatically inserted as character biography.

## 17. Failure handling

When state is insufficient:

- preserve `UNKNOWN`;
- reduce narrative specificity;
- retrieve evidence if appropriate;
- generate several candidates rather than one confident inference;
- require moderator/user authoring before creating pre-existing intimate biography.

When clinical state changes, the Social World receives only committed events through an explicit interface. It cannot infer additional clinical truth.

## 18. Integration with existing v0.4 Character–World Runtime

This design extends rather than replaces the existing v0.4 principles already implemented around:

- character epistemic claims;
- event-provenanced memory;
- directional relationship state;
- privacy-controlled information delivery;
- world nodes/locations/objects/access affordances;
- deterministic fidelity projection;
- snapshot/replay integration;
- protected Patient Principal claims.

Implementation should preserve current public contracts unless an implementation plan explicitly introduces versioned migrations.

## 19. Eli simulation adoption rule

The design may be used immediately as a narrative/runtime discipline for the ongoing fictional Eli simulation before code implementation, provided that:

- all clinical truth continues to come from the existing simulation state/VIRGAL rules;
- new social facts begin as generated candidates unless authored or committed by explicit events;
- Eli's current communication and agency state is respected;
- family and peer agents retain private lives and non-medical goals;
- research mediation informs but never scripts subjective experience;
- the simulation does not claim the software subsystem is already implemented merely because the narrative follows its rules.

## 20. Out of scope for this design

- autonomous real-patient decision support;
- consciousness simulation claims;
- psychiatric diagnosis from agent behaviour;
- automatic competency assessment;
- medication/device control;
- direct model mutation of physiology;
- permanent generation of intimate biography without authoring/commit evidence;
- merging PR #18 or any implementation branch without an explicit integration decision.

## 21. Acceptance criteria for the future implementation plan

A future implementation plan should not start until this specification is reviewed. It must include tests demonstrating:

1. deterministic replay of committed social events;
2. no leakage from rejected shadow worlds;
3. directional relationship persistence;
4. privacy-safe knowledge routing;
5. stable personality/value priors with temporal emotional variation;
6. research-case provenance and counter-case retrieval;
7. variable-fidelity off-screen world progression;
8. Personhood/rights gating before canon commit;
9. clean separation between Social World and clinical truth;
10. Eli fixture coverage for home, school, sibling/family, peer, AAC, and PICU edge transitions.
