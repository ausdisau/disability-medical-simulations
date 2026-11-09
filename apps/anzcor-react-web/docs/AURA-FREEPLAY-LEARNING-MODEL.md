# AURA Freeplay Studio — SimuGen × Disability Medical Simulations

**Status:** synthetic, local-only design prototype. **Audience:** medical/nursing/allied-health students, patients and supporters, simulation facilitators, disabled co-designers, and creative writers. **Default jurisdiction:** NSW, Australia. **Fictional patient data only.** Clinical and disability-led review pending.

## Concept

Freeplay is not a single-answer quiz. It is a **bounded creative learning environment** where an individual explores a patient-led clinical dilemma in their own order, sees the difference between what is known and unknown, chooses a perspective, creates teaching notes and reflects without a score. It should be empowering for a patient who has no clinical training, and safe for a student who is not a qualified clinician.

The studio uses SimuGen's scenario structure — role and level, clear objectives, plausible fiction, staged observations, educational prompts, faculty guide and debrief — combined with Project Hope's protected patient baseline/agency/AAC and AURA's gated clinical truth. This is **not** an assertion of formal compliance or peer review.

## Modes and scope of freeplay

| Mode | Audience | Permitted interaction | Not permitted |
| --- | --- | --- | --- |
| Patient and supporter (default) | Public, patients, families | Plain language explanation cards, ask about risks/alternatives, save personal learning questions, communication access, teach-back practice | Real-world diagnosis, drug/ventilator prescriptions, clinical outcome predictions |
| Clinical student | Fictional learner role only | Review baseline and acute findings, compare hypotheses, examine observation needs, request escalation/clinical review, document handover, bias repair, free-order reflection | Administer drugs, defibrillate PEA, chilled saline, invasive procedures, automatic ROSC/death |
| Creative studio | Writers, educators, facilitators and co-designers | Draft fictional storyboards, remix bounded evidence-gap cues, define learning themes, export annotated source-bound JSON | Mutating VIRGAL physiological state or granting a simulator authorisation to prescribe; self-approving clinical release |

A **content prebrief** must be acknowledged before entering every scene. The clinical-student Code Blue snapshot has an explicit arrest warning and is never the default patient-explorer landing page. No hidden safety test or leaderboard penalises AAC time.

## Five starting workshops

1. **Alex: Fever, breathing and clinical uncertainty** — student; synthetic fever, acute deterioration, diagnostic uncertainty, senior review and access.
2. **Alex: Code Blue communication and evidence** — student-only opt-in; a separate educational PEA recap, with CPR ongoing, no ROSC, no prognostic outcome, and specific non-shockable rhythm gate.
3. **Understanding chest infections and hospital checks** — patient/supporter; the initial default; plain-language exploration and appointment questions.
4. **Talking through breathing-support options** — patient/supporter; oxygenation versus ventilation, purpose, communication and alternatives, no device settings.
5. **Creative case workshop** — educators/writers; source-labelled notes, evidence gaps and human review requirements.

The case engine intentionally does **not** copy the current live chat into a treatment engine. The Code Blue workshop is a clearly non-canonical fictional snapshot, not a new physiological branch or continuation.

## Architecture and data provenance

```
SimuGen-style authored workshops (freeplay-data.mjs)
    → Pure rule-bound educational reducer (freeplay-engine.mjs)
         → immutable learning ledger; known/unknown source labels
         → user questions and editor notes marked LOCAL_UNREVIEWED
         → bounded deterministic creative cues (seed + ordinal)
         → domain-based debrief (not a grade)
    → React FreeplayStudio.jsx (accessible student/patient/creator interface)
    → explicit JSON/TXT download only (no background sync)
    
AURA VIRGAL clinical truth: NO WRITE PATH FROM FREEPLAY
Actual patient records or telemetry: NOT CONNECTED
Real patient data: NOT REQUESTED OR SUPPORTED
Medication/airway/dose control: NOT IMPLEMENTED
```

There is deliberately no autonomous LLM clinical dialogue, no user-input-as-physiology bridge, and no clinical effects from clicked actions or generated storyboards.

### Deterministic event envelope

For every activity, record a sequence ID, learning step, audience, event type, domain, textual interpretation, scope/status and provenance. Force `clinicalEffect: "NONE"`, `patientMessageEffect: "NONE"`, and `treatmentAuthority: false`. A creative cue is preauthored as known and unknown information; it does not add a lab value, new diagnosis, treatment effect, incapacity finding or death.

### Validation and review gates

- Every scene must include ID, title, opening, source label, learning objectives, known/unknown facts, communication-access baseline and content warning.
- Clinical students may inspect locked high-risk action cards but not commit them.
- Patient mode contains no student intervention buttons and does not create patient records or imply that the user is a clinician.
- User-written notes are exported only by explicit user action, tagged as unreviewed author material and never used as clinical facts.
- Pauses, reading and AAC/switch access do not advance patient physiology. The app has no autonomous clinical timer.
- Content reviewed by qualified NSW clinical educator, paid relevant disabled co-designer and patient educator, AAC/accessibility tester, and clinical governance reviewer before any patient-facing release.

## Faculty guide

**Suggested group:** 1–4 learners plus 1 facilitator; patient mode is self-paced. **Suggested run time:** 10–20 minutes for student scenarios, 5–15 minutes for patient education, creative mode flexible.

**Learning objectives (observable):**
1. State two known facts and at least one clinically material unknown without inventing a diagnosis.
2. Identify a communication-access barrier and propose a repair that preserves direct patient participation.
3. Explain when senior qualified escalation would be appropriate rather than presuming device availability equals indication.
4. Distinguish an educational request/investigation from medication administration or a proven treatment response.
5. Propose a safe next question or alternative learning route and complete an evidence-based debrief.

**Prebrief:** Describe fiction contract, uncertainty, scope, right to pause/withdraw, no real medical advice, confidentiality and alternative written route. Give consent/access discussion without demanding personal disclosure.

**Facilitator prompts (three levels):**
- Environmental: “Which value was actually observed, and how reliable is it?”
- Team: “What is the patient's usual way of communicating?”
- Explicit: “What clinical fact or authorisation would be needed to unlock this intervention?”

**Debrief:** Six independent domains — reasoning, communication, agency, teamwork, evidence, dignity. No one moral score. Distinguish scenario defect from learner error, and outcomes from actions.

## Patient education flow

Open `/freeplay.html`; patient mode is default. Choose chest infection or respiratory-support education. Read a neutral, plain-language scenario. Explore tests, risks, explanations, urgent warning concepts, communication access, and teach-back in any order. Write questions to save to a local TXT file for a real clinical conversation, without entering identifiable health data. Educational cards are not personalised treatment choices.

## Accessibility and acceptance

Required manual acceptance: full keyboard navigation; screen reader heading/announcement semantics; 200–400% zoom; switch access and dwell; strong focus visibility; no automatic timeouts; optional user-initiated TTS with full text fallback; reduced visual intensity; plain language and jargon expansion; readable export; no information conveyed only through colour, sound or animation.

**Current implementation:** responsive HTML/React, semantic controls, text-first signals, low-stimulation and larger type toggles, user-triggered optional TTS with fallback, local export and explicit content prebrief. Screen reader and switch acceptance are **not verified** until human testing.

## Source/authority boundary

- SimuGen skill: educational structure, reasonable learner scope and scenario progression (no independent claim of UK or Australian accreditation).
- Project Hope Run Disability Medical Simulations: baseline, disability agency, AAC and patient privacy.
- NSW/Victoria Clinical Simulation Guardian 2026-09-01 offline snapshot: CERS/ALs principle-level routing; current local operational rules not supplied.
- National adult ALS snapshot 2026-09-01: PEA is non-shockable; no dosing or device settings authorised.
- Existing AURA PR #25 contains separate clinically provisional and research-labelled source work; the freeplay engine does not import those sources as executable rules.

**Release status:** DRAFT / EXPERIMENTAL. Not approved for real patient care, competency certification or uncontrolled public patient education.
