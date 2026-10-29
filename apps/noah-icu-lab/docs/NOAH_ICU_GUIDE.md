# Noah ICU — Heart & Lung Lab

Version 0.4.0 · 29 October 2026

## Purpose and scope

This is a working browser simulation for exploring heart–lung interaction, mechanical ventilation, manual bag ventilation and an explicit adult arrest exercise. It uses fictional adults with cerebral palsy and Duchenne muscular dystrophy. It is an educational engineering prototype with unvalidated numerical physiology, not a medical device, bedside decision tool, treatment prescription or competence assessment.

The default airway is an existing tracheostomy tube. An oral endotracheal tube (ETT) is a separate model configuration. Bag–valve–mask uses a face mask over the mouth and nose in a separate natural-airway demonstration. Selecting a route does not perform an airway exchange. No tracheotomy, intubation, tube replacement, suction technique, drug administration or defibrillation procedure is taught.

The interface represents one bedside nurse coordinating with an ICU team. It does not imply that a single person performs all airway or resuscitation work alone. Adult and paediatric source material remain separate.

## Code Blue rooms

The room board starts with three distinct adult templates:

| Room | Fictional person and purpose | Entry support |
| --- | --- | --- |
| ICU 01 | Maya, 26; CP and secretion obstruction | Existing tracheostomy and ventilator |
| ICU 02 | Kai, 19; DMD and an explicit arrest exercise | Existing oral ETT and ventilator |
| Skills 03 | Alex, 35; generic adult BVM arrest exercise | Natural airway, face mask and manual bag |

Each room keeps its own physiology, care state, event timeline, team annotations and reflection during the page session. Only the active room advances; entering another room parks the previous one. The room cards label entry configuration separately from later bedside changes. Export the room board to preserve all visited rooms before reloading.

**Activate simulated Code Blue** records a teaching response and help request. It does not place a real call, dispatch staff, change the patient's circulation or establish cardiac arrest. Team-role acknowledgements and read-backs are recorded in parallel; they never gate the rescue controls. The six-role layout is a training design, not a universal staffing requirement. The two-minute coordination display follows model time only and never directs a compression interruption or rhythm check.

The React Native companion provides native mobile controls for the same room identities and copies the exact tested engine source. Its dedicated README gives Expo start/build instructions and the device-testing limits. The browser lab provides the full waveforms, anatomy and bedside action stations.

## Start exploring

1. Open the app and select Maya (adult CP) or Kai (adult DMD).
2. Read the personal baseline, current fictional ICU context, communication method and goals.
3. Select an acute scenario or keep the supported baseline. Every new scenario starts paused after 120 seconds of synthetic baseline preconditioning; the displayed clock therefore begins at 02:00.
4. Use **Step +5 s** for a controlled comparison or **Run simulation** for continuous evolution. Speed changes model time, not biological validity.
5. Compare pressure, flow, volume and exhaled CO₂ with the bedside observations. The separate model-truth view shows calculated states that are not measured blood gases.
6. Pause, change an assumption, apply it and reassess. Export the event history and trends for debrief.

Background tabs pause; the app does not penalise the user with catch-up deterioration. Reset and profile/scenario changes discard the current in-memory run. Export first when the run should be retained.

## Ventilator controls

Pressure control and volume control share the same two-compartment resistance–compliance model. Controls include oxygen concentration, PEEP, inspiratory pressure or target volume, mandatory rate, inspiratory time and a model pressure cap. Changes remain a draft until **Apply to model** is selected.

The pressure cap can limit volume delivery. Resistance and compliance affect delivered volume. Incomplete expiration can produce intrinsic PEEP. A leak can separate circuit-measured expired volume from the effective model lung excursion. Oxygen concentration does not directly clear CO₂.

The broad limits and starting values are software exploration inputs, not recommended ventilator settings. Predicted body weight is an authored 60 kg reference for each fictional profile; it is not calculated from a real person.

## Manual bag / bag–valve–mask

Open **Bag & CPR**. Choose the manual source and one of three distinct interfaces: existing tracheostomy, existing ETT, or a face mask. Confirm the fictional trained-responder, compatible-interface, equipment and oxygen-source readiness.

**Deliver one simulated breath** requests one timed inspiration. It uses the current resistance, compliance, secretion and leak assumptions. It does not force a normal tidal volume, clear obstruction or reset gases. The source produces no automatic follow-on breaths.

When the clock is paused without an access hold, the button explicitly advances inspiration and early expiration. During Run it queues the breath into running time. During AAC access or switch scanning it queues the breath while time remains frozen; end the hold and explicitly resume to deliver it. An active or queued inspiration must finish before source, interface or breath assumptions can change.

The displayed manual cadence uses actual activations in a rolling window, with a minimum observation window to avoid an infinite initial estimate. It is not the ventilator's set rate and is not a recommended bagging rate. The pressure, duration and oxygen controls are declared model assumptions, not instructions for physically squeezing a bag.

A checked bag route bypasses a failed ventilator circuit. Lung pathology, secretion resistance and interface leakage remain. The disconnected flag describes the machine circuit; it does not imply the bag is disconnected.

## Compression exercise

Use **Load fictional adult arrest**, then record the scenario's rapid recognition and help request. The stated scenario is unresponsiveness with absent normal breathing. Disability, respiratory support or low blood pressure alone cannot establish the arrest state.

Start/stop controls and rate, depth and recoil inputs drive limited synthetic compression-generated forward flow. The counter advances only with simulation time. Pausing compressions stops completed cycles and allows generated flow to decay. A learning pause freezes the entire model.

With a natural-airway mask, the model requires a compression pause for a breath and completion of that inspiration before compressions restart. Existing ETT/tracheostomy routes allow concurrent ventilation and compressions. The interface links the relevant ANZCOR distinction: 30:2 without an advanced airway, and its stated 6–10 ventilations/min during adult CPR with an advanced airway. The model does not automatically schedule a 30:2 cycle or implement the full ALS algorithm.

Compression flow is always separate from intrinsic cardiac output. It never creates automatic ROSC, a prognosis or a survival score. Heart rate, clinical blood pressure and pulse oximetry are not displayed as reliable bedside observations during the arrest exercise. Synthetic pressure/flow remain explicitly labelled. No electrical rhythm diagnosis is made.

**Arrest-specific limit:** arterial-gas interpretation is unavailable in this no-flow/low-flow model. Its single buffered gas state lacks tissue, venous–arterial separation, perfusion-limited exchange and reperfusion components. Gas numbers must not be interpreted as predicted clinical arterial blood gases. The model is useful for mechanical breath and action coordination experiments, not arrest gas kinetics.

The arrest exercise retains authored baseline machine inputs; these are not an ALS ventilation prescription. Exit the exercise resets to the supported baseline; it does not narrate a recovery caused by compressions.

## Communication, agency and bedside workflow

Personal baseline, new clinical change, communication access and team readiness are separate. No answer means unknown. Communication impairment does not imply impaired decision-making capacity. The person is addressed first, with their chosen supports and a reliable backup route.

AAC access and switch scanning pause model time. Ending a clock hold does not clear a confirmed WAIT message or imply agreement to planned care. A case-authored agreement applies only to the selected planned action and is consumed on commitment.

Action stations follow **selected → checked → assigned → committed**. Selection alone cannot deliver an intervention. Readiness is a fictional attestation, not proof that a real clinician is present. Urgent circuit assessment/escalation can proceed alongside restoring communication access. Planned secretion management, positioning and comfort require their own evidence and agreement gates. Reassessment follows change; clearance is partial and cannot silently correct unrelated physiology.

Airway replacement is context-only. It cannot be committed as an improvised procedure. The emergency compression branch remains distinct from planned-care consent gates.

## Accessibility

- Native labelled controls and visible keyboard focus.
- Large text, high contrast, text view and reduced motion.
- Code-rendered anatomy and waveforms with text equivalents.
- Button scanning at 1.8 seconds per action; Space/Enter activates and Escape ends scanning.
- Dedicated scan-access route and readiness buttons for manual ventilation.
- Queueing while scanning or using AAC, followed by an explicit resume control.
- Equivalent text commands for bedside stations and common session actions.

These features have engineering and browser checks. They are not a claim of WCAG conformance, assistive-technology certification or completed lived-experience usability testing.

## Debrief and exports

The handover view compares the current model with its own preconditioned baseline and records assessment, treatment, reassessment, communication, escalation, teamwork and individual-plan review. Reflection text stays in the browser session until the user exports it.

JSON includes fictional profile, settings, assumptions, engine state, care/emergency state, events, trends, reflection, references and limitations. CSV labels synthetic quantities and includes spontaneous-pulse, pulse-oximeter-availability and compression-flow fields. A numerical CSV saturation during arrest is synthetic model state; the availability field must be used for interpretation.

A complete FormHug-compatible debrief definition is provided for fictional simulation reflection. The FormHug connection requires reauthentication; no live draft or submission has been created in this session. The app does not automatically transmit sessions, patient data or reflection text. See the FormHug integration note for the connection status and reproducible fields. Healthcare Public Data was used to verify literature, not to import a clinical dataset or calibrate this individual model. Personal Health records are outside this fictional professional task.

## Evidence and engineering

Clinical sources determine which questions and observations matter. They do not validate the equations, constants, thresholds, time course or compression-flow values. See `healthcare-public-data-evidence.md`, the app's Evidence & scope view, and `src/features/cardiopulmonary/runtime/MODEL.md` for the model contract, source mapping and limitations.

The current model has no spontaneous breath triggering, dyssynchrony, recruitment model, complete cardiac electrophysiology, drug effects, metabolic compensation, tissue oxygen-store model, weaning predictor or patient-specific prognosis. Positive pressure uses a simplified preload-dominant circulatory effect and does not reproduce all beneficial LV-afterload effects.

Before formal teaching or assessment deployment, the next review should include an ICU/respiratory clinician, airway/resuscitation educator, accessibility specialist, and paid disability-led participants. Engineering tests are evidence of specified software behavior only.

## Caption and visual brief

Caption options: “Ask what is usual.” “Oxygenation is not ventilation.” “No response means unknown.” “Compression flow is not ROSC.” “Check the effect after the action.”

Production brief: an adult Australian ICU teaching scene; one bedside nurse speaks directly to a person using eye-gaze AAC while qualified colleagues coordinate the airway workstream. Keep the airway route unambiguous, preserve access to the call control, and show calm supported assessment. Avoid invasive technique, distress spectacle, invented hospital endorsement or assumptions about cognition. The precise physiology schematic is rendered in code.

Suggested still-image alt text: “An ICU teaching dashboard shows the selected airway connected to the two lungs, a simplified heart circulation loop, respiratory traces, synthetic observations and separate bag-ventilation and compression controls. Text labels identify unavailable measurements and communication access.”
