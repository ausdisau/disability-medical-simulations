# Project Hope Development and Deployment Governance

Date: 2026-09-15
Status: Approved design, formal governance specification
Repository: `ausdisau/disability-medical-simulations`
Applies to: Project Hope, Disability Medical Simulations, VIRGAL, Shared Visual Simulation Registry, webseries simulation runtime, optional local/model adapters, and future simulation subsystems in this repository

## 1. Purpose

This document defines the standing development authority, release risk classes, deployment gates, rollback rules, and non-delegable safety boundaries for Project Hope and Disability Medical Simulations.

The governing principle is:

> Proceed by default. Stop because the consequence requires it, not because a workflow checkbox traditionally asks for approval.

Routine development should continue without repeated approval prompts. High-consequence clinical, security-sensitive, destructive, irreversible, or materially rights-altering actions require stronger gates.

This governance does not override platform-level permission prompts, repository branch protections, provider security controls, or applicable law. Where an external system itself requires confirmation, that control remains effective.

## 2. Standing development authority

Standing approval covers normal project work including:

- research and literature review;
- specifications and architecture documents;
- implementation plans;
- feature branches and isolated worktrees;
- code changes and refactors;
- tests and verification;
- accessibility improvements;
- visual simulation assets and metadata;
- deterministic simulation behavior outside protected clinical domains;
- documentation and evidence registers;
- draft pull requests;
- Vercel Preview deployments;
- review/fix cycles;
- merge and production release of R0-R2 changes once all applicable gates pass;
- reversible rollback to the most recent verified deployment when a newly introduced production regression is confirmed.

Standing approval does not itself authorize R4 actions, destructive data operations, secret changes, or weakening of protected clinical/rights safeguards.

## 3. Risk classification

Every consequential change is classified before release.

### R0 — Research and documentation

Examples:

- literature reviews;
- scenario research notes;
- evidence registers;
- architecture/design documentation;
- non-executable teaching content;
- developer documentation.

Authority: may proceed automatically through merge and production documentation publication after normal integrity checks.

### R1 — Reversible product behavior

Examples:

- UI and layout;
- accessibility improvements;
- visual assets;
- non-clinical content;
- performance work;
- reversible refactors;
- logging and observability;
- non-clinical persistence metadata.

Authority: may proceed automatically through merge and production once applicable build, accessibility, review, and deployment gates are green.

### R2 — Simulation/world behavior outside protected clinical domains

Examples:

- scenario navigation;
- NPC interaction rules;
- character/world persistence;
- visual interactions;
- VIRGAL non-clinical world state;
- AAC timing mechanics;
- deterministic replay;
- branching/counterfactual mechanics;
- non-clinical model proposal plumbing.

Authority: may proceed automatically through merge and production once deterministic, rights, accessibility, review, and deployment gates are green.

### R3 — Protected clinical or rights domains

Examples:

- physiology models;
- deterioration algorithms;
- emergency authority;
- capacity and consent logic;
- pharmacology;
- airway/device behavior;
- ventilatory behavior;
- clinical decision rules;
- treatment effect models;
- escalation/de-escalation criteria;
- rights-sensitive actions that materially affect patient authority.

Authority: may proceed automatically through research, implementation, automated verification, draft pull request, and Vercel Preview. Production release requires a formal Clinical Release Approval gate.

### R4 — Security-sensitive, destructive, or irreversible operations

Examples:

- deleting production data;
- destructive schema migration;
- replacing a production database;
- credential rotation or revocation;
- changing production secrets;
- exposing or relocating secrets;
- disabling safeguards;
- force-pushing shared history;
- deleting repositories/projects;
- destructive cleanup of production resources;
- irreversible state migration;
- rollback that could discard legitimate newer production data.

Authority: explicit approval is required immediately before execution.

## 4. Mixed-risk changes

A change containing more than one class inherits the highest applicable class.

Examples:

- UI change plus physiology change -> R3.
- accessibility change plus destructive production migration -> R4.
- scenario text plus medication-effect logic -> R3.

Risk cannot be lowered by splitting a single consequential behavior across multiple commits or pull requests.

## 5. Development and deployment pipeline

All executable changes pass through the following sequence:

```text
DESIGN / SPEC
      ↓
IMPLEMENTATION BRANCH / ISOLATED WORKSPACE
      ↓
AUTOMATED TESTS
      ↓
CONSTITUTIONAL INVARIANT CHECKS
      ↓
ACCESSIBILITY VERIFICATION
      ↓
CLINICAL / RIGHTS EVIDENCE GATES WHEN APPLICABLE
      ↓
VERCEL PREVIEW
      ↓
FUNCTIONAL + VISUAL SMOKE TEST
      ↓
CODE REVIEW
      ↓
RELEASE CLASSIFICATION
      ↓
MERGE
      ↓
PRODUCTION RELEASE IF AUTHORISED FOR CLASS
      ↓
POST-DEPLOY VERIFICATION
      ↓
AUTOMATIC REVERSIBLE ROLLBACK IF REQUIRED
```

Preview deployment is an engineering verification environment. Preview does not imply clinical approval, accreditation, public endorsement, or production readiness.

## 6. Build integrity gate

Before merge, all applicable items must pass:

- dependency installation succeeds;
- project build succeeds where a build exists;
- complete automated test suite passes;
- no unresolved Critical or Important code-review finding remains without a documented ruling accepted by the project workflow;
- no missing runtime modules or required assets;
- persistence migrations validate against an isolated test/preview database when relevant;
- deterministic replay tests pass where the changed subsystem participates in replay;
- runtime starts without new fatal errors;
- repository secrets are not introduced into client-side code or source history.

Failure blocks merge/release for all risk classes.

## 7. Constitutional simulation invariants

The following are release-blocking invariants:

1. NPC dialogue cannot write physiology.
2. Narrative generation cannot create patient-authored speech, preferences, consent, refusal, capacity, authority, or treatment ceilings.
3. A visual asset cannot create clinical indication.
4. Equipment visibility or readiness cannot create clinical indication.
5. Equipment availability cannot create authorization.
6. AAC failure cannot create incapacity.
7. Communication latency cannot create refusal or incapacity.
8. Family/supporter presence cannot create substitute authority.
9. Relationship state cannot create consent or clinical authority.
10. Off-screen actors cannot know unseen events without a valid information-propagation path.
11. Emergency authority must be narrow, necessary, proportionate, auditable, and auto-expiring.
12. Model output cannot directly become canonical world or clinical truth.
13. Didactic logic cannot manufacture clinical facts or patient messages.
14. Accessibility failure cannot silently transfer authority to another person.
15. Generated imagery cannot become clinical evidence merely because it appears realistic.

Any regression in these invariants blocks release regardless of risk class.

## 8. Accessibility gate

Every critical learner interaction requires at least one semantic non-pointer route.

Applicable releases must verify:

- keyboard access;
- pointer/touch access;
- screen-reader semantics;
- sequential switch-compatible navigation;
- eye-gaze-compatible target interaction where relevant;
- visible focus;
- captions/transcripts for clinically meaningful spoken content;
- no critical state conveyed only by color;
- no critical state conveyed only by pitch;
- no critical state conveyed only by animation;
- reduced-motion behavior where motion is present;
- low-sensory mode where relevant;
- missing-image fallback preserves the semantic interaction;
- AAC composition preserves the approved timing semantics.

Accessibility review is a release gate, not a post-release enhancement.

## 9. Patient autonomy and rights gate

Patient authority outranks narrative convenience and teaching drama.

Authority order for rights-sensitive conflicts:

```text
patient-authored preference / refusal
supported communication access
capacity / legally valid authority framework
rights safeguards
immediate clinical necessity
system feasibility
educational objective
dramatic or narrative preference
```

This ordering does not mean a patient preference overrides every emergency clinical duty; it means exceptions must arise through explicit clinical/legal authority rather than narrative convenience.

Mandatory rules:

- address the patient directly whenever feasible;
- preserve or restore communication access before interpreting silence;
- record uncertainty rather than invent capacity findings;
- do not infer incapacity from disability, speech difference, AAC failure, response time, atypical movement, or supporter presence;
- do not infer substitute authority from family/support-worker presence;
- respect a valid refusal unless a clearly defined lawful/emergency basis authorizes otherwise;
- emergency authority expires when its qualifying basis no longer applies and supported participation becomes feasible.

## 10. Clinical evidence gate

R3 changes require an explicit clinical release manifest before production.

The manifest records:

```text
clinical domain
evidence snapshot/version
rule/controller version
affected scenarios/characters
applicability assumptions
known uncertainty
guardian bindings
regression tests
clinical reviewer/status
accessibility reviewer/status
lived-experience reviewer/status
release decision
```

Evidence is classified as:

### A. Supported executable behavior

Evidence and governance are sufficient for the proposed deterministic or bounded-stochastic rule.

### B. Supported uncertainty

Evidence supports a possibility/range but not a deterministic rule. The simulator may represent uncertainty but must not collapse it into certainty.

### C. Narrative plausibility only

The concept may shape dialogue, scene framing, or learner uncertainty, but cannot write clinical controller state.

Clinical evidence and disability/lived-experience evidence may answer different questions and must not be silently substituted for each other.

## 11. Pharmacology boundary

The Project Hope Pharmacology Guardian owns medication-effect proposals.

Generative, narrative, visual, NPC, or local-model components may represent that medication-related activity is occurring, but may not independently create or alter:

- drug identity;
- dose;
- route;
- frequency;
- indication;
- contraindication;
- interaction;
- pharmacokinetic/pharmacodynamic effect;
- medication-linked physiology.

Those values must originate from the governed pharmacology/clinical controller layer and pass the applicable evidence and guardian gates.

## 12. Device and procedure boundary

The same authority separation applies to airway, ventilation, resuscitation, invasive devices, and other high-risk clinical procedures.

A scene, hotspot, image, NPC, or model may propose or surface an action. It cannot itself establish:

- indication;
- compatibility;
- safe procedural conditions;
- device setting;
- successful completion;
- physiologic effect.

These remain controller/guardian responsibilities.

## 13. Model and Hugging Face/local-model boundary

Optional local or hosted models may assist with:

- learner speech-to-text;
- non-clinical scene-caption candidates;
- semantic asset search;
- hotspot candidates for author review;
- accessibility transforms;
- bounded NPC/narrative proposals.

Model output remains a proposal and cannot directly write protected domains.

Before enabling a model in a release, the project records:

- provider/repository;
- exact model ID;
- pinned revision/version;
- license status;
- model-card review status;
- known limitations relevant to disability/communication;
- fallback behavior;
- whether any input leaves the local environment;
- privacy classification;
- evaluation results relevant to its intended task.

Model unavailability must not remove the minimum accessible simulation path.

## 14. Merge authority

### R0-R2

Merge is pre-authorized after all applicable gates pass and required reviews are complete.

### R3

Merge of an R3 change may occur when the branch is clearly marked as unreleased/feature-gated and production activation remains impossible until Clinical Release Approval. If merge would immediately activate the protected behavior in production, merge and production release are treated as the same R3 release action and require Clinical Release Approval first.

### R4

No automatic merge/deployment authority is inferred where the merge itself performs or schedules an R4 action.

## 15. Production release authority

### R0-R2

Production release is pre-authorized when:

- all applicable gates are green;
- deployment is reversible;
- the release manifest is complete;
- post-deploy verification is available;
- rollback target is known.

### R3

Production requires `CLINICAL_RELEASE_APPROVED` from an authorized clinical release authority.

An authorized clinical release authority may be:

- the project owner acting explicitly in that role; or
- a formally configured and auditable Clinical Simulation Guardian/reviewer whose authorization scope includes the affected domain.

Absence, timeout, or uncertainty is not approval.

### R4

Explicit approval is required immediately before the operation.

## 16. Vercel Preview gate

R0-R3 development may deploy automatically to Vercel Preview after local/CI integrity checks.

Preview verification must include as applicable:

- deployment reaches `READY`;
- main simulation route loads;
- changed assets resolve;
- runtime initializes;
- event ledger operates;
- persistence responds when enabled;
- AAC controls work;
- semantic fallback works;
- no new fatal build/runtime errors;
- correct release/version metadata is present.

Preview must not be described as clinically approved merely because it is technically successful.

## 17. Production post-deploy verification

Every production release must verify:

```text
deployment READY
critical route loads
required assets resolve
runtime initializes
expected release manifest loaded
event ledger operates
persistence health when enabled
AAC / communication access route works
semantic fallback works
no new critical runtime logs
```

Where monitoring supports it, checks should be automated and time-stamped.

## 18. Automatic rollback authority

Automatic rollback is pre-authorized when all of the following are true:

- the regression was introduced by the new release;
- the prior deployment is known and verified;
- rollback is operationally reversible;
- rollback does not delete legitimate production data;
- rollback does not require destructive schema reversal;
- rollback does not expose/rotate secrets;
- rollback does not weaken rights/clinical safeguards.

Rollback should occur for:

- constitutional invariant regression;
- critical route failure;
- runtime initialization failure;
- serious accessibility regression affecting critical paths;
- corruption of simulation state caused by the new release;
- material mismatch between deployed code and the release manifest.

Automatic rollback is not authorized when it could discard valid newer production data or create an R4 condition.

## 19. Stop conditions

The development system stops and asks for explicit direction only when one of these conditions applies:

1. An R4 action is about to execute.
2. An R3 production release lacks Clinical Release Approval.
3. A clinical-versus-rights conflict remains unresolved after the defined Guardian Mediator process and more than one materially different high-consequence path remains plausible.
4. Evidence is insufficient to choose among materially different high-consequence outcomes and no safe bounded representation of uncertainty exists.
5. External provider/platform controls require interactive confirmation that cannot be delegated.
6. A destructive or irreversible operation is necessary to continue.

Ordinary ambiguity, implementation detail, routine review feedback, reversible refactoring, preview deployment, or non-critical design choice is not a stop condition.

## 20. Release manifest

Every production deployment must have a machine-readable release manifest.

Minimum schema:

```json
{
  "releaseId": "string",
  "releasedAt": "ISO-8601 timestamp",
  "git": {
    "repository": "ausdisau/disability-medical-simulations",
    "commit": "40-char SHA"
  },
  "deployment": {
    "provider": "vercel",
    "project": "string",
    "deploymentId": "string"
  },
  "riskClass": "R0|R1|R2|R3|R4",
  "versions": {
    "simulation": "string",
    "virgal": "string",
    "clinicalController": "string|null",
    "rightsGuardian": "string|null",
    "guardianMediator": "string|null",
    "pharmacologyGuardian": "string|null",
    "visualRegistry": "string|null",
    "evidenceSnapshot": "string|null"
  },
  "models": [
    {
      "provider": "string",
      "model": "string",
      "revision": "string"
    }
  ],
  "gates": {
    "build": "pass|not_applicable",
    "tests": "pass|not_applicable",
    "invariants": "pass|not_applicable",
    "accessibility": "pass|not_applicable",
    "clinical": "pass|pending|not_applicable",
    "rights": "pass|not_applicable",
    "codeReview": "pass|not_applicable",
    "preview": "pass|not_applicable"
  },
  "rollbackTarget": {
    "releaseId": "string|null",
    "deploymentId": "string|null"
  }
}
```

For R3 production releases, `gates.clinical` must be `pass`. `pending` is permitted only for non-production preview/release-candidate manifests.

## 21. Release labels

The following labels have defined meanings:

### DEVELOPMENT

Feature branch or local work. No release claim.

### PREVIEW

Technically deployed for verification. No clinical approval implied.

### RELEASE_CANDIDATE

Engineering gates are complete; remaining risk-class-specific release gate(s) are identified.

### READY_FOR_CLINICAL_RELEASE

R3 engineering, rights, accessibility, evidence, and review gates are complete, but clinical production authorization has not yet been granted.

### CLINICAL_RELEASE_APPROVED

Authorized R3 production release may proceed.

### PRODUCTION_VERIFIED

Production deployment passed post-deploy verification.

### ROLLED_BACK

Release was reverted to a previously verified deployment under this governance.

## 22. Auditability

For consequential releases, the project should preserve:

- risk classification;
- commit SHA;
- pull request/review references;
- automated test results;
- accessibility verification status;
- clinical/rights review status where applicable;
- release manifest;
- deployment ID;
- rollback target;
- rollback event/reason when used.

Hidden model reasoning is not an audit artifact. Audit records contain observable inputs, decisions, rules, evidence references, and outcomes.

## 23. Relationship to existing VIRGAL authority model

This governance preserves the existing VIRGAL ordering:

```text
protected patient facts / authored choices
        ↓
deterministic world and clinical state
        ↓
reviewed clinical / rights / personhood / accessibility rules
        ↓
bounded NPC / didactic / model proposals
        ↓
narrative and visual rendering
```

No deployment policy may invert this ordering.

## 24. Relationship to Shared Visual Simulation Registry

SVSR is governed as follows:

- registry schemas, rendering, accessibility, and non-clinical interaction mechanics are ordinarily R1/R2;
- visual evidence gating that only controls UI availability is ordinarily R2;
- any SVSR change that alters protected clinical indication/effect logic is R3;
- image/provenance replacement is R1 unless it changes clinical truth or requires destructive production mutation;
- missing-image fallback and semantic access are release-blocking accessibility requirements;
- Vercel Preview is automatically authorized;
- R0-R2 SVSR production release is authorized after gates pass;
- no visual/model component gains authority over protected domains.

## 25. Governance changes

Changes that merely clarify wording without changing authority may follow R0 governance.

Changes that weaken a constitutional invariant, broaden automatic clinical authority, remove an R3/R4 gate, or expand destructive permissions are themselves treated as R4 governance changes and require explicit approval before becoming operative.

## 26. Acceptance criteria

This governance is correctly implemented when:

1. Every consequential release is assigned R0-R4.
2. Mixed-risk changes inherit the highest class.
3. R0-R2 can progress through production without repetitive approval once all gates pass.
4. R3 can progress automatically to Preview/Release Candidate but cannot activate in production without Clinical Release Approval.
5. R4 actions always require explicit approval immediately before execution.
6. Constitutional invariants are automated release blockers where technically testable.
7. Accessibility is a deployment gate rather than optional polish.
8. Patient communication failure cannot create incapacity or transfer authority.
9. Models, visuals, NPCs, and narrative layers remain non-sovereign over protected domains.
10. Every production release has a machine-readable manifest and known rollback target.
11. Reversible rollback to a verified prior deployment is pre-authorized for confirmed regressions.
12. Rollback that risks legitimate data loss becomes R4 and stops for approval.
13. R3 clinical evidence distinguishes executable behavior, supported uncertainty, and narrative plausibility.
14. Governance itself cannot be weakened silently.

## 27. Standing operational rule

Unless a defined stop condition is present, the default action is to continue through the next applicable engineering gate.

Normal workflow therefore becomes:

> classify → implement → test → review → preview → verify → merge/release according to risk class → post-deploy verify → rollback automatically when a reversible regression requires it.
