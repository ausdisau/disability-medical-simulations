# Disability Medical Simulations

Accessible, person-first respiratory simulation for disability medical education.

## Current application

**Rohan: Consent, Crisis and Recovery** is a deterministic multi-branch simulation spanning:

1. accessible NIV and tracheostomy education;
2. decision-specific consent;
3. acute respiratory deterioration;
4. respiratory arrest and CICV declaration;
5. emergency substitute decision-making;
6. active-resuscitation transport to theatre;
7. emergency surgical airway;
8. bounded PICU family briefing;
9. communication restoration and re-engagement.

The application is fictional and educational. It does not provide medication doses, ventilator settings or procedural instructions.

## Decision architecture

Every branch updates three persistent ledgers:

- **Body:** airway, ventilation, oxygenation, secretion burden, respiratory reserve, cardiac reserve and comfort.
- **Voice:** communication reliability, latest reliable message, consent scope and stated priorities.
- **System:** escalation, team readiness, theatre readiness, AAC availability and family liaison.

The engine also carries forward:

- **crisis debt** for unresolved risk and delayed action;
- **relationship trust** for Rohan–team and mother–team interactions;
- full node history and an event log;
- automatic physiological consequences when a new crisis node is entered.

Incorrect choices remain visible and recoverable. The simulation does not use a single hidden “correct object” or moral score.

## Source layout

```text
index.html              Application shell and accessible controls
styles.css              Responsive, low-sensory and reduced-motion presentation
src/rohan-tree.js       Scenario graph, choices, consequences and initial state
src/runtime.js          Deterministic branch engine and persistent ledgers
src/app.js              Browser rendering and interaction layer
src/scenarios.js        Earlier standalone scenarios and action stations
tests/runtime.test.mjs  Runtime, persistence and accessibility-state tests
vercel.json             Vercel routing and security headers
```

## Run locally

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Tests

```bash
npm test
```

The test suite covers:

- body, voice and system ledger initialisation;
- communication pauses and AAC restoration;
- branch transitions and persistent consequences;
- automatic deterioration effects;
- crisis-debt repair;
- decision-integrity outcome summaries;
- evidence-gated station compatibility with earlier scenarios.

## GitHub workflow

Runtime tests run on pushes to `main` and on pull requests using Node.js 20.

Recommended branch workflow:

```text
feature/* → pull request → automated tests → review → main
```

Clinical, accessibility and lived-experience review should remain separate approval gates from code review.

## Vercel deployment

Import `ausdisau/disability-medical-simulations` into Vercel as a separate project.

- Framework preset: **Other**
- Build command: leave empty
- Output directory: `.`
- Install command: leave empty
- Production branch: `main`

Every pull request can then receive an isolated Vercel Preview Deployment. `vercel.json` supplies clean URLs and baseline security headers.

## Required review before educational use

- paediatric respiratory and difficult-airway clinical review;
- speech pathology and AAC review;
- child-life and paediatric psychology review;
- disability lived-experience co-design;
- NSW consent and emergency-authority legal review;
- WCAG and assistive-technology testing;
- facilitator and psychological-safety review.

Completion demonstrates communication, reasoning and systems-learning objectives only. It does not certify clinical competence.
