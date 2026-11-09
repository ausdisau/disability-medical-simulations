# Project Hope AURA — bounded unpredictable cascade crisis

**Simulation status:** fictional synthetic adult case; no real monitoring or clinical actions. **Scenario:** Alex Morgan, age 27, with cerebral palsy, high fever 39.4°C and marked new lethargy, working diagnosis chest infection. **Not** Rohan's DMD Code Blue.

## Scenario director trigger (non-clinician)

`TRIGGER_CASCADE` selects a pre-authored plausible event variant by an explicit seed. Seed `0` reproduces the chat-established demonstration cascade. Other integer seeds produce bounded different evidence sources/clinical presentation details; they are deterministic and reproducible from the event commands. The controller records each authored cue as a separate event, with source, time, known and unknown. `NEXT_CASCADE` reveals the next cue. There are no automatic timed patient effects, fatal surprises, procedurally generated medicine orders or time penalties for using access supports.

## Demonstration with seed 0, from 14:10:00

1. **14:10:18** New cough and observable increased work of breathing; secretion retention, aspiration or worsening infection not distinguished. Oxygenation unverified.
2. **14:10:29** Monitor alarm raises an apparent dangerous rhythm, but signal is degraded by movement; a clinical rhythm and pulse must be confirmed separately, with no defibrillation assumption.
3. **14:10:39** New qualified clinician **fictional** BP of **88/54 mmHg**, cool hands; serious hypotension prompts assessment. **Septic shock is not confirmed** from a single BP and unknown lactate/other findings.
4. **14:10:50** AAC device moves out of usable reach during repositioning; no patient answer, consent or incapacity finding is inferred.

At 14:10:50 controller goes to `DECISION_HOLD`. No clinical rescue, worsening, death or recovery has been auto-authored. Four separate workstreams are visible:

- Qualified senior ED/ICU team and local CERS escalation.
- Qualified airway/breathing/perfusion assessment, independently verifying monitor artefact.
- Senior clinician assessment of sepsis risk, likely source and time-critical treatment planning according to local protocol.
- Restoring communication access and addressing Alex directly during resuscitation or escalation.

Selection is not treatment. Existing station lifecycle remains `SELECT → CHECK → ASSIGN → DOCUMENT → REASSESS`, without automatically changing clinical data or issuing prescriptions.

## Risk, uncertainty and authority

The user operates as **Simulation Director**, not a doctor. Fictional qualified clinicians have treatment responsibility. The JMO is an optional fictional learner. Since no actual local high-risk medication/procedure pack is installed, medicine doses, shocks, chilled-saline infusion, ice packs and invasive procedures are not executable.

AURA distinguishes:
- new fictional clinician observation (blood pressure),
- bedside observable cue (respiratory effort),
- **unverified device alarm** (possible arrhythmia),
- access disruption (AAC),
- speculative causal interpretations (e.g. aspiration, pneumonia, sepsis, arrhythmia).

Do not let the narrative use unsupported hypoxia, a flatline, shock, sepsis, incapacity or death as a fact. The separate ICU telemetry review may reflect the authored BP and alarm status, but its own clinical sensor data remains unacquired. Restore communication without claiming Alex authored any particular words.

## Validation and sources

- `node --test tests/cascade-engine.test.mjs` and existing Alex, Rohan, and telemetry regression tests.
- `npm run build` in `apps/anzcor-react-web` on the draft PR.
- NSW ACI Adult Sepsis ECAT (October 2026): https://aci.health.nsw.gov.au/ecat/adult/sepsis — urgency and senior/local CERS and appropriate treatment framework.
- SCCM/ESICM SSC adult guideline 2026: https://www.sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026 — clinical assessment and indication-led resuscitation; does not validate an unreviewed simulation.
- Human review: qualified NSW adult ED/ICU clinician, relevant paid disability-led AAC co-designer, instructor, accessibility and governance reviewers all PENDING. No production deployment or medical-device integration.

## Multimodal prompt

Documentary-realistic Australian emergency department, fictional adult Alex with cerebral palsy and high fever, initially coughing and visibly labouring to breathe; one fictional low BP value appears in a chart, while an ECG alarm is explicitly marked signal-unverified. Another staff member restores an AAC device displaced during clinically necessary repositioning. Team coordinated and realistic, no fabricated ECG waveforms, blood-gas results, medication orders, intrusive drama or hospital branding.

**Captions:** `COUGH / BREATHING EFFORT: NEW`; `ECG ALARM: SIGNAL UNVERIFIED`; `BP: 88/54 mmHg (FICTIONAL)`; `SEPSIS: SUSPECTED / NOT PROVEN`; `AAC: ACCESS DISRUPTED`.
**Alt text:** Alex is receiving urgent assessment for new respiratory and circulatory concerns while clinicians verify an unreliable monitor signal and restore the communication device. No cause or clinical outcome has yet been established.
