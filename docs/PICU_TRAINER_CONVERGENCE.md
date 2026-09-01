# PICU-Trainer → Project Hope v1 Alpha Convergence

## Decision

`ausdisau/PICU-Trainer` contributes reusable presentation and training-system assets to Project Hope. It does **not** replace the Project Hope runtime.

```text
ausdisau/PICU-Trainer
        │
        ├── UI / navigation patterns
        ├── IAS design language
        ├── canonical station items 01–20
        ├── facilitator UX patterns
        └── accessibility patterns
        │
        ▼
PROJECT HOPE v1 ALPHA CORE
        │
        ├── deterministic runtime
        ├── clinical / communication / agency / system domains
        ├── Personhood Guardian
        ├── bounded VIRGIL proposals
        ├── dual clocks
        ├── UNKNOWN semantics
        ├── deterministic replay
        ├── evidence / rights gates
        ├── memory-only lifecycle
        └── user-initiated JSON export
```

## Source provenance

- Repository: `ausdisau/PICU-Trainer`
- Reviewed revision for this port: `80521c7a234864fa6996171ea024f895d33919d3`
- Station source: `artifacts/picu-lms/src/lib/narrative-data.ts`
- Design-system source: `artifacts/ias-design-system`

The PICU source contains more material than this alpha port. Project Hope intentionally imports only station items **01–20** for the canonical first pass.

## Imported

1. Eight-section navigation model: Orientation, Central PICU Scene, Airway, Breathing & Equipment, Circulation, Integrated Scenario, Debrief, Completion.
2. Twenty Instrumental Action Station items from 01 through 20.
3. IAS domain semantics: airway, breathing/equipment and circulation.
4. Evidence-lock presentation: locked controls stay visible and explain missing evidence.
5. Facilitator/source-inspector concepts.
6. Accessibility patterns including high contrast, reduced motion, larger text and semantic navigation regions.

## Deliberately excluded

The following PICU-Trainer subsystems are **not** imported into Project Hope:

- `localStorage` persistence from `CourseContext`;
- resumable course/session records;
- API persona routes or persona stores;
- real-person identity, address, health, NDIS or consent fields;
- `jonathan-persona` / `jonathan-sim` real-person-oriented modules;
- patient-specific narrative text as authoritative simulation state;
- medication doses, ventilator settings or procedural technique;
- any assumption that visual assets establish anatomy, physiology, indication or equipment readiness.

This preserves the Project Hope rule that the platform is stateful **only while the simulation is running** and forgets the run unless the user explicitly exports JSON.

## Station adaptation rule

PICU-Trainer station titles and purposes are used as source material, but Project Hope genericises person-specific wording. Each station carries source repository/revision metadata and an alpha-review status.

Equipment state remains separate from treatment state:

```text
available ≠ indicated
relevant ≠ authorised
assigned ≠ completed
committed ≠ effective
applied ≠ case resolved
```

Two stations are explicitly evidence-locked in the first port:

- `03` Alternative emergency airway: requires the current airway plan (`04`) to be applied first.
- `18` Defibrillator/AED: requires reassessment plus supporting breathing/circuit evidence before the station becomes relevant.

These are educational gates, not real-world clinical algorithms.

## VIRGIL boundary

`src/virgil.js` is a bounded proposal layer. It may surface known/unknown evidence, ask one safe next question and suggest educational action IDs. It may not:

- write canonical physiology;
- manufacture patient speech;
- infer consent, refusal or incapacity;
- grant supporter authority;
- authorise treatment;
- convert equipment availability into indication.

## JSON output

The JSON export includes:

- canonical runtime state;
- evidence state;
- 20 IAS definitions and current station states;
- PICU-Trainer source provenance;
- current VIRGIL proposal;
- Personhood Guardian audit;
- command log and event timeline;
- memory-only storage policy.

No server or browser copy of the export is retained by Project Hope.

## Review gates before merging into the v1 alpha release branch

- tests and Vite production build pass;
- station 01–20 source mapping is reviewed;
- keyboard and screen-reader traversal is checked across the 20-station layout;
- high-contrast, reduced-motion and large-text modes are checked;
- no persistence or real-person persona code is present;
- disability-led lived-experience review confirms the UI does not make equipment more prominent than the person;
- clinical review confirms station descriptions remain principle-level and do not imply unsafe procedural shortcuts.
