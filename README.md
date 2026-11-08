# Disability Medical Simulations

Accessible, person-first respiratory simulation for disability medical education.

## Included cases

- **I Need Suction** — adult ICU communication and airway-safety scenario.
- **The Alarm Is Not the Story** — fictional paediatric complex-airway scenario.

## Core principles

- Personal baseline, acute change, communication access and system readiness share one state model.
- AAC pauses the simulation clock.
- Equipment is evidence-gated: `available → selected → checked → assigned → committed`.
- Incorrect choices create recoverable learning branches rather than punitive failure.
- The project is educational and does not provide medication doses, ventilator settings or procedural instructions.

## Run locally

Install server dependencies, then serve the repository root with a local Vercel-compatible runtime when testing persistence.

```bash
npm install
npm test
```

For the static-only simulation, any static file server remains sufficient:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Tests

```bash
npm test
```

The runtime tests cover clock pausing, communication restoration, evidence-gated station transitions, safe and unsafe decisions, and accessible missing-choice feedback.

Run the focused VIRGAL guardian suite with:

```bash
npm run test:guardian
```

## Project Hope persistence

RC0.2 adds an **optional, server-side Neon Postgres persistence layer** for anonymous simulation sessions, event history and resumable world-state snapshots. Persistence is deliberately off unless `ENABLE_SIM_PERSISTENCE=true` is configured server-side.

The database schema is in `db/001_simulation_persistence.sql`. The Vercel Function is `api/simulation.js`, and the browser-side adapter is `src/persistence.js`.

The persistence layer is designed for fictional educational simulation state. Do not use it as a repository for identifiable patient health records or consent records without a separate privacy, security and clinical-governance design.

Required server environment variables:

```text
DATABASE_URL=<Neon connection string>
ENABLE_SIM_PERSISTENCE=true
```

`DATABASE_URL` must never be prefixed with `VITE_` or otherwise exposed to browser JavaScript.

## VIRGAL Hybrid Authority C guardrails

The guarded runtime is opt-in through `createGuardedRuntime(...)` and uses `config/guardian_config.json` as the authority-routing contract.

Hard boundaries:

- VIRGAL owns bounded ordinary-world scheduling, not clinical truth.
- Clinical physiology, medication/procedure state, consent, capacity, substitute authority, treatment ceilings and patient-authored communication remain outside VIRGAL write authority.
- AAC delay or access failure never creates incapacity, consent, refusal or substitute authority.
- Foreign regulatory sources such as DailyMed are evidence-only and do not satisfy NSW/Victorian local-protocol gates for exact medication or procedure logic.
- Public healthcare data cannot write patient state, diagnosis, consent, capacity, clinical orders or treatment outcomes.
- Replayable stochastic variation is limited to already-permitted world/social behaviour.
- Identical scenario/seed/trace/log inputs must reproduce the same canonical state hash.
- The 3D world is never the sole representation; guardian decisions require accessible semantic/text explanations.

The JSON Schema in `config/guardian_config.schema.json` documents the static configuration contract. Runtime enforcement uses the dependency-free semantic validator in `src/virgal/guardian-config.js` so the browser-facing simulation does not depend on Node-only schema tooling.

## Vercel

Import `ausdisau/disability-medical-simulations` as a Vercel project.

- Framework preset: **Other**
- Build command: leave empty
- Output directory: `.`
- Install command: `npm install`
- Server environment: add `DATABASE_URL` and `ENABLE_SIM_PERSISTENCE`

`vercel.json` supplies security headers and clean URL settings. Feature branches should be deployed as Preview deployments before promotion to production.

## Neon

A dedicated Neon project should be used for Project Hope rather than sharing a production database with unrelated Australian Disability services. Apply the schema on an isolated Neon branch first, validate the API against that branch, then promote the migration through the normal review process.

## Review status

Prototype content requires formal clinical, lived-experience and accessibility review before use as accredited training. Completion demonstrates awareness and communication learning only; it does not certify clinical competence.

## Development environment and secrets

A safe example environment file is provided as `.env.dev.example`. Do **not** commit real secrets into the repository.

If a secret is accidentally committed, rotate or revoke it with the provider immediately and purge it from repository history before sharing the repository.
