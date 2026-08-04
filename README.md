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

Serve the repository root with any static file server. For example:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Tests

```bash
npm test
```

The runtime tests cover clock pausing, communication restoration, evidence-gated station transitions, safe and unsafe decisions, and accessible missing-choice feedback.

## Vercel

Import `ausdisau/disability-medical-simulations` as a new Vercel project.

- Framework preset: **Other**
- Build command: leave empty
- Output directory: `.`
- Install command: leave empty

`vercel.json` supplies security headers and clean URL settings.

## Review status

Prototype content requires formal clinical, lived-experience and accessibility review before use as accredited training. Completion demonstrates awareness and communication learning only; it does not certify clinical competence.
