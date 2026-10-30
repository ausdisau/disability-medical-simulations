# Noah ICU · Resuscitation theory and disability adaptation

Curriculum design, 30 October 2026. **Adult NSW educational simulation only; not clinical validation.**

## Purpose
Teach the science of resuscitation **before** introducing individual adaptations for disabled patients. Do not create a separate lower standard of care. Disability is not evidence of cardiac arrest, lack of capacity, a do-not-resuscitate decision, poor quality of life or an inevitable adverse outcome.

## Four-stage teaching loop
1. **Learn** standard adult recognition, compressions, ventilation, airway routes, team communication and reassessment, linked to authoritative references.
2. **Adapt** to the patient's authored baseline, airway anatomy, posture, respiratory reserve, devices, communication, goals and emergency plan.
3. **Demonstrate and practise** on the activity-driven manikin, then in the Code Blue room with bag/ETT/tracheostomy and chest-compression controls.
4. **Debrief** action, evidence, assumptions, reassessment, access, team roles and uncertainty. Do not score survival or infer clinical competence.

## Modules and cases
| Core module | Disability-aware application |
| --- | --- |
| Recognise arrest | Distinguish dysarthria/AAC delay from clinical unresponsiveness; detect real respiratory deterioration |
| Compression physiology | Assess positioning and physical access; don't invent diagnosis-specific compression targets |
| Oxygenation ≠ ventilation | CP authored secretion/circuit concerns; DMD possible hypoventilation and respiratory muscle weakness |
| Airway routes | Face mask, oral ETT and tracheostomy are distinct; verify plan, equipment and trained responders; laryngectomy requires a different pathway |
| Communication and teamwork | Direct address, AAC, closed-loop exchange, support person as access partner; parallel urgent care |
| Reassessment | Patient baseline, delivered breath response, cardiac considerations, partial response and unresolved causes |

Existing rooms: ICU 01 fictional Maya with CP/tracheostomy/secretions; ICU 02 fictional Kai with DMD/existing ETT/arrest; Skills 03 generic adult natural-airway BVM/arrest. A learning view is added before the room simulation. The new lessons are unscored and do not control the clinical model; the existing action stations and physiology remain deterministic.

### Example beat
Maya uses an eye-gaze AAC device. A low-volume alarm appears and her chest movement reduces. The learner must distinguish her normal communication and tone from the new respiratory change, assess the person and connected circuit, check the established airway plan, summon qualified assistance and reassess. This does not constitute cardiac arrest unless the arrest recognition evidence is independently established.

## Model and access boundaries
- Manikin sternum motion is not verified blood flow; synthetic compression-generated flow is not spontaneous circulation.
- Visible inflation is not proof of oxygenation or CO2 clearance.
- Modelled gas values during arrest do not represent clinically validated arterial gases.
- AAC holds pause learner/simulation time for access, **not the real-world obligation to respond promptly to an emergency**.
- Equipment availability is not an indication. Planned care and consent remain person-directed; urgent arrest response follows current clinical protocol and applicable law.
- Real patient data, medication dosing, device driving, intubation procedures, survival prediction and clinical certification remain outside scope.
- Validate with resuscitation educators, ICU/respiratory specialists and paid disability-led co-design before formal teaching deployment.

## Clinical reference set (verified 30 October 2026)
- ANZCOR 8 CPR: https://www.anzcor.org/home/basic-life-support/guideline-8-cardiopulmonary-resuscitation-cpr
- ANZCOR 11.2 Adult ALS: https://www.anzcor.org/home/adult-advanced-life-support/guideline-11-2-protocols-for-adult-advanced-life-support
- ANZCOR 11.6 adult equipment: https://www.anzcor.org/home/adult-advanced-life-support/guideline-11-6-equipment-and-techniques-in-adult-advanced-life-support
- NSW ACI advanced life support: https://aci.health.nsw.gov.au/networks/eci/clinical/tools/advanced-life-support
- NSW ACI adult tracheostomy care: https://aci.health.nsw.gov.au/networks/icnsw/clinicians/acute-tracheostomy
- DMD respiratory consensus: https://pmc.ncbi.nlm.nih.gov/articles/PMC11041593/
- NSQHS communicating for safety: https://www.safetyandquality.gov.au/standards/nsqhs-standards/communicating-safety-standard

**Mobile parity:** the React Native companion now presents all six interactive, unscored lessons from the same `shared/noah-resuscitation/curriculum.ts` source, with native case selection, feedback, references and paused transitions into its existing rooms. The web anatomical animation remains web-only.

**Next:** independent clinical-review sign-off, paid lived-experience co-design and separate assistive-technology usability evaluation. Engineering tests are not clinical validation or accredited assessment.
