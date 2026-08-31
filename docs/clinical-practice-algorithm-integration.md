# Clinical Practice and Emergency Algorithm Integration

Status: educational simulation engineering prototype  
Jurisdiction: NSW, Australia  
Branch: `feature/biosocial-family-relational-substrate`

## Goal

Use current Australian/NSW clinical practice structures to make Project Hope scenarios behave plausibly under deterioration, cardiac arrest, post-ROSC care, sepsis and tracheostomy emergencies without turning a language model into an autonomous clinical controller.

## Authoritative source set

The implementation is abstracted from:

- ANZCOR Guideline 8 — Cardiopulmonary Resuscitation (CPR)
- ANZCOR Guideline 11.2 — Protocols for Adult Advanced Life Support
- ANZCOR Guideline 11.6.1 — Targeted Oxygen Therapy in Adult Advanced Life Support
- ANZCOR Guideline 11.7 — Post-resuscitation Therapy in Adult Advanced Life Support
- NSW Clinical Excellence Commission — Clinical Emergency Response System
- NSW Clinical Excellence Commission — Sepsis pathways
- Australian Commission on Safety and Quality in Health Care — Sepsis Clinical Care Standard
- Australian Commission on Safety and Quality in Health Care — Antimicrobial Stewardship Clinical Care Standard
- NSW Agency for Clinical Innovation / Intensive Care NSW — Care of adult patients in acute care facilities with a tracheostomy
- NSW Health — Advance care planning / Advance Care Directives

The code stores source metadata and URLs in `CLINICAL_GUIDELINE_SOURCES`.

## Architecture

```text
scenario-authored observations / physiology
                |
                v
clinical-practice-algorithm-engine.js
                |
                +--> active pathways
                +--> BLS learner actions
                +--> clinician-led action classes
                +--> source provenance
                +--> NPC-safe clinical facts
                |
                v
clinical-aware-npc-response-engine.js
                |
                v
dynamic NPC dialogue
```

The LLM/dialogue renderer can describe the state but cannot commit an arrest, ROSC, sepsis diagnosis, tracheostomy emergency, medication, device setting, capacity finding, legal authority, prognosis or treatment ceiling.

## Deterioration / CERS

The engine expects the scenario or observation-chart layer to supply a local trigger (`yellow`, `red`, patient/family escalation). It does not duplicate Between the Flags numerical thresholds because local chart logic should remain authoritative.

- Yellow -> clinical review pathway
- Red -> rapid-response / emergency escalation
- Patient/family concern -> escalation pathway may activate even when a numeric trigger is absent

This allows NPCs to plausibly say that a clinical review or rapid-response pathway is active without inventing the threshold.

## Cardiac arrest

BLS recognition uses the ANZCOR principle that an unresponsive person who is not breathing normally requires CPR, emergency activation and AED use when available.

When the authored simulation declares absent circulation, the ALS layer separates:

- shockable: VF / pulseless VT
- non-shockable: PEA / asystole

The engine exposes high-quality CPR, rhythm-appropriate defibrillation, reversible-cause management and protocol-level ALS medication classes as clinician-led actions. Medication doses are intentionally excluded from the educational dialogue/runtime layer.

## Post-ROSC

The engine exposes the following post-ROSC concepts:

- continued airway/ventilation support guided by monitoring;
- avoidance of hypoxaemia and hyperoxaemia;
- initial monitored SpO2 target 94–98%, or 88–92% when hypercapnic respiratory failure is authored;
- normal physiological PaCO2 target (35–45 mmHg) when blood-gas information is available;
- haemodynamic goals with an initial MAP around at least 60–65 mmHg or SBP above 100 mmHg, individualised thereafter;
- ECG, blood gas, electrolyte and glucose review;
- treatment of the underlying cause;
- fever prevention at <=37.5 C for at least 72 hours when the patient remains comatose after ROSC;
- no immediate neurological prognosis from early appearance alone.

The engine does not treat ROSC as recovery.

## Sepsis

When infection is suspected alongside deterioration/organ dysfunction, the simulation can activate a sepsis pathway and expose:

- urgent pathway activation and escalation;
- lactate as part of assessment;
- cultures before antimicrobial treatment when this will not delay urgent treatment;
- immediate appropriate empiric antimicrobial treatment for life-threatening suspected infection according to the local formulary/pathway;
- source-control assessment where relevant;
- ongoing review of response and antimicrobial plan.

No specific antimicrobial or dose is selected by the dialogue engine.

## Tracheostomy emergencies

A tracheostomy emergency pathway activates only when the authored scenario includes a tracheostomy, respiratory deterioration and patency that is absent or not established.

The BLS/learner layer can:

- recognise deterioration;
- call for expert airway / rapid-response help;
- report the tracheostomy emergency clearly.

The advanced layer can describe clinician-led assessment of oxygenation, ventilation, tube/circuit patency and capnography where available. Invasive tracheostomy manipulation remains governed by local clinical procedure and trained airway staff.

## Communication and disability safeguards

Clinical deterioration can affect timing and feasibility of communication, but the engine keeps these invariants:

```text
communication difficulty != incapacity
disability != emergency threshold
family presence != substitute decision-making authority
physiological severity != treatment futility
NPC dialogue != consent/refusal
NPC dialogue != clinical event
```

AAC is treated as clinical/access infrastructure. It should remain available whenever clinically feasible and should be restored promptly after an emergency.

## Learner scope

The default Project Hope learner scope is BLS.

Therefore directly assignable learner actions are restricted to recognition, calling for help/escalation, CPR/AED when indicated, observation/reporting, equipment retrieval within role, and communication-access support.

ALS, airway, prescribing, ventilator, vasoactive, invasive tracheostomy and post-ROSC optimisation actions are represented as clinician-led team actions unless the scenario explicitly targets appropriately trained clinicians.

## NPC realism

NPCs may use the clinical-practice context to ask realistic questions such as:

- What do you know right now?
- What is still uncertain?
- Is the rapid-response team here?
- Has her heart started again?
- Is this a sepsis pathway?
- What are you monitoring next?
- Is the tracheostomy still patent?

They must not invent a diagnosis, prognosis, treatment decision or state transition.

## Copyright / provenance boundary

This module does not reproduce proprietary or guideline flowchart artwork. It implements an original software abstraction of selected recommendations and pathway concepts with source provenance. Local hospital policy and current authoritative guidance remain controlling references.
