# Synthetic cardiopulmonary model

This is an inspectable adult educational simulation. It is not fitted to individual people or validated against ventilator hardware, measured blood gases or clinical outcomes. The numbers are illustrative. Clinical review and disabled-person co-design review remain necessary before educational assessment use.

## Mechanics

Two parallel lung compartments share a common airway resistance. Total compliance is divided by `leftComplianceFraction`. Common resistance is 30% of the selected resistance; each branch resistance is 140%, making the equivalent resistance equal to the selected value for equal compartments. `secretionBurden` multiplies total resistance by `1 + 4 × burden`, an illustrative relationship.

For each compartment, `P_alveolar = V/C − P_muscle` and `flow = (P_node − P_alveolar)/R`. A fixed 0.01-second implicit Euler step solves both lung branches and the common resistance. Volumes are above a zero-elastic-pressure reference, not anatomical total lung capacities. Expiration follows the same mechanical equation. Residual end-expiratory elastic pressure above set PEEP is the model's intrinsic PEEP.

Pressure control applies an inspiratory pressure above PEEP, subject to the configured pressure cap. Volume control requests constant inspiratory flow; actual delivery falls if the pressure required would exceed the cap. Pressure-limited volume control is therefore visible as inadequate delivery rather than falsely meeting its requested volume.

Muscle effort is a positive inspiratory pressure contribution, synchronized with mandatory breaths. It is not a spontaneous breathing, trigger, support, fatigue or dyssynchrony algorithm. Both modes are timed mandatory models. The ETT/tracheostomy selector changes route metadata only: real route resistance depends on tube geometry, secretions and other factors, so the model requires explicit resistance values rather than an automatic route advantage.

An uncompensated leak attenuates delivered PC pressure or VC flow and separately reduces measured expired volume. This approximates a leak response without modeling real ventilator leak compensation. Circuit disconnection sets displayed pressure, flow and expired tidal volume to zero and makes simulated ETCO₂ unavailable. Lung recoil continues internally.

## Gas exchange and circulation

- Actual breath excursion minus fixed dead space gives alveolar ventilation. Measured expired VT and actual lung excursion remain separate in a leak.
- CO₂ accumulation follows `dPaCO₂/dt = (0.863 × VCO₂ − V_A × PaCO₂)/(20 × 60)`. VCO₂ is in mL/min; V_A is in L/min. The steady-state relationship is physiological; the fixed 20 L effective buffer and transient response are illustrative. FiO₂ is absent from the CO₂ equation.
- Alveolar oxygen uses `P_AO₂ = FiO₂ × 713 − PaCO₂/0.8` at an assumed sea-level pressure. A fixed Hill curve and oxygen-content mixing approximate a shunt. Hb-bound oxygen uses `1.34 × Hb × saturation`; dissolved oxygen uses `0.0031 × PO₂`.
- A low-ventilation supply factor, fixed oxygen consumption of 250 mL/min and 14-second oxygen response are illustrative, not patient-calibrated. The reduced alveolar gas equation loses accuracy at high FiO₂; its RQ remains fixed at 0.8 independently of the adjustable CO₂-production input and fixed oxygen consumption. These are declared independent approximations. There is no regional V/Q, diffusion limitation, recruitment/recruitability, oxygen toxicity or altitude model. PEEP changes mechanics and the simplified circulation, but does **not** automatically recruit shunt or improve oxygenation.
- pH uses the Henderson–Hasselbalch relationship with fixed bicarbonate 24 mmol/L. It is an acute respiratory approximation; chronic compensation and metabolic disorders are absent.
- ETCO₂ is a separate estimated quantity with a dead-space/perfusion gap. It is not a blood-gas reading. It becomes unavailable when a reliable expired trace is absent. The displayed capnogram shape is illustrative, not a simulated CO₂ transport measurement.
- Cardiac reserve scales a synthetic baseline cardiac output. Hypoxia, hypercapnia and mean airway pressure affect simplified circulation. The pressure effect is **preload-dominant only**; actual positive-pressure effects depend on preload, right-heart load and left-heart afterload. The model does not predict a person's response to PEEP.
- During ordinary perfusion the ECG is an illustrative sinus trace derived from simulated heart rate. During the explicit arrest exercise, intrinsic ECG is suppressed and compression-motion artifact is shown separately; this is not a diagnosis of asystole or any other rhythm. There is no electrophysiology, rhythm classification, shock, drug, injury, prognosis or automatic resuscitation-outcome model. Severe out-of-domain physiology should trigger a facilitator pause rather than infer an outcome.

## Manual bag ventilation

`VentSettings.ventilationSource` selects `ventilator` or `manual-bag`. The bag can connect to an existing ETT or tracheostomy tube. A separate `mask` route represents natural-airway bag-mask ventilation and is only allowed with the manual source. This selector is simulation configuration, not an airway-exchange procedure.

`deliverManualBreath(state, settings, parameters)` requests one pressure-shaped inspiration. It does not advance time, instantly deliver a chosen volume or normalize gas values. `advanceModel` delivers the requested breath through the **same lung compartments and resistance** over the configured inspiratory time. A repeated command during an active squeeze is ignored. No subsequent breath occurs unless another command is given. Bag pressure, duration, oxygen fraction, any configured PEEP and leak represent synthetic supplied-device assumptions, not measured bag performance or a recommended clinical setup.

The configured machine rate has no effect on the timing of manual breaths. Delivered breath count, recent average rate, expired minute ventilation and alveolar ventilation are computed from actual manual events over a bounded recent window. That window expands from ten to sixty seconds, so startup values are estimates and a single breath's contribution expires. The capnogram is unavailable when no expired manual-breath sample remains. Scanning/communication pauses freeze manual delivery as well as the rest of the model.

The existing `disconnected` parameter means a **ventilator-circuit** fault. A checked connected bag route bypasses that circuit; it does not clear secretions, remove obstruction, change compliance or repair gas-exchange impairment. The interface must establish bag/route readiness before switching. The model does not implement tube insertion, removal, suction technique or airway rescue procedures.

## Explicit arrest and compression exercise

`LungParameters.circulationState = 'arrest'` is a deliberate facilitator state. Low saturation, low blood pressure, disability or a numerical cardiac-reserve value never activates arrest automatically. The interface's rapid-recognition gate should use unresponsiveness and absent normal breathing, without waiting for certain pulse palpation; escalation occurs in parallel with communication access.

Arrest sets intrinsic cardiac output to zero. Compressions can then be started or stopped with `compressionsActive`, with rate, depth and recoil parameters. The maximum illustrative mean forward-flow contribution is 1.6 L/min, scaled by a synthetic rate relationship, depth contribution and recoil. This is a transparent educational assumption, **not** a validated compression-efficacy formula. Completed cycles increment `state.compressionCount`. Pauses stop the count and generated flow decays over simulation time. The model has no injury predictor; increasing depth above the modeled contribution cap provides no extra benefit.

`metrics.intrinsicCardiacOutput`, `metrics.compressionFlow` and total `metrics.cardiacOutput` remain distinct. Compression-generated forward flow and ECG artifact do not establish spontaneous circulation. `spontaneousPulsePresent` and `pulseOximeterAvailable` remain false throughout the arrest/CPR state. The saturation value remains available only as explicitly labeled hidden/model physiology, not a reliable clinical pulse-oximeter reading. The ETCO₂ estimate responds to the simplified flow contribution; it never declares ROSC.

**Arrest gas validity is limited.** The oxygen/CO₂ equations continue to evolve a single synthetic gas compartment during no-flow or low-flow arrest. They do not model tissue CO₂ accumulation, venous–arterial separation, perfusion-limited pulmonary exchange, reperfusion washout or the location/timing of a blood sample. Consequently, the displayed PaO₂, PaCO₂, pH and saturation are **outside their intended arterial-gas interpretation during arrest/CPR**. Ventilation can change these numbers even with no forward flow; that does not mean oxygen is reaching tissue. Oxygen delivery remains zero when total modeled blood flow is zero. The CPR ETCO₂ correction is a qualitative flow illustration and does not repair this arterial-gas limitation. No gas value can establish ROSC, adequacy of organ perfusion or a prognosis.

An arrest state starts with zero heart rate, zero intrinsic output and zero synthetic pulse pressure; any residual mean pressure is an internal model quantity, not a clinical blood-pressure reading. The synchronized inspiratory muscle-effort parameter is inactive during explicit arrest because agonal effort is not modeled.

Manual mask breaths are blocked while arrest compressions are configured active. The learner pauses compressions for the natural-airway 30:2 exercise. Existing ETT/tracheostomy routes permit a manual breath while compressions continue. There is no automatic 30:2 controller or automatic breath-rate controller: the user controls timing and reviews the observed count/rate.

The only restoration path is an explicit facilitator change back to `perfusing`. This restores partial synthetic intrinsic flow (half the selected reserve-scaled baseline) while preserving the accumulated gas state and allowing the cardiovascular model to settle. It is an authored scenario transition, never an inferred clinical outcome. `advanceModel(..., 0)` synchronizes an explicit arrest/restoration event and sensor-validity flags without advancing time or resetting gases.

## Interface contract

`createModel(settings, parameters)` creates a synthetic starting state. Initial delivery values are estimates until a complete machine breath has been observed; `completedBreaths` is exposed for the interface to label settling. `advanceModel(state, settings, parameters, seconds)` returns a new state. It never advances on wall time by itself. Scanning, reading, communication and pauses are controlled by the caller.

All external settings and parameters receive finite-value normalization. Software ranges are not prescriptions. One advance call is capped at 600 simulated seconds as a resource guard. History is sampled at 20 Hz and capped at 1,200 samples, corresponding to sixty seconds.

## Evidence and validation boundary

The AARC guideline supports the **clinical distinctions** among ventilator settings, delivered volume, plateau/elastic pressure assessment, PEEP, auto-PEEP, humidification and airway securement. It does not validate this numerical implementation:

- AARC, *Patient–Ventilator Assessment*, 2024: https://www.aarc.org/wp-content/uploads/2024/10/patient-ventilator-assessment-aarc-cpg.pdf
- DMD respiratory care guidance supports measuring ventilation/CO₂ and avoiding saturation-only interpretation: https://pmc.ncbi.nlm.nih.gov/articles/PMC11041593/
- ANZCOR Guideline 6, *Compressions*: https://www.anzcor.org/home/basic-life-support/guideline-6-compressions — recognition based on unresponsiveness and absent normal breathing; adult compression rate 100–120/min and depth more than 5 cm. The software's broader parameter ranges are exploratory bounds, not guideline targets.
- ANZCOR Guideline 11.6, *Equipment and Techniques in Adult Advanced Life Support*: https://www.anzcor.org/home/adult-advanced-life-support/guideline-11-6-equipment-and-techniques-in-adult-advanced-life-support — natural-airway 30:2 versus established advanced-airway ventilation during continuous compressions, with 6–10 breaths/min stated in that guidance.
- Original ICU-data paper using the CO₂ ventilation relationship: https://pmc.ncbi.nlm.nih.gov/articles/PMC2945122/
- Derivation and limitations of alveolar gas equations: https://journals.physiology.org/doi/full/10.1152/advan.00064.2019
- Official Pulse respiratory methodology, an external reference rather than an implemented dependency: https://pulse.kitware.com/_respiratory_methodology.html

Meaningful automated checks cover R-C analytical agreement, directional mechanics, pressure limitation, gas trapping, CO₂/FiO₂ separation, disconnection behavior, cardiac reserve, route neutrality, finite extremes, immutability, explicit time and bounded history. Additional checks cover no automatic manual breaths, time-dependent bag delivery, retained obstruction, actual manual rate, explicit arrest, compression-flow/pulse separation, pause decay, mask versus advanced-airway coordination, finite compression settings, and explicit restoration without gas reset. Passing them establishes consistency with the stated equations; it does not establish medical-device performance, clinical validity or clinical competence.
