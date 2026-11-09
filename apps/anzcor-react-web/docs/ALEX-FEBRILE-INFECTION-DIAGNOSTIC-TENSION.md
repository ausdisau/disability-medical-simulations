# Alex Morgan v0.2 — Fever, lethargy, chest infection and diagnostic tension

**Status:** fictional synthetic, educational preview, clinical and disability co-design pending.
**Jurisdiction:** NSW adult ED, age 27. Entirely separate from Rohan's age-12 DMD Code Blue.

## 1. Clinical opening beat

Alex, an adult with cerebral palsy and dysarthric speech, arrives with worsening cough, breathlessness, **39.4°C synthetic triage fever**, and marked **new lethargy**. The team notes longer speech pauses and difficulty maintaining eye opening. Consciousness has not yet been formally assessed; communication fatigue or slower response alone does not establish lack of decision-making capacity. Alex's usual respiratory readings, swallowing/airway-clearance plan and medicines are not verified. The clinical working diagnosis is chest infection. Bacterial pneumonia, a viral pathogen, bacterial co-infection, aspiration pneumonitis/infection and other causes remain possible.

Urgent A–G review, repeat observations, clinician-led CERS/escalation, possible sepsis assessment, AAC repair and supporter knowledge gathering run **in parallel** rather than serially. Baseline is not an explanation for new deterioration.

## 2. Four deliberately uncertain branches

| Branch | Fictional evidence released by facilitator (after OBS and CHEST reassessment) | Reasoning point | Qualified treatment pathway (no orders) |
|---|---|---|---|
| Viral-supported | Respiratory PCR detects influenza A; bacterial cultures pending | A virus is detected, but a bacterial co-infection cannot be excluded | Consider pathogen-specific antiviral appropriateness, supportive respiratory care, and bacterial-coverage need if severe/probable sepsis |
| Bacterial-supported | Focal opacity compatible with pneumonia; limited viral panel non-detect; bacterial cultures pending | Imaging and limited PCR are not definitive etiologic proof | Senior clinician considers severity, empiric antimicrobials and stewardship according to NSW/current local policy |
| Possible mixed | Influenza A detected plus focal pulmonary opacity | These findings **raise** possible co-infection; they do not prove a second organism | Senior clinician assesses combined treatment indication and reassesses as microbiology becomes available |
| Aspiration-uncertain | Witness-reported possible choking episode, no organism or definitive imaging | Chemical pneumonitis vs bacterial aspiration pneumonia vs alternative illness | Clarify history, airway clearance and severity; antimicrobials require infection indication, not CP diagnosis |

**Microbiology terminology:** A virus is a microorganism. The relevant clinical distinction is viral versus bacterial versus possible mixed infection, plus non-infectious mimics such as chemical aspiration pneumonitis.

**Rule:** The visible branch is a synthetic teaching alternative, not an automatic diagnosis. It does not change VIRGAL physiology, produce medicines, manufacture patient consent, or determine clinical outcomes. More than one diagnostic explanation may remain plausible.

## 3. Action stations (React UI)

- `AAC`: restore communication access and response time; no fabricated patient-authored words.
- `OBS`: document qualified A–G and full vital-sign review, including consciousness and glucose.
- `CERS`: urgent senior/local escalation for red flags; no external calls.
- `SEPSIS`: check for infection-related organ dysfunction, without presuming sepsis.
- `CHEST`: obtain clinically authorised infection-source investigations; no results until a facilitator authors a labelled alternate evidence set.
- `MED`: prescriber/pharmacy review request only.
- `ANTIBIOTICS` and `AIRWAY`: context-only high-risk stations, never committable without authorised pathway.

The learner must **select → check evidence → assign qualified workstream → document educational action → reassess**. The facilitator can show fictional evidence only after OBS and CHEST have been documented/reassessed. Results do not alter clinical state or medication-authority gates.

## 4. Treatment tension and safety

The presence of fever, lethargy or a viral-positive PCR must neither automatically trigger antibiotics nor exclude bacterial disease. **Possible serious sepsis does not wait for pathogen isolation**. NSW ACI Adult Sepsis ECAT (published October 2026) directs rapid clinical assessment, local CERS escalation, attempts at cultures before antibiotics when feasible, and avoiding delay to indicated therapy. Qualified local clinicians, not the educational app, determine antibiotic/antiviral choice and timing.

Medication checks include allergies/ADRs, existing medicines, relevant renal/hepatic status, swallowing/route, severity, microbiology and local policy. No dose, frequency, drug administration or measured treatment effect is encoded.

## 5. Source provenance

- **NSW first (current statewide reference; local protocol remains controlling):** https://aci.health.nsw.gov.au/ecat/adult/sepsis (Adult ECAT, Oct 2026)
- **NSW CEC sepsis pathway:** https://cec.health.nsw.gov.au/safety-essentials/deterioration/sepsis
- **UK comparator only, not NSW binding:** NICE NG250 https://www.nice.org.uk/guidance/NG250/chapter/recommendations (clinical diagnosis, severity, microbiology and reassessment)
- **Viral-bacterial co-infection/biomarker caveat:** NICE NG191, https://www.nice.org.uk/guidance/NG191/chapter/identifying-and-managing-co-infections

These sources support **principle-level clinical reasoning** only, not executable treatment orders. No laboratory values, pathogen results or radiology images have been obtained from a real patient.

## 6. Required co-design and clinical acceptance

Independent qualified NSW adult ED/respiratory/infectious disease clinician, paid relevant disabled/AAC co-designer, simulation facilitator and accessibility reviewer must evaluate the case before clinical teaching release.

- [ ] Confirm 39.4°C is understood as an authored fictional finding, not a recommended clinical threshold.
- [ ] Check that "marked lethargy" causes urgent clinical assessment without a universal capacity inference.
- [ ] Verify no premature viral/bacterial declaration from a single radiographic or biomarker result.
- [ ] Check that patients receive timely clinically indicated care in suspected sepsis even before pathogen confirmation.
- [ ] Check AAC and direct patient address remain possible in parallel with escalation.
- [ ] Verify no antimicrobial/antiviral or invasive treatment commit is introduced by the scenario fork.
- [ ] Accessibility QA: keyboard, screen reader, switch, 200–400% zoom, low sensory mode, plain-language captions.
- [ ] Record signed clinical/governance review in the external issue tracker; the app cannot self-approve.

## 7. Simulation beat

**Scene:** Alex rests against the ED pillows, visibly exhausted. A digital triage chart displays "39.4°C — fictional". An RN asks a senior clinician to review a possible severe infection while another staff member ensures Alex's AAC and direct communication remain accessible. The team discusses viral respiratory infection, bacterial pneumonia, possible mixed infection and aspiration, without claiming that any cause is established.

**Documentary-realistic visual prompt:** NSW adult ED, one fictional adult with cerebral palsy and fatigue, nurse and doctor attending in parallel, communication device within reach, a triage temperature label and discreet clinician checklist, no fabricated other observations, no hospital logos.

**On-screen text:** `FEVER: 39.4°C (SYNTHETIC)`; `LETHARGY: MARKED, NEW`; `OXYGENATION: UNVERIFIED`; `CAUSE: NOT DETERMINED`; `POSSIBLE SEPSIS: ASSESS`; `AAC: SUPPORT ACCESS`.

**Alt text:** A fictional adult with cerebral palsy is evaluated in an Australian emergency department for fever, lethargy and a cough. Staff coordinate respiratory assessment and communication support; no organism or definitive diagnosis is displayed.

**Safety:** No caricature or disability-to-incapacity shortcut; no high-risk clinical shortcut or implied efficacy. Outcome requires source-bound qualified clinical decisions and reassessment.
