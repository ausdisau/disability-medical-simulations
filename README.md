# Disability Medical Simulations

Accessible, person-first respiratory simulation for disability medical education.

## Included cases

- **I Need Suction** — adult ICU communication and airway-safety scenario.
- **The Alarm Is Not the Story** — fictional paediatric complex-airway scenario.

## Core principles

- Personal baseline, acute change, communication access and system readiness share one state model.
- AAC and communication access remain explicit simulation state.
- Equipment is evidence-gated: `available → selected → checked → assigned → committed`.
- Incorrect choices create recoverable learning branches rather than punitive failure.
- The project is educational and does not provide medication doses, ventilator settings or procedural instructions.
- The patient remains the primary speaker unless a lawful alternative decision pathway is explicitly established.

## Stateless data contract

Project Hope is a **memory-only simulation platform**.

- no simulation database
- no server-side session persistence
- no autosave
- no resumable account history
- no browser `localStorage` or IndexedDB session retention
- no analytics payloads containing simulation content

The running simulation exists only in application memory. Reloading, resetting or discarding the session destroys the current runtime state.

The only supported durable output is a **user-initiated JSON export**. The platform does not retain a copy of exported JSON.

JSON exports declare:

```json
{
  "format": "project-hope-simulation",
  "dataOrigin": "fictional_synthetic",
  "fictionalPatient": true,
  "containsRealPatientData": false,
  "storagePolicy": {
    "runtime": "memory_only",
    "platformRetention": "none",
    "export": "user_initiated_json_only"
  }
}
```

Do not use Project Hope to store identifiable patient records, consent records, device streams or clinical documentation.

## Run locally

No database or server runtime is required.

```bash
npm test
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Tests

```bash
npm test
```

The runtime tests cover clock pausing, communication restoration, evidence-gated station transitions, safe and unsafe decisions, accessible missing-choice feedback and stateless JSON export structure.

## Vercel

Import `ausdisau/disability-medical-simulations` as a static Vercel project.

- Framework preset: **Other**
- Build command: leave empty
- Output directory: `.`
- Install command: optional (`npm install` is only needed for test/CI workflows)
- Database: **none**
- Simulation persistence environment variables: **none**

`vercel.json` supplies security headers and clean URL settings. Feature branches should be deployed as Preview deployments before promotion to production.

## External AI / evidence adapters

Any future hosted AI or evidence provider must be treated separately from Project Hope's storage policy because a remote provider may process or retain request data under its own terms.

Default requirements for future adapters:

- synthetic or de-identified simulation content only during R&D
- server-side secrets only; never ship provider keys to the browser
- explicit provider-retention review before enabling an adapter
- external model output is advisory and cannot write canonical physiology, consent/capacity, patient-authored communication or actuator state
- failure degrades to `UNKNOWN`, local simulation state or human review rather than invented certainty

Local/open models are preferred where they meet the research need and validation requirements.

## Review status

Prototype content requires formal clinical, lived-experience and accessibility review before use as accredited training. Completion demonstrates awareness and communication learning only; it does not certify clinical competence.
