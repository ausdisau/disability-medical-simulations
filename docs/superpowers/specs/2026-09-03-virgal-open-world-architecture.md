# Project Hope VIRGAL Open-World Simulation Architecture

Date: 2026-09-03
Status: Approved architecture; v0.3 integration slice
Repository: `ausdisau/disability-medical-simulations`

## Purpose

VIRGAL turns Project Hope from a scene-based simulator into a persistent, replayable open-world simulation while preserving the authority hierarchy: protected patient facts and authored choices first; deterministic world and clinical state next; reviewed clinical, rights, personhood and accessibility rules next; bounded NPC/didactic intelligence after that; narrative and visual rendering last.

Eli is a Patient Principal, not an ordinary NPC. His reliably authored first-person experience, identity, privacy boundaries, goals and preferences cannot be rewritten by NPC memory, stochastic selection, didactic logic or narrative generation. Objective physiology remains owned by the deterministic clinical controller.

## 01. B/C Hybrid Governing Philosophy

Relational and world events may influence behaviour, information flow, timing and system readiness directly. Social or environmental effects may influence physiology only through an explicit, evidence-backed biobehavioural mediator proposal that is accepted by Guardian Mediator and then evaluated by the clinical controller. No relationship or narrative subsystem writes physiology directly.

## 02. Autonomous Character Interaction Model

Characters perceive only what their location, attention, sensory access and information channels permit. Each maintains individual knowledge, goals, needs, memories, relationships and role constraints. NPC action candidates are generated from current world state and selected through deterministic seeded stochastic policy after hard authority and guardian filtering.

## 03. NPC State, Memory, Stochastic Policy, Emergency Authority and Didactics

Characters maintain identity, world binding, perception, epistemic claims, goals, needs/drives, affective context, directional relationships, working/episodic/semantic/relational/procedural/prospective memory, communication state, authority eligibility and policy state.

NPC stochastic selection occurs only among eligible actions. The same world state, character state, event head, policy version and seed must select the same action. Didactic influence may only nudge plausible eligible actions and may never manufacture patient speech, clinical facts, consent, authority or relationship state.

Emergency clinical authority is represented as a narrow, auto-expiring lease for immediately necessary rescue. It never extends to social, privacy, research, personhood or long-term goal decisions. When the emergency basis subsides and supported participation becomes feasible, Eli-first authority resumes automatically.

## 04. Event Fabric

No canonical state mutation occurs without a committed world event. Events are append-only, hash-chained, ordered deterministically and retain causal parents, authority references, guardian references and branch identity. Corrections append new events; history is never edited.

## 05. Causal Graph

Temporal sequence is not automatically causation. Typed edges distinguish triggered, contributed-to, enabled, inhibited, mediated, moderated, interrupted, superseded, prevented and repaired relationships. Unknown causation remains unresolved rather than narratively filled.

## 06. Continuous-Time Scheduler

The runtime maintains world time, clinical time, learner-evaluation time and camera focus separately. Camera focus never advances or freezes time. Patient AAC composition allows world/clinical time to continue while evaluation time pauses. Facilitator accessibility, technical or psychological-safety pauses freeze all relevant clocks.

The scheduler resolves simultaneous events by deterministic priority and stable identifiers rather than processor timing.

## 07. Off-Screen Simulation

World nodes and characters operate at foreground, active-background, coarse-background or dormant fidelity. Off-screen does not mean frozen and does not permit invention. Consequential events involving protected facts, authority, clinical state, communication access, knowledge, relationships, privacy, goals, locations, equipment readiness or causal branches must be retained at full fidelity.

## 08. Spatial World and Affordances

The world is represented as a hybrid topological/spatial graph. Objects expose affordances, but visible/reachable/available never means authorised or clinically indicated. Telepresence is remote embodiment under Eli-controlled camera, audio, framing, mute and disconnect privacy boundaries.

## 09. Knowledge and Information Propagation

No NPC telepathy. Information moves only through observation, direct communication, AAC, messages, calls, video, records, handover or hearsay. Knowledge, belief, assumption, uncertainty, conflict and correction remain distinct. Possessing information does not automatically authorise disclosure.

## 10. Guardian Conflict Resolution

Guardian Mediator resolves conflicts through domain ownership, current authority, clinical urgency, patient-authored preferences, communication access, rights prerequisites, personhood invariants, least-restrictive alternatives and system feasibility. Didactic and narrative preference come last. Holds are branch-scoped where possible.

## 11. B/C Biobehavioural-Clinical Bridge

Only whitelisted, reviewed mediator rules may cross from world/relationship events toward the clinical controller. Inputs such as autonomic arousal, sensory load, sleep disruption, fatigue load, pain context, communication effort and co-regulation are proposals, not clinical findings. Clinical output returns to the social world only through committed observable events.

## 12. Stochastic Branch Persistence

Every stochastic choice persists as an event and therefore changes future memory, relationships and world state. Alternate seeds create legitimate alternate branches without resampling canonical history.

## 13. Save, Resume, Fork and Counterfactuals

Snapshots are immutable and content-addressed. Forking creates a new branch from a historical event without altering its parent. Counterfactuals preserve protected facts and pre-fork history unless the counterfactual explicitly changes an allowed world input.

## 14. Deterministic Replay

Replay freezes scenario, world, interaction, clinical-controller, guardian, rights, personhood, NPC and didactic versions plus evidence snapshot and seeds. Same manifest and event sequence must reproduce the same structured world/head hash. Divergence stops replay at the first mismatch.

## 15. Adaptive Didactic Orchestrator

Didactics consume committed events only. Level 0 stores debrief evidence, Level 1 may propose a natural-world cue, and Level 2 may surface an optional facilitator prompt. The simulation should teach through consequences before surfacing tutor commentary.

## 16. Accessibility and Multimodal Runtime

Patient access and learner access are distinct runtime systems. AAC, switch, keyboard, touch, speech, captions, screen reader, audio description, visual signals, reduced motion and reduced sensory load are first-class. No critical path may depend on a single inaccessible interaction. Communication latency never becomes consent, refusal or incapacity.

## 17. Observability and Explainability

The system exposes structured event, causal, authority, guardian, stochastic and evidence traces appropriate to learner, facilitator, clinical-review, rights-review and developer views. Explainability reports observable reasons and rule references, not hidden model reasoning.

## 18. Verification and Assurance

Release-blocking tests cover schemas, deterministic reducers, guardian rules, branch isolation, replay, stochastic bounds, accessibility routes, concurrency ordering, causal integrity and adversarial cross-domain combinations. Core invariants include: NPC dialogue cannot write physiology; family presence cannot create authority; AAC loss cannot create incapacity; equipment readiness cannot create indication; didactics cannot create patient messages; off-screen actors cannot know unseen events; emergency authority must expire.

## 19. Authoring SDK and Scenario Compiler

Authors define patients, characters, relationships, places, objects, schedules, communication contracts, protected facts, actions, clinical bindings, guardian bindings, learning objectives, evidence and review status without changing engine code. Narrative packs cannot overwrite clinical or rights authority.

## 20. Governance, Evidence and Versioning

Every executable run freezes a release manifest. Evidence changes enter an evidence register, undergo applicability/review, become versioned rule proposals, receive regression tests, and only then enter runtime releases. Historical replay retains historical rules.

## v0.3 Integration Slice

The first repository wiring implements the foundation needed by later sections:

- immutable SHA-256 hash-chained world events;
- causal-parent provenance;
- deterministic world scheduler and stable priority ordering;
- camera focus independent of time;
- seeded reproducible NPC action selection with ineligible actions removed before sampling;
- emergency clinical authority lease with automatic expiry;
- adaptive didactic signal scoring without world mutation;
- branch creation, fork isolation and replay-head verification;
- existing runtime events mirrored into the VIRGAL world event ledger;
- corrected AAC semantics: clinical/world time continues while learner-evaluation time pauses.

This slice deliberately does not implement clinical physiology, medication/procedure detail, autonomous diagnostic decisions, research authority, or a complete 3D world.

## Acceptance Criteria for v0.3 Slice

1. Existing simulator behaviours remain functional.
2. Every new runtime event is committed into a hash-chained world ledger.
3. Causal parents are retained separately from narrative prose.
4. Camera focus never changes world time.
5. Same NPC seed/state selects the same eligible action.
6. Ineligible actions are never sampled.
7. Emergency authority is limited to `EMERGENCY_CLINICAL` and expires when emergency need subsides and supported participation is feasible.
8. Didactic scoring cannot mutate world state.
9. Forked branches preserve parent event history.
10. Replay verifies the same branch head hash.
11. AAC composition advances clinical/world time but pauses evaluation time.
12. All automated runtime tests pass under Node.js 20+.
