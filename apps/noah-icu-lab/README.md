# Noah ICU · Code Blue & Heart–Lung Lab

**Web application release 0.4.0.** An accessible, browser-local **adult ICU teaching simulator** with three Code Blue training rooms: cerebral palsy, Duchenne muscular dystrophy, and a generic adult bag–valve–mask skills case. It connects an inspectable two-compartment lung model to ventilator controls, manual bag ventilation, simplified circulation and bedside care decisions. The application release is separate from the retained `noah-physiology-0.3` engine version.

**Educational prototype: synthetic physiology, no real-patient or device connection, and no clinical validation.** Input ranges are software experiment bounds, not recommended treatment settings. Completing an exercise does not establish clinical competence.

## Additive repository integration

This application is self-contained under `apps/noah-icu-lab`. It can be added to `ausdisau/disability-medical-simulations` without changing the existing vanilla application's entry point, scripts or dependencies. Run this application's commands from its own directory. A repository-level workspace or deployment change is not required.

The scaffold contains the cardiopulmonary and room-coordination features, numerical and bedside-workflow tests, a minimal React/Vite web entry point and evidence documentation. It does not include desktop packaging, the legacy simulation source, source attachments, personal records, hosting identity, credentials or an external feedback-service owner link. No service account or API key is required.

The sibling [Noah Code Blue mobile companion](../noah-code-blue-mobile/README.md) is a separate React Native / Expo application. It shares the three room identities and copied physiology engine, with its own local sessions and mobile controls. Both clients now import the same six-module unscored curriculum from `shared/noah-resuscitation/curriculum.ts`; run builds from a full repository checkout. The two clients do not synchronise live room state. Its README documents native build requirements, initialization differences and device-validation limits.

## Run and build

Use Node.js 22.12 or later and npm. This scaffold was verified using Node.js 24.22.1. Dependencies are pinned to the versions used for the verified build, and `package-lock.json` preserves their resolved dependency graph.

```bash
cd apps/noah-icu-lab
npm ci
npm run dev
```

Open the local URL printed by Vite. The development entry point requires HTTP; opening the source `index.html` directly will not load the TypeScript application.

```bash
npm run typecheck
npm test
npm run build
```

The production build emits **`dist/index.html`**, with its JavaScript and CSS inlined. Download or copy that completed file to use the simulator offline. It can also be hosted as an ordinary static HTML page; `base: './'` avoids a required root-domain path. Public evidence links open external websites when selected and therefore require a connection. They are not required for the simulation to run.

To inspect the built version through a local server:

```bash
npm run preview
```

No server, database or live connector is part of this application. Room sessions and optional reflection text stay in the current browser page. Refreshing or closing the page discards all rooms; resetting a room clears that room's current run and coordination record. JSON and CSV export are explicit user actions; there is no background upload of clinical notes.

### Optional combined web and mobile preview

The standard web build works independently. To add the mobile client's web preview at `/mobile/`, build both applications and copy the **contents** of the mobile export into the web build. The following POSIX-shell commands start from the repository root; use Node.js 22.13.0 or later to satisfy both applications' requirements:

```bash
cd apps/noah-code-blue-mobile
npm ci
npm run export:web
cd ../noah-icu-lab
npm ci
NOAH_MOBILE_PREVIEW=1 npm run build
mkdir -p dist/mobile
cp -R ../noah-code-blue-mobile/dist-web/. dist/mobile/
npm run preview
```

Open the preview URL printed by Vite. The room-board section now includes **Open React Native companion**, which opens `/mobile/` on that host. `NOAH_MOBILE_PREVIEW=1` enables this link at build time; it does not build or copy the mobile application. The link is hidden when the web lab is opened as a local `file:` document.

The mobile project's Expo configuration uses the production base URL `/mobile`. This combined layout assumes the web lab is served at the host root. Serve the complete `dist` directory over HTTP, including `dist/mobile/index.html` and `dist/mobile/_expo/…`; the mobile export is an asset tree rather than a single offline HTML file. A different hosting prefix requires a matching mobile configuration and a fresh export, as described in the [mobile hosting instructions](../noah-code-blue-mobile/README.md#hosting-alongside-the-web-lab-at-mobile).

Re-copy the mobile assets after rebuilding the web lab because that build replaces `dist`. The combined preview remains two independent local clients; it does not provide cross-device room coordination or a native Android/iOS binary.

## Use the simulator

1. Open **Code Blue rooms** and enter the CP airway review, DMD arrest drill, or generic adult BVM arrest drill. Read the baseline, communication method and personal priorities. Each web scenario starts from a preconditioned supported baseline; the displayed model clock includes this preparation.
2. Set access preferences, then explore the room's teaching scenario or explicitly change the fictional profile and scenario. Examples include secretion burden, restrictive mechanics, circuit problems, communication interruption and an explicitly authored adult arrest exercise.
3. Use **Run**, **Pause** or **Step +5 s** to advance model time. Speed changes affect only simulated time. Hiding the browser tab pauses the run rather than accumulating an unattended penalty.
4. In **Bedside 1:1**, compare the current state with the person's baseline. Select an action station, check evidence and readiness, assign the workstream, commit an available action and reassess its effect.
5. In **Physiology lab**, vary mechanical, gas-exchange and cardiac assumptions independently. Apply changes deliberately; a diagnostic label does not prescribe a person's physiology.
6. In **Bag & CPR**, explore manual support or the separate arrest exercise. Review the actual delivered volume, airflow, recorded cadence and model flow rather than treating a button press as successful treatment.
7. Finish in **Handover & debrief**. Review the physiological and communication story together, then export the active session or trend data if useful. Return to **Code Blue rooms** to export the whole room board before closing the page.

### Three rooms and parked sessions

| Room | Authored adult case | Entry configuration | Focus |
| --- | --- | --- | --- |
| `icu-01` · ICU 01 | CP airway review | Tracheostomy and ventilator; retained secretions, spontaneous circulation | Airway assessment, communication access and reassessment |
| `icu-02` · ICU 02 | DMD arrest drill | Existing ETT and ventilator; explicitly authored arrest | Rapid recognition, established-airway support and parallel teamwork |
| `skills-03` · Skills 03 | Generic adult BVM arrest drill | Natural airway, face mask and manual bag; explicitly authored arrest | Compression–ventilation coordination and observed bag delivery |

Only the active room can advance. Changing rooms parks the previous case with its model state, settings, events, trends and reflection preserved; entering or returning to a room leaves its clock paused. Unvisited rooms remain templates until entered. The board is a local training workspace, with no hospital census, staff dispatch or multi-user synchronisation.

Each room has its own simulated Code Blue activation time, six role-readiness records (`bedside`, `lead`, `airway`, `compressions`, `monitor`, `recorder`), closed-loop read-back count and reassessment count. Activation logs a fictional help request without changing circulation or sending a real alert. Role acknowledgements are training records, not evidence of equipment readiness or authority to intervene; they never delay emergency assessment or gate CPR controls. The repeating 120-second display follows model time and is a coordination reminder only. It does not pause compressions, direct a rhythm check or run an ALS algorithm.

**Export all room states** downloads `Noah-Code-Blue-rooms.json` with schema version `0.4`, the active room ID, all three templates, each room's coordination record, visited-room sessions and per-room reflections. A never-entered room has a `null` session. This whole-board export is distinct from the active-session JSON and active-room trend CSV. Exports support review and handover; this release has no import/restore workflow.

### Ventilation and heart–lung behavior

- Timed mandatory pressure control and volume control act on the same R–C lung network.
- A pressure cap can prevent delivery of the selected volume; the display reports the resulting delivery.
- Compliance, resistance, secretion burden, dead space, shunt, leak and cardiac reserve can vary independently.
- Pressure, flow, volume and illustrative capnography traces follow model state.
- Oxygenation, ventilation and circulation remain distinct. Raising FiO₂ does not directly clear CO₂.
- ETCO₂ is an estimate with its own perfusion/dead-space assumptions and may become unavailable. It is not interchangeable with modeled arterial CO₂.
- An ETT and a tracheostomy tube are distinct configurations. Their labels do not automatically change resistance; the explicit mechanical assumptions determine it.

### Manual bag controls

Select the manual source and an existing ETT/tracheostomy connection, or choose the separate natural-airway face-mask demonstration. Confirm trained-responder, interface and equipment readiness before requesting a breath. These configuration controls do not simulate an insertion or airway-exchange procedure.

Each accepted activation requests **one timed breath** through the same lung mechanics. It does not guarantee a target volume, clear secretions or reset gas values. No next bag breath is automatic. In a paused session, an accepted breath can explicitly advance inspiration and early expiration; during an access hold it remains queued until time is resumed. Manual rate is derived from actual events, not the ventilator's mandatory-rate setting.

A checked manual route can bypass a failed ventilator circuit while leaving airway resistance, lung stiffness and gas-exchange impairment unresolved. Reassess the delivered effect.

### Compression controls

Load the explicit adult arrest scenario and record rapid recognition of the authored unresponsiveness and absent normal breathing. Disability, a low blood-pressure number or ventilator dependence never activates arrest automatically.

Start or stop simulated compressions and compare rate, depth and recoil assumptions. Compression-generated forward flow is distinct from intrinsic cardiac output. The exercise does not generate automatic ROSC or infer survival. Pulse oximetry is unavailable or unreliable during the authored arrest/CPR state; hidden synthetic saturation is not a clinical measurement.

Natural-airway bag-mask breaths require a compression pause for the 30:2 teaching sequence. Existing ETT/tracheostomy routes allow a breath while compressions continue. The app does not automate an entire ALS sequence and does not teach drug dosing, defibrillation or invasive technique. The displayed ANZCOR references define the clinical content boundary; the model's numerical flow response is an unvalidated engineering approximation.

## Communication access and patient authority

The bedside workflow treats AAC and access to a call system as part of care. A known response, a reviewed plan or a selected object does not imply agreement to a new planned intervention. Planned-care agreement is scoped to the selected action and consumed when that action is committed. WAIT and unknown responses remain meaningful; silence does not become consent, refusal or incapacity.

Urgent assessment and escalation remain available when communication is interrupted. The authored arrest state does not manufacture a patient response. Supporters contribute baseline knowledge without automatically replacing the patient as decision-maker.

The interface provides keyboard controls, larger text, contrast and reduced-motion options, a text view, persistent written cues and an action scanner. Access holds and switch scanning pause physiological time. Relevant text commands include `SELECT 04`, `CHECK 04`, `ASSIGN 04`, `COMMIT 04`, `REASSESS`, `STATUS`, `AAC RESTORE`, `PARALLEL BRIEFING`, `PAUSE`, `RUN` and `RESET`. These support the action-station workflow; they are not a command language for a real ventilator.

Keyboard, screen-reader, switch-device and disabled-person usability testing still need formal review. These controls do not constitute a claim of WCAG conformance or universal assistive-technology compatibility.

## Model limits and population boundaries

The numerical implementation and its assumptions are documented in [runtime/MODEL.md](src/features/cardiopulmonary/runtime/MODEL.md). Evidence provenance and applicability are recorded in [the evidence document](docs/healthcare-public-data-evidence.md).

Key limits:

- This is an **adult** model. The separate paediatric Rohan source narrative informed interaction principles only; its clinical trajectory, age-specific algorithms and outcome are not imported.
- DMD is a specific muscular dystrophy. The DMD profile is not a model of all muscular dystrophies. CP likewise has no universal set of respiratory or cognitive characteristics.
- Muscle effort is synchronized with mandatory inspiration; there is no spontaneous-trigger, dyssynchrony or fatigue controller. Muscle effort is suppressed during explicit arrest.
- Calculated elastic pressure is not a measured plateau pressure. PEEP does not automatically recruit lung or resolve shunt in this model.
- Cardiac effects use a preload-dominant approximation and do not reproduce individual right- and left-heart physiology.
- pH uses a fixed-bicarbonate approximation. Oxygen and CO₂ transient coefficients are not fitted to a patient.
- **During no-flow or low-flow arrest, gas values are outside their intended arterial-gas interpretation.** The model lacks separate tissue and venous compartments, perfusion-limited exchange and reperfusion washout. A changing modeled gas number does not establish oxygen delivery, organ perfusion or recovery.
- Compression flow, rhythm presentation and arrest transitions are authored teaching approximations. There is no drug, shock, injury, prognosis or complete resuscitation model.
- “1:1 bedside” describes the nursing workstream in the scenario. It does not eliminate the need for a qualified multidisciplinary response or establish an appropriate real-world staffing level.

No controls supply patient-specific prescriptions, recommended settings or procedural instructions. Clinical calibration, local governance and paid disabled-person co-design review remain necessary before formal teaching deployment or assessment use.

## Code structure

```text
apps/noah-icu-lab/
  index.html
  package.json
  package-lock.json
  tsconfig.json
  vite.config.ts
  src/
    App.tsx
    main.tsx
    features/cardiopulmonary/
      NoahICU.tsx                 # Session, clock, views and controlled actions
      noah.css
      components/                # Anatomy, traces, manual support and Code Blue rooms
      content/cases.ts           # Fictional adult profiles, scenarios and sources
      content/rooms.ts           # Three room templates, team roles and references
      runtime/
        pulmonary.ts             # Pure deterministic physiology and resuscitation state
        bedside.ts               # Evidence, readiness and agreement gates
        MODEL.md                 # Equations, units and limitations
  tests/
    pulmonary.test.ts
    bedside.test.ts
  docs/
    healthcare-public-data-evidence.md
```

The runtime owns physiological state; React renders and controls it. The engine advances only by explicit simulated seconds. Numeric inputs receive finite-value normalization. Waveform history is bounded to sixty seconds.

## Verification scope

The pulmonary tests check analytical R–C agreement, pressure limitation, gas trapping, oxygen/CO₂ separation, disconnection, independent cardiac reserve, deterministic time, bounded history, manual-breath timing, compression-flow separation and explicit arrest behavior. The bedside tests check evidence gates, action-scoped agreement, WAIT/unknown handling, emergency access, partial responses and reassessment.

Passing these checks demonstrates consistency with the stated implementation. It does not validate medical-device performance, individual treatment predictions, human-factors safety or clinical competence. A production deployment should repeat the commands above against the final committed source and retain those limits in the interface.
