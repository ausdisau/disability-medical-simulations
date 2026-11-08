# AURA MAIRA/VIRGAL multi-target integration — draft 2026-11-09

## Canonical architecture

- Web learner cockpit: `apps/anzcor-react-web/` (existing React/Vite)
- Clinical/source-of-truth event reducer: `apps/anzcor-react-web/src/runtime.mjs`
- Read-only AI interpretation and JMO teaching adapter: `MAIRA_readonly()`
- Read-only PubMed+JSTOR research desk: `src/evidence.mjs` / `EvidenceDesk.jsx`
- Tauri 2 desktop adapter: `apps/aura-desktop-tauri/`
- Optional Electron adapter: `apps/aura-desktop-electron/`
- Facilitator controls: existing instructor role in React cockpit; remote instructor console / authenticated role model require separate privacy and security architecture.
- Distinct CP learning case seed: `apps/anzcor-react-web/content/scenarios/cerebral-palsy-respiratory-aac-v01.json`; does not overwrite Rohan's DMD case.

## Separation of responsibilities

**VIRGAL only** commits authored synthetic clinical events; MAIRA and evidence streams cannot manufacture clinical findings, patient words or consent. The Guardian Mediator blocks only the offending branch, preserving already-authorised emergency work. All live clinicians, patient information and device drivers are out of scope. Manufacturer-derived device parameters, prescriptions, invasive techniques and dose calculations require authorised NSW protocol plus review.

**OpenManikin** manikin/device affordance should attach via read-only adapters following the six-phase action station lifecycle. Do NOT connect physical manikins, defibrillators, ventilators or haptic actuation before a separate simulation-only hardware contract and fail-safe tests exist.

## External evidence status

The submitted PubMed saved-search RSS endpoint is registered with status `FETCH_UNVERIFIED`. Other PubMed sources were found by independently reproduced searches and JSTOR sources via public catalogue pages. All are `REVIEW_REQUIRED` for design adoption. No internet connection is required to use the offline Research Desk, and published medical literature does not overrule current local paediatric clinical protocols.

## CI, platform and source checks

- `cd apps/anzcor-react-web && npm install && npm test && npm run build`.
- `node --check apps/aura-desktop-electron/main.cjs` and `node --check apps/aura-desktop-electron/preload.cjs`.
- Tauri Rust build, desktop accessibility, OS packaging, authorship review, live RSS feed retrieval, direct video-content inspection, user review and clinical validation remain **not verified**.
- The user-provided YouTube watch/search links could not be fetched, so no video-specific efficacy or simulator capability claim is made.
- Keep PR draft, isolated, synthetic-only; no automatic production changes.

## Useful published authorities

- ANZCOR 2026 paediatric ALS: https://www.anzcor.org/home/paediatric-advanced-life-support/guideline-12-2-paediatric-advanced-life-support-pals
- Tauri v2 config: https://v2.tauri.app/reference/config/
- Electron security: https://www.electronjs.org/docs/latest/tutorial/security/
