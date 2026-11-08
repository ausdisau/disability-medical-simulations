# Noah Code Blue Rooms — native mobile companion

A working React Native / Expo educational application for three fictional adult ICU and resuscitation rooms. The interface uses native `View`, `Text`, `Pressable`, `ScrollView`, `FlatList` and `TextInput` components. It is not a website embedded in a WebView.

**Simulation only.** This is an unvalidated teaching model, not a medical device, clinical decision tool, bedside chart, prescription protocol or certification of resuscitation skill. It cannot contact a response team. It does not perform procedures, administer drugs, diagnose rhythms, deliver shocks, predict survival or produce automatic return of spontaneous circulation (ROSC).

## Run the application

Use Node **22.13.0 or newer** and npm. The dependency graph is pinned in `package-lock.json`.

```sh
npm ci
npm start
```

For the web development target:

```sh
npm run web
```

For an Android or iOS development build, after installing the appropriate native toolchain:

```sh
npm run android
npm run ios
```

Android requires Android Studio / Android SDK tooling; local iOS development requires macOS and Xcode. These scripts generate the local native projects through Expo; no native project, binary, signing credential or store release is included here. Check the installed Expo Go version before using it with SDK 58. The official SDK 58 announcement described its Expo Go rollout as forthcoming at release; a compatible development build is the alternative. This repository does not assume every installed Expo Go client supports SDK 58.

The generic bundle identifiers in `app.json` are development configuration. Review app identity and signing independently before any store submission. No EAS project ID or account integration is configured.

### Verified dependency selection

Versions were checked on 29 October 2026 against the [official Expo SDK reference](https://docs.expo.dev/versions/latest/), the [SDK 58 announcement](https://expo.dev/changelog/sdk-58), and `bundledNativeModules.json` inside the official `expo@58.0.21` package. The package metadata fixes the exact compatible patch versions below.

| Package | Pinned version |
| --- | --- |
| Expo | 58.0.21 |
| React / React DOM | 19.3.0 |
| React Native | 0.88.1 |
| React Native Web | 0.21.4 |
| React Native Safe Area Context | 5.10.1 |
| Expo Metro Runtime | 58.0.15 |
| TypeScript | 5.9.3 |
| tsx test runner | 4.23.15 |

The web export follows the official [Expo web workflow](https://docs.expo.dev/workflow/web/), including `registerRootComponent` and Metro bundling. The SDK and native dependency pins are intentional; do not upgrade React Native independently of its Expo compatibility matrix.

## Shared resuscitation learning

The app now opens **Learn resuscitation** before simulation. Six unscored modules cover arrest recognition, compressions and circulation, oxygenation versus ventilation, airway routes, communication and teamwork, and reassessment. Every lesson retains the web curriculum's core science, three fictional case adaptations, observation prompt, reasoning choices, explanatory feedback and source reference.

The web and mobile interfaces import one pure TypeScript source: [`../../shared/noah-resuscitation/curriculum.ts`](../../shared/noah-resuscitation/curriculum.ts). Substantive content is unchanged from web commit `f8979504ecef70aa3404ad95ba253fd13a7dc15a`. A shared regression check protects that review baseline; intentional editorial changes must update it after review. Metro watches this shared folder, so run from a full repository checkout, not a copied mobile directory.

- Select Maya (CP), Kai (DMD) or Alex (adult comparator) to read that fictional case's adaptation. It does not reconfigure any room.
- Use **Choose a module**, **Previous module**, **Next module** or **Return to first module** in any order. Answers are repeatable and only reveal formative explanations. There is no grade, stored score, countdown, completion gate or clinical credential.
- **Open bedside simulation** or **Practise bag & CPR** opens the selected case's existing room at Bedside or Support, with time paused. **Choose Code Blue room** opens the room lobby.
- **Learn resuscitation** is available from the lobby and every room. It parks time, preserves queued support, AAC holds, team roles and reflections, and returns to the selected lesson. Returning to simulation never auto-resumes. Late timer callbacks and simulation actions are ignored while learning.
- The observation prompts include the web manikin's visual behaviour. The companion explicitly identifies its text/model-reading alternative; the anatomical animation has not been ported.
- Source buttons open public references only after activation. Failed launches show a recoverable message and a selectable URL. Lessons are bundled for offline reading. Learning state lasts for the app session only.

All new controls use native accessible press targets of at least 48 × 48 logical units, labels, hints and selected/disabled/expanded state. Text scaling is uncapped; content wraps in one scrollable column. Keyboard focus has a visible border, module changes move focus to the new lesson, Android/web feedback uses a polite live region, and iOS uses queued announcements. No learning interaction requires swiping, precision dragging, long presses or timed responses. These implementation properties do not establish comprehensive assistive-technology compatibility.

See [learning verification and review](docs/learning-verification.md) for automated coverage and the outstanding device, clinical and lived-experience review.

## Rooms and working controls

| Room | Fictional adult | Initial configuration | Main rehearsal |
| --- | --- | --- | --- |
| `icu-01` | Maya Chen, 26; cerebral palsy | Established tracheostomy, pressure-control ventilator, spontaneous circulation, new secretion burden | Recognise changed delivery, compare support, preserve eye-gaze AAC and the person’s baseline |
| `icu-02` | Kai Morgan, 19; Duchenne muscular dystrophy | Existing ETT and ventilator; explicitly authored arrest | Rapid recognition, simulated help request, role coordination, compression-generated flow, ventilation through an established advanced airway |
| `skills-03` | Alex Taylor, 35; generic adult skills case | Natural airway, manual bag and face mask; explicitly authored arrest | Coordinate the natural-airway compression–ventilation sequence and observe actual manual breath delivery |

Alex’s room has no inferred CP, muscular dystrophy or invasive-airway history. All cases are fictional adults. No child case, real patient attachment, paediatric physiology or historical fatal outcome is imported into these presets. Diagnosis labels do not determine cardiac reserve, communication capacity, arrest state or prognosis.

Names, ages and authored model inputs mirror the corresponding web-lab cases and room overrides. The two ICU rooms also use the same 120-second baseline settling plus 0.1-second acute change. The native natural-airway skills room starts fresh, with no imported mandatory-breath history; its early readings therefore differ from the web lab’s preconditioned skills-room state. [Mobile/web consistency notes](docs/mobile-web-consistency.md) list the matching inputs and this explicit initialization distinction.

From learning, choose a practice destination or open the room lobby. Only that active room can advance. The other two retain their states without consuming model time. Returning to the lobby or selecting another room parks the previous room. Opening a room always leaves its clock paused.

The sections provide:

- **Bedside:** person and case context, simulated Code Blue activation, explicit arrest recognition, synthetic observations, model gas / flow detail and a four-domain reassessment record.
- **Support:** ventilator or manual bag, existing ETT / tracheostomy or a separate natural-airway mask configuration, pressure / volume control, bounded experiment inputs, equipment readiness, one timed manual breath, compression start / pause, and rate / depth / recoil assumptions.
- **Team & AAC:** six readiness roles (`bedside`, `lead`, `airway`, `compressions`, `monitor`, `recorder`), dedicated 1:1 bedside responsibility, communication equipment access, fictional awake-person messages, and explicit facilitator case/reset controls.
- **Debrief:** up to 150 recent time-stamped events, four-domain reassessments and a free-text reflection. This is a local learning record, not a clinical chart.

Changing reading sections pauses the training clock. The run controls provide **Run**, **Pause**, and **Step 5 seconds**. Numerical controls are bounded sensitivity experiments; their defaults and bounds are not clinical settings or treatment recommendations. Pressure is in cmH₂O, flow in L/min, volume in mL, gas pressure in mmHg, and compression depth in mm.

### Manual ventilation is time-dependent

One bag activation requests one inspiration using the same resistance–compliance states as the ventilator. It does not assign an instant target volume or reset blood gases. Manual delivery never uses the ventilator’s mandatory rate to invent later breaths. The displayed manual rate comes from actual activation history, and the breath count includes a held request before its delivery completes.

When the clock is paused and no access hold is active, the bag button explicitly advances through one inspiration plus 0.6 seconds of expiration, then remains paused. When running, the breath evolves on the running simulation clock. During an access hold, the button queues the request without advancing time. **Release access hold** remains paused; use Run or Step to execute the pending support.

Changing source or interface is blocked during an active or queued manual inspiration. A mask is available only with the manual source. Selecting a mask stops configured compressions and clears bag readiness. Returning from mask to ventilator requires an explicit existing ETT or tracheostomy configuration; the application does not silently exchange an airway or simulate a procedure.

A checked bag route bypasses only the disconnected ventilator-circuit fault in the shared engine. It does not erase secretion resistance, lung stiffness, leak or impaired gas exchange. Equipment readiness alone does not establish airway patency or effective ventilation.

### Explicit arrest and compression coordination

An arrest state is authored deliberately. Low saturation, low pressure, ventilator dependence or a disability diagnosis never creates it automatically. The recognition control records the scenario’s **unresponsiveness and absent normal breathing**, with a simulated help request. It does not wait for certain pulse palpation or an AAC response. A trained bedside nurse or compression responder is sufficient for the application’s readiness gate; the whole team does not need to arrive first.

For the natural-airway mask exercise, the application blocks a mask breath while compressions are active, and blocks starting compressions while a mask inspiration is active or queued. The learner controls the timing; there is no automatic 30:2 controller. Existing ETT and tracheostomy routes allow concurrent simulated compressions and manual breaths.

Clinical reference text is sourced from [ANZCOR Guideline 6](https://www.anzcor.org/home/basic-life-support/guideline-6-compressions), [Guideline 8](https://www.anzcor.org/home/basic-life-support/guideline-8-cardiopulmonary-resuscitation-cpr) and [Guideline 11.6](https://www.anzcor.org/home/adult-advanced-life-support/guideline-11-6-equipment-and-techniques-in-adult-advanced-life-support). The source describes adult compression rate 100–120/min, depth greater than 5 cm and full recoil; it does not supply an adult upper depth limit. It distinguishes 30:2 without an advanced airway from 6–10 ventilations/min through an established advanced airway during continuous compressions. The broader application control bounds are software experiments and are not those clinical targets. No pacing or auto-titration algorithm is implied.

Compression cycles accrue only while simulation time advances. Pausing compressions stops cycle accumulation; generated flow decays as model time advances. During a frozen access hold, a retained flow number is a frozen model state, not continuing physical compression activity.

### Communication access and mobile lifecycle

AAC availability and response availability are separate. The application never manufactures a reply during the authored unresponsive state or when communication access is unavailable. The awake CP case has explicitly scripted rehearsal messages, including **WAIT**, which holds time for accessible communication. These do not represent an assessment of a real patient or presumed consent.

The AAC / reading hold freezes physiological time. Urgent support controls can be configured while held without charging the learner time for reading, switch access, eye-gaze access or communication. Emergency recognition is not delayed by requiring AAC agreement. Releasing the hold does not auto-resume.

React Native `AppState` pauses running rooms when the app becomes inactive or backgrounded. There is no wall-time catch-up and no automatic foreground resume. Runtime scheduling requests explicit 0.25-second advances; the engine itself uses deterministic 0.01-second steps. Timer delays may make the exercise run slower than real time; they never create an uncontrolled jump.

Targets are at least 48 logical pixels, text scaling remains enabled, control labels describe their effects, statuses use words as well as colour, and long room/event lists use `FlatList`. The toolbar scrolls with content to avoid trapping large text in a fixed header. VoiceOver, TalkBack, switch control, device rotation and large-font operation still need device testing; accessibility conformance is not claimed from source review alone.

## Model validity and readings

The engine is the byte-identical `noah-physiology-0.3` implementation from the Noah ICU Heart & Lung Lab. Read [MODEL.md](src/model/MODEL.md) for equations, units, coefficients, source URLs and limitations.

It uses two parallel lung compartments with a common resistance, finite-time pressure- or volume-controlled mandatory breaths, explicit expiration, secretion resistance, leak and a disconnected circuit state. Manual bag support uses the same mechanics. Oxygen and carbon dioxide are separate: increasing inspired oxygen does not directly lower CO₂. The cardiovascular coupling is a simplified preload-dominant approximation; it does not include potentially beneficial LV afterload effects. Cardiac reserve is an independent input.

Ordinary readings are synthetic estimates. Modeled elastic pressure is not a clinically measured plateau pressure. Estimated ETCO₂ is distinct from the model PaCO₂ state. The oxygen model uses a reduced alveolar gas equation and fixed mixing assumptions. The pH state is an acute fixed-bicarbonate approximation. No full spontaneous trigger / assist / asynchrony, regional V/Q, recruitment, metabolic compensation, electrophysiology or drug-response model is provided.

**Arrest is outside the arterial-gas validity of this model.** Its synthetic gas compartment continues to change with ventilation even at zero forward flow. It does not model tissue reservoirs, venous–arterial separation, perfusion-limited pulmonary exchange, sampling site or reperfusion washout. Gas changes cannot establish tissue oxygenation, perfusion adequacy, recovery or prognosis. The UI labels these values as synthetic states during arrest and explains that they are not interpretable arterial measurements.

During explicit arrest, ordinary pulse, blood-pressure and pulse-oximeter displays are unavailable. The separate compression flow and model MAP values are clearly labeled internal estimates. Compression-generated flow is never a spontaneous pulse, and ECG activity would not establish circulation. The companion contains no automatic ROSC action; resetting a room restores its authored starting state, including arrest for the two arrest rooms.

A perfusing room that crosses the model’s broad teaching boundary is paused for facilitator review. That pause is a software validity boundary, not a patient outcome or a clinical threshold recommendation.

## Engine provenance and sync

The unmodified engine is at `src/model/pulmonary.ts`. Its upstream project path and SHA-256 are recorded in `src/model/provenance.json`:

```text
6f01caa03af7fdca1a52d37345bfac59ec7bfc9414a779aa391cec3f6e03d167
```

`npm run verify:engine` verifies the local bytes against that manifest. It does not fetch an upstream repository or prove that a future upstream version is unchanged. To sync an intentional upstream change, review that change, replace the copied engine and its documentation, update the manifest checksum, refresh the copied engine tests and rerun the full mobile test suite. The 32 copied engine tests differ only in their local import path. Mobile coordination logic lives outside the copied engine.

## Checks and export

```sh
npm run typecheck
npm test
npm run export:web
```

The implementation was checked on 29 October 2026 using Node 24.22.1 and real installed dependencies:

- Strict TypeScript check: passed against the actual Expo / React Native type definitions; no synthetic type shims.
- Engine checksum verification: passed.
- Shared engine tests: **32 passed**.
- Native room coordinator tests: **15 passed**, covering room isolation, background pause, explicit clock bounds, access-held manual/CPR queues, both-direction mask coordination guards, responder readiness, source synchronization, retained impairment, arrest sensor validity, AAC response limits, immutability and bounded debrief/reset behavior.
- Cross-project consistency check: all three rooms' normalized inputs and ages match the web cases; both ICU rooms' settled initial metrics also match exactly. The fresh natural-airway skills initialization is documented separately.
- `expo export --platform web`: passed; Metro bundled 226 modules into a web export with approximately 525 KB of JavaScript. The generated `dist-web` folder is a smoke-build artifact, not a native binary.
- Subpath export check: the HTML script URL begins with `/mobile/_expo/` and maps to an existing exported asset. This was a static path/file check; no separate HTTP preview server was launched for it.

### Hosting alongside the web lab at `/mobile/`

`app.json` sets the documented Expo `experiments.baseUrl` to `/mobile`. A production export prefixes bundled resource URLs with `/mobile/`; the exported files themselves remain directly inside `dist-web`. Copy the **contents** of `dist-web` into the host’s `mobile` directory. For example, `dist-web/index.html` becomes `mobile/index.html` and `dist-web/_expo/…` becomes `mobile/_expo/…`. The entry URL is `/mobile/`.

This follows the official [Expo CLI hosting-with-subpaths documentation](https://docs.expo.dev/more/expo-cli/#hosting-with-sub-paths) and [app configuration reference](https://docs.expo.dev/versions/latest/config/app/#baseurl). Expo documents this setting as experimental and production-only. Development commands remain ordinary `expo start` / `expo start --web`; native platforms continue to use the same source. This app has no internal URL router, and its `Linking` calls target absolute public evidence URLs, so no additional internal route prefixing is needed. Changing the hosting prefix requires updating the configuration and re-exporting.

The export is a normal Expo web asset directory. Serve the complete asset tree over HTTP at that prefix; unlike the separate Vite single-file web lab, it is **not** a self-contained HTML file or an offline service-worker application. The simulation performs no data API calls after assets load. Opening a public evidence link intentionally leaves the app for a browser.

**Native validation limit:** no Android emulator, iOS simulator, physical device, APK, AAB or iOS archive was available or produced for this task. Passing the typecheck, deterministic model tests and web export does not prove device performance, native UI behavior, assistive-technology interoperability or clinical validity. No native performance claims are made.

## Code structure

```text
App.tsx                         Native lobby, bedside, support, team/AAC, debrief
src/components/Controls.tsx      Accessible native controls and shared styles
src/session/rooms.ts             Pure room coordinator and fictional case definitions
src/model/pulmonary.ts           Unmodified deterministic physiology engine
src/model/MODEL.md               Equations and clinical validity boundary
src/model/provenance.json        Upstream identity, checksum and sync rule
tests/pulmonary.test.ts          32 shared engine regression tests
tests/session.test.ts            15 room coordination and access tests
scripts/check-engine.mjs         Local engine checksum check
docs/healthcare-public-data-evidence.md  Public evidence provenance
docs/mobile-web-consistency.md    Authored input parity and initialization distinction
app.json / metro.config.js      Expo app and Metro configuration
```

## Data and privacy

Names, ages and scenarios are fictional. Case parameters are authored synthetic inputs; they are not fitted to a public clinical dataset or a patient record. The [evidence register](docs/healthcare-public-data-evidence.md) distinguishes public PubMed / PMC and guideline references from simulated case data. Clinical text and engine equations do not imply calibration or endorsement by those sources.

This companion stores its session only in memory. There is no login, backend, telemetry integration in application code, healthcare record connection, upload, real alert or external form integration. Reflections disappear when the app is reloaded or closed; resetting a room clears that room’s debrief. Do not enter identifiable patient information. Expo development tooling has its own separate behavior; use `EXPO_NO_TELEMETRY=1` for CLI sessions if desired.

No original source attachments, personal records, private owner links, publishing identifiers, credentials, `node_modules`, generated native projects or legacy application source belong in a source release. The additive mobile directory does not alter the separate vanilla or React web applications.
