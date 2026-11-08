# AURA evidence-to-scenario review: source contract and acceptance
**Draft design specification — 9 Nov 2026. NOT clinical signoff.**

## Purpose
Translate carefully inspected and bounded PubMed/JSTOR/YouTube sources into *proposed educational improvements*, then gather separate clinical, disability-led, facilitator, accessibility and governance review. No review note, source, model suggestion or multimedia observation can directly alter VIRGAL patient physiology, author a patient message, order medicines or unlock interventions.

## Five review domains and signoff criteria
1. **Clinical (NSW qualified clinical reviewer):** baseline vs deterioration; paediatric vs adult scope, local resuscitation/airway/medicine protocols; role authorisation; causality and competing hypotheses; no outcome manipulation.
2. **Disability-led (paid relevant lived-experience reviewer):** authenticity; communication, choice, refusal and pain; no impairment-suit equivalence, no distress theatre, no disability-related futility; reject tokenistic participation.
3. **Facilitator (qualified educator):** observable learning goals; appropriate learner scope; functional decision points; flexible pathways and justified timing; psychological safety and debrief.
4. **Accessibility (lived AAC/AT + specialist):** keyboard, switch, eye gaze, screen reader, 200–400% zoom, captioning, low sensory, reduced-motion, no pressure time penalty for access.
5. **Governance (clinician/data/governance owner):** evidence identifiers and inspection labels, NSW policy scope, authorisation, consent/privacy, copyright, incident/patient-data boundaries, release review.

## Required state sequence
```
SOURCE_RETRIEVED (label inspection)
  -> DESIGN_CROSSWALK_PROPOSED (case, specific educational element, limits)
  -> LOCAL_REVIEW_INPUTS (non-authenticated notes; no approval)
  -> REPAIR_REQUIRED or LOCAL_DRAFT_COLLECTED
  -> EXTERNAL_CREDENTIALLED_REVIEW (not implemented in app; GitHub/institution)
  -> EXPLICIT_HUMAN_RELEASE_APPROVAL (not implemented)
```

The in-app dashboard NEVER labels reviews approved. Its JSON export includes an unsigned ledger with source IDs, reviewer-domain notes, severity, checks still missing and a hard-coded false for `simulationReleaseApproved`. A passing test/build never substitutes for institutional authorisation.

## Scenario-specific acceptance
**Rohan — non-canonical age 12 DMD asystole:** protect CPR, provisional supraglottic ventilation, `WAIT`, family support, no fabricated ROSC, no shocks for asystole; any paediatric dosing, FONA and patient-specific prognosis must remain held without verified local protocol. The Sydney Health empathy suit is an ethical teaching comparator only, not a mechanism for DMD.

**Alex — fictional adult cerebral palsy respiratory/AAC:** baseline and new breathing concern must be separated; choose and verify AAC and communication partner setup, direct address and consent, appropriate escalation; avoid extrapolating adult physiology from paediatric CP research, or importing VR hand scoring into emergency decisions.

## Proposed educator acceptance tests (not yet executed by humans)
- Learner can use keyboard/switch to select and inspect a station without committing treatment.
- Stopping a scenario or reopening a review page does not advance physiology or erase `WAIT`.
- Failure to provide eye gaze/switch access is a remediable barrier; no auto-incapacity.
- A reviewer can cite a video transcript and note what was not actually visually inspected.
- A clinical reviewer sees locked medication and invasive procedures and a readable local-protocol gap.
- A facilitator can select distinct scenario branches and debrief without time pressure for access.
- An unsigned note labelled `LOCAL_DRAFT_COLLECTED` cannot be reinterpreted as clinical approval.

## Real-world signoff path
Record real reviews in GitHub PR review threads or a separately authenticated institutional system with named role, dated evidence, conflict resolution, revision SHA and independent acceptance. No named clinical reviewer, disabled co-designer, facilitator or authorising officer has yet been verified for this PR. Do not fabricate them.

## Media provenance
See `YOUTUBE-SOURCE-ANALYSIS-20261109.md`; primary reference visual+transcript inspected, the CP VR video transcript inspected, others title/description only. Do not copy footage, audio, copyrighted text, stills or logos into the application without permission.

## Versioning and output
`review.mjs` is pure; it does not import `runtime.mjs` and cannot commit simulated physiology. `ReviewBoard.jsx` creates in-memory notes and an on-demand JSON export only (no localStorage, cookies, remote save, plugin actions or GitHub review impersonation). Tests cover missing signatures, cross-case evidence, role checks, video inspection labels, and hard safety invariants.
