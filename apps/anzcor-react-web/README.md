# AURA Intervention-Level Preview — Project Hope

**Status:** Draft PR / educational synthetic only. Does not modify the original static simulator or existing Neon persistence.

## Contract

- `AURA = MAIRA + VIRGAL` as a single product name; the engines have separated authority.
- **VIRGAL** remains the sole owner of synthetic clinical facts, command/event ledger, clock, deterministic replay and outcome commits.
- **MAIRA** is strictly read-only: synthesises observable facts and asks one JMO supervision question; it cannot mutate clinical state.
- **Guardian Mediator** scopes evidence, rights, personhood, family, and pharmacology decisions; high-risk procedure/dose/device branches remain held without local source and clinical review.
- Patient identity and last reliable AAC instruction `WAIT` are immutable. Family member presence does not grant medical authority.
- Initial Rohan branch: fictional non-canonical 10:16:50 verified asystole, CPR continuing, provisional supraglottic airway, no ROSC. Original canonical history unchanged.
- No model-authored physiologic evolution. Facilitator can enter a clearly labeled *alternative* ROSC teaching branch only after qualified airway and perfusion reassessments are recorded.

## Files and tests

```
apps/anzcor-react-web/
  index.html
  embed.html
  host-wrapper.html
  vite.config.mjs
  package.json
  src/
    main.jsx
    runtime.mjs
    style.css
  tests/
    runtime.test.mjs
  docs/
    AURA-RELEASE-GATES.md
```

```sh
cd apps/anzcor-react-web
npm install
npm test
npm run dev
npm run build
```

`embed.html` renders the same isolated cockpit. `host-wrapper.html` uses an iframe with no parent-child data messaging or device access.

## Provenance and release safety

- Rohan scenario adapted from the user's *fictional* non-canonical chat branch, not copied from a patient medical record.
- Clinical principle-level source: ANZCOR Paediatric Advanced Life Support (April 2026); local NSW paediatric protocols not supplied/verified.
- Interface map: `ANZCOR_React_HTML_Integration_Map.md` (user-supplied); preserve existing root routes, `api/simulation.js`, `db/001_simulation_persistence.sql`, original scenarios.
- CBCP: `NSW_Disability_Admission_and_Braided_Care_Policy_Framework_v0_1.docx` (Australian Disability Ltd, 20 Oct 2026): *proposed*, **not issued by NSW Health**; paediatric specialist approval required.
- Important: this preview implements **educational** action gating, not a validated paediatric medication or procedural engine. Its hard-coded facilitator-controlled recovery branch cannot predict survival. Source pack and medication chart integration are excluded.

## Known limits

No medication doses, administration simulation, actual suction/airway maneuvers, invasive FONA, energy parameters, medical device connection, staff privilege management, consent decisions, organ injury prediction, certified competency assessment, authenticated sessions, live database, or production deployment.

The `CHECK → ASSIGN → COMMIT → REASSESS` experience records *synthetic training actions only*; no unverified clinical effect is produced. Clinical and paid disability-led review, browser/screen-reader/switch access testing, and security checks remain release gates.


## Alex Morgan v0.2 — High fever and differential branch

The separate adult fictional Alex scenario now opens at 39.4°C synthetic fever with marked new lethargy and a chest infection working diagnosis. The React cockpit offers parallel urgent assessment, CERS/senior escalation, AAC repair, infection source evaluation, and facilitator-gated alternatives for viral, bacterial, mixed and aspiration-related causes. **No diagnosis, clinical physiological response, order or treatment is generated** by selecting or revealing educational evidence. See `docs/ALEX-FEBRILE-INFECTION-DIAGNOSTIC-TENSION.md`. Rohan's DMD resuscitation case is unchanged.

## Scenario director perspective and clinician authority

The app's initial role is `SCENARIO_DIRECTOR`, explicitly a **non-clinician** educational role. The person using the application can direct and inspect fictional stories without claiming to be a doctor, nurse or other licensed practitioner. `JMO` is an **optional fictional trainee persona** for supervised clinical teaching; it never implies the operator's real-world qualifications. `FACILITATOR` is an **unauthenticated teaching sandbox toggle** for separate synthetic branches, not professional authorisation. Qualified fictional staff are responsible for clinical steps, and the engine never connects to a real patient, medicine administration or medical device. All local protocol and external clinical/lived-experience reviews remain pending.

## Deterministic cascade crisis (Alex case only)

The **non-clinician scenario director** may trigger a four-cue synthetic crisis with an explicitly recorded seed. Each cue is committed separately to Alex's fictional clinical/event record and time; cues include respiratory worsening, an unverified monitor alarm, a new clinician-authored fictional low blood pressure, and AAC disruption. Use `NEXT_CASCADE` to reveal each subsequent event or `PAUSE` to freeze. No random death, arrest, shock diagnosis, patient speech or treatment result is introduced. Select qualified workstream stations for urgent review while AAC is restored concurrently. Full specifications: `docs/ALEX-SEEDED-CASCADE-CRISIS.md`.
