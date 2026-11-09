# AURA — ICU Telemetry / Adult Sepsis Temperature Safety

**Design version:** 2026-11-09. **Case:** fictional adult Alex Morgan (27, cerebral palsy), ED → ICU **consultation** (not an established admission). Rohan's age-12 DMD asystole branch is separate and untouched.

## JMO clinical framing

Alex has an authored ED *spot* fever of 39.4°C and marked new lethargy with a chest-infection working diagnosis. Respiratory rate, reliable SpO₂, heart rate, blood pressure, core temperature, actual ECG traces, serum lactate, and organ dysfunction have **not been provided or acquired**. Do not assume shock, ICU admission, sepsis confirmation, arrhythmia, ECG waveforms or any need for cooling. Urgent qualified A–G and senior/local CERS escalation proceed while communicating with Alex using their chosen accessible method.

## Monitoring architecture

- **Bedside telemetry:** clinical indication must be assessed by qualified staff; monitoring rhythm via validated 3- or 5-lead ECG, documenting signal quality. This is not equivalent to a diagnostic 12-lead.
- **12-lead diagnostic ECG:** requested/acquired/interpreted only when indicated; twelve lead labels in the UI intentionally show "Not acquired" to avoid a misleading normal or flatlined waveform.
- **Body temperature:** 39.4°C initially recorded at fictional triage with unreported method. Repeat accurate measurements are pending. *Core* temperature monitoring depends on appropriate device selection, indication, placement and signal validity; no invasive probe is inserted simply because the learner selects "continuous".
- **Perfusion and respiration:** qualified assessments of BP, SpO₂ signal, RR, breathing pattern, capillary refill, consciousness, glucose, intake/output and lactate where relevant. Device displays do not supply observations automatically.
- **Clinical titration:** monitor *clinician-managed* indicated therapies according to an actual target and validated observation, not a closed-loop algorithm chasing body temperature.

## Chilled saline infusion and ice packs — STOP gate

These are visible in the intervention tray but **not executable**. Fever from infection is not equivalent to environmental heat-stroke hyperthermia or a separately established neurocritical/after-arrest temperature-control indication.

The **2026 Surviving Sepsis Campaign adult guidelines** suggest against pharmacologic or surface antipyretics solely to improve sepsis clinical outcomes (conditional; very low certainty). They permit individual symptom/pain comfort decisions, which are a different clinical question. This guideline does **not** endorse chilled intravenous saline as a routine treatment for fever. Avoid implying that chilled saline and ice packs constitute an automatic combined sepsis protocol. IV crystalloids for hypoperfusion/shock are separately indication- and fluid-responsiveness-led; the target is perfusion, with repeated review for overload.

Cold saline infusion could impose unwanted fluid volume and temperature shifts without established indication. Aggressive external cooling may contribute to shivering, discomfort, skin injury or unintended hypothermia, while masking fever trends. These are risk considerations, **not** claims that such events have happened to Alex.

If a separately justified temperature-management indication arises, an authorised local ICU protocol, qualified clinician and verified sensor are required before specifying any technique or treatment control. That branch is not implemented.

## Source hierarchy and dates

1. NSW ACI Adult ECAT Sepsis (suspected), **published October 2026**, adults 16+: https://aci.health.nsw.gov.au/ecat/adult/sepsis — urgent recognition, investigations, local CERS, treatment within professional scope, reassessment; no chilled-saline fever-control recommendation. Local hospital protocols remain controlling.
2. Society of Critical Care Medicine / ESICM Surviving Sepsis Campaign, **March 2026**, adults: https://www.sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026 — fever recommendation; fluid indication/reassessment and caution against overload.
3. SCCM/IDSA Guidelines for Evaluating New Fever in Adult ICU Patients, **2023**: https://www.idsociety.org/practice-guideline/new-fever-in-critically-ill-patients/ — prefer existing validated central temperature methods when accurate monitoring critical; avoid routine antipyretics solely for fever reduction.
4. ACI Cardiac Monitoring Adult Cardiac Patients, April 2022, next review 2026: https://aci.health.nsw.gov.au/networks/cardiac/resources/cardiac-monitoring — **limited to primary cardiac diagnoses**, used for telemetry-vs-12-lead conceptual distinction, not as a sepsis operational policy. For use in 2026 obtain updated local procedures.

## Runtime and human rights contract

The `icu-telemetry.mjs` reducer is **review/education only**: select → check → assign → document → reassess; missing data remain unknown. No device connection, IV order, therapy administration, core-probe insertion, ECG diagnosis, automatic cooling/temperature titration or patient physiological effect. The cooling buttons cannot be committed even with the interface's assignment steps. The learner can independently document legitimate monitor planning, repeat-observation planning and fluid indication review.

Patient communication remains primary. The system must not treat dysarthria, cerebral palsy, fatigue or delayed AAC as global incapacity, and skin/positioning needs must be considered for monitoring placement.

Clinical, pharmacology, consent/rights, accessibility and independent disability-led reviews remain PENDING. No clinical device/operational deployment.
