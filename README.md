# Project Hope Emulator — v1.0.0-alpha.1 RC

Project Hope is a fictional, synthetic disability-medical simulation platform focused on clinical reasoning, communication access, patient agency, system readiness and recoverable error.

## Alpha RC architecture

- React 18 + Vite presentation shell.
- Deterministic framework-independent runtime in `src/runtime.js`.
- Four-domain model: clinical context, communication access, agency and system readiness.
- Dual clocks: clinical time continues while fictional patient AAC composition/scanning pauses learner-evaluation time; facilitator pauses freeze both.
- Personhood Guardian audit in `src/guardian.js` using status words rather than worth/personhood scores.
- Evidence-gated stations: `available → relevant → assigned → committed → applied`.
- Ordered in-memory command log with deterministic replay against the same scenario/rule-pack version.
- Memory-only session state; no server simulation database, autosave, localStorage or IndexedDB session retention.
- User-initiated JSON is the only durable simulation output.

## Data lifecycle

The simulation is intentionally stateless across sessions.

```text
Scenario definition
      ↓
In-memory runtime
      ↓
Clinical + access + agency + system state
      ↓
[ Export JSON ]  or  [ Discard ]
```

Project Hope does not retain a copy of exported JSON. Remote AI/evidence providers, if introduced later, require separate provider-side processing and retention review.

## Safety and authority hierarchy

1. Protected patient facts and authored choices.
2. Deterministic structured state and ordered command log.
3. Clinically and lived-experience-reviewed rule pack.
4. Bounded intelligence proposals.
5. Narrative, visual and interface presentation.

The UI or a generative model must not manufacture patient speech, consent, refusal, capacity findings, physiology or clinical authority.

Core invariants include:

- no response = `UNKNOWN`;
- communication failure ≠ incapacity;
- supporter presence ≠ substitute authority;
- equipment availability ≠ indication;
- patient report is clinical data;
- disability ≠ poor prognosis or low quality of life;
- successful intervention ≠ case resolved.

This prototype does not provide medication doses, ventilator settings or procedural technique and is not a substitute for current local protocols, clinical judgment or qualified supervision.

## Included fictional cases

- **I Need Suction** — adult ICU communication and airway-safety scenario with Maya Chen.
- **The Alarm Is Not the Story** — paediatric complex-airway scenario with Rohan Malik. The opening state intentionally keeps the meaning of Rohan's observed movement and communication `UNKNOWN`; the runtime does not fabricate a patient message.

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Verify

```bash
npm test
npm run build
```

The alpha RC checks cover:

- dual-clock accessibility timing;
- facilitator pause semantics;
- no fabricated patient response after AAC interruption;
- evidence-gated station lifecycle;
- cause-led branching without false case closure;
- deterministic command-log replay;
- Personhood Guardian repair behavior;
- fictional/stateless JSON export boundaries.

GitHub Actions runs tests and the Vite production build on pull requests and release/refactor branches.

## Accessibility

The interface includes semantic regions, visible focus, reduced-motion, low-sensory and large-text modes. Meaning is not encoded by color alone. Communication controls and patient-authored information remain visually distinct from supporter input and model inference.

Large-text mode reflows the dashboard rather than shrinking type. The patient/primary scene remains the dominant visual anchor.

## Visual Truth

The v1 alpha React shell is compatible with the planned Visual Truth development workflow. Visual Truth must remain development-only and must not be statically imported into production paths. Approved visual edits should be translated into durable React/CSS source and checked at desktop, iPad and phone breakpoints before release.

## Vercel

The app is a standard Vite project. Deploy feature/release branches as Vercel Preview deployments before merge or production promotion.

The repository contains no Project Hope simulation database configuration in this release candidate.

## Review status

`v1.0.0-alpha.1` is a release candidate for research and usability testing. It requires formal clinical, lived-experience, accessibility and security review before any accredited training use. Completion does not certify clinical competence.
