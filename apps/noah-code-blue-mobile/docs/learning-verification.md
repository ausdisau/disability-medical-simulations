# Mobile resuscitation learning: engineering verification

Date: 30 October 2026. Review baseline: PR #23 at `f8979504ecef70aa3404ad95ba253fd13a7dc15a`.

## Scope and provenance

All six web lessons now run in a native React Native learning screen. Both apps import `shared/noah-resuscitation/curriculum.ts`. This extraction preserves every principle, CP/DMD/adult adaptation, observation prompt, question, option, explanatory answer and original reference URL. Stable module IDs and shared profile labels are additional metadata. A SHA-256 regression test compares the serialized lesson content with the original web curriculum; changing that test baseline requires editorial review.

The shared curriculum is pure content: it imports no physiology, device API, storage or network client. The companion reducer handles learning and navigation separately from the existing room reducer. Selecting a lesson, case or answer never changes the model. Entering learning parks all running rooms; late ticks and simulation actions are ignored. Returning to a room preserves its model state, queued support, access hold, roles and reflection and requires an explicit Run or Step. Learning answers stay in memory only, never accrue a grade, and never enter the room event log or an external service.

The native screen uses the web observation prompts but explicitly states that its anatomy animation remains web-only. The native alternative is textual context and model readings in the existing Bedside/Support interfaces. This change provides interactive curriculum parity, not visual-manikin parity.

## Reproduction

Run from a full repository checkout using the pinned lockfiles. The existing Noah workflow now also triggers for `shared/noah-resuscitation/**` changes.

```sh
# Repository root: existing Runtime tests workflow
npm test

# apps/noah-icu-lab: existing Noah web job
npm ci --ignore-scripts
npm test
npm run build

# apps/noah-code-blue-mobile: existing Noah mobile job
npm ci --ignore-scripts
npm run typecheck
npm test
npm run export:web
```

`npm test` in mobile runs engine checksum verification, 32 engine tests, 15 existing room tests, 3 shared curriculum tests, 6 learning/transition tests and 23 rendered UI tests (79 checks). The web suite has 32 engine, 15 bedside and the same 3 curriculum checks (50). The root suite has 16 tests. Repeated engine/curriculum tests across apps are shared regression coverage, not independent evidence of clinical validity.

The UI suite uses Jest Expo and React Native Testing Library against rendered components. It covers all 18 module/case combinations, every navigation route, repeatable feedback, direct module selection, selection/disabled/expanded semantics, labelled links, recoverable source failures, minimum targets, uncapped text props, visible focus styling and the iOS announcement call. Native platform services and safe-area measurements are mocked by the test preset; these tests cannot establish actual screen-reader or physical-input behaviour.

## Recorded local results

| Check | Result |
| --- | --- |
| Root runtime tests | Passed, 16 |
| Web tests and TypeScript/production build | Passed, 50 checks |
| Mobile clean lockfile install, TypeScript and tests | Passed, 79 checks |
| Mobile Expo web export | Passed |
| iOS and Android Metro/Hermes exports | Passed; JavaScript bundles only, not installable apps |
| Engine checksum and runtime dependency versions | Unchanged from the review baseline |
| Browser visual/keyboard/large-text execution | Not completed: no installed Chromium; the attempted Playwright download returned an invalid/truncated archive |
| Physical device / assistive technology evaluation | Not performed |
| Independent clinical or lived-experience validation | Not performed |

Local exports are not a deployment. No APK, AAB, iOS archive, device control, patient data import, healthcare backend or production clinical capability is added. GitHub workflow results must be checked on the published commit separately. The prior Vercel account restriction does not establish a simulator defect and is not addressed by this change.

## Required manual review before training adoption

Record device, OS, app build, assistive technology version, reviewer and observed barriers. Pay disabled co-designers for lived-experience review; clinical and lived-experience review answer different questions.

1. **Screen readers:** TalkBack and VoiceOver reading order, headings, module-change focus, answer feedback without focus theft, selected/disabled states, menu disclosure, source errors, and return from the browser. Include reselecting the current module.
2. **Text and layout:** largest supported Android text/display sizes and iOS accessibility Dynamic Type, narrow portrait and landscape/tablet layouts. Confirm no truncation, overlaps, horizontal overflow, obscured actions or unreachable content.
3. **Alternative input:** external keyboard with visible focus and activation; Android Switch Access; iOS Switch Control/Voice Control; relevant eye-gaze or AAC access. Confirm every learning action is reachable without timed or precision input.
4. **Transitions:** start a room, enter learning, read slowly, answer and change cases, then return. No time should advance or resume automatically. Repeat with an AAC hold and queued bag breath; check roles, reflections and earlier events remain available.
5. **Clinical/lived-experience:** verify source currency and interpretation, baseline-aware recognition, CP/DMD individualisation, distinct airway configurations, person-directed communication and supported decision-making. Confirm the learning pause is never interpreted as advice to defer real emergency care, and that synthetic flow/readings are never treated as clinical measurements or evidence of recovery.

All content remains an unvalidated, unscored educational prototype. No assessment of competence, survival, capacity or an individual person's clinical needs is made by the app.
