# Mobile and web authored-case consistency

Checked 29 October 2026 against the Noah ICU web lab’s `src/features/cardiopulmonary/content/cases.ts` and `content/rooms.ts`. This is a parity record for authored synthetic inputs, not a clinical reference, patient dataset or calibration claim.

## Shared inputs

The native coordinator mirrors the web profile plus scenario and room overrides. Normalization supplies the same engine defaults to optional circulation/compression fields.

| Input | ICU 01 · Maya Chen, 26 | ICU 02 · Kai Morgan, 19 | Skills 03 · Alex Taylor, 35 |
| --- | --- | --- | --- |
| Profile / change | CP / secretions | DMD / explicit arrest | Generic adult / explicit arrest |
| Source / interface | Ventilator / tracheostomy | Ventilator / existing ETT | Manual bag / natural-airway mask |
| Mandatory mode | PC | PC | PC metadata; bag uses pressure assumption |
| FiO₂ / PEEP | 0.35 / 5 cmH₂O | 0.35 / 5 cmH₂O | 0.35 / 5 cmH₂O |
| Mandatory rate / inspiration | 16/min / 1 s | 16/min / 1 s | 16/min metadata / 1 s; no automatic bag breaths |
| Pressure above PEEP | 14 cmH₂O | 13 cmH₂O | 14 cmH₂O |
| Set target volume / pressure cap | 420 mL / 35 cmH₂O | 420 mL / 35 cmH₂O | 420 mL metadata / 35 cmH₂O |
| Compliance | 34 mL/cmH₂O | 40 mL/cmH₂O | 40 mL/cmH₂O |
| Base resistance | 8 cmH₂O/(L/s) | 8 cmH₂O/(L/s) | 8 cmH₂O/(L/s) |
| Left compliance fraction | 0.45 | 0.45 | 0.45 |
| Dead space | 150 mL | 150 mL | 150 mL |
| Shunt fraction | 0.12 | 0.08 | 0.08 |
| Inspiratory muscle effort | 2 cmH₂O | 0 in arrest | 0 |
| CO₂ production | 200 mL/min | 180 mL/min | 200 mL/min |
| Cardiac reserve | 1 | 0.82 | 1 |
| Secretion burden | 0.8 | 0.08 | 0.08 |
| Haemoglobin | 13 g/dL | 13 g/dL | 13 g/dL |

All rooms begin with no leak, a connected circuit, compressions off, compression rate assumption 110/min, depth assumption 55 mm and recoil fraction 1. These are authored controls, not clinical settings. Neither diagnosis implies a universal physiology or determines an outcome.

## Initialization and intentional interface differences

The two ICU rooms settle the matching baseline for 120 model seconds, then advance the chosen acute change for 0.1 seconds. Maya’s baseline secretion burden is 0.08 before the authored 0.8 change. Kai’s baseline effort is 0.5 cmH₂O before the explicit arrest sets it to zero; baseline reserve and CO₂ production are already the stated values. The ETT/tracheostomy metadata does not automatically change resistance, so the ETT room’s explicit route label does not create a different warmup physiology.

The native Alex skills room starts directly in a fresh manual-bag/mask arrest state. It deliberately has no preloaded mandatory-breath count or invasive-ventilation trace history. The web lab currently uses the general 120-second supported baseline routine before its manual/mask room override. Consequently early gas states and completed-breath history differ in that room even though all authored settings and parameters match. In both versions those arrest gases are outside arterial-gas validity, no breaths occur automatically in manual mode, and neither initialization represents Alex’s real treatment history.

The native companion opens rooms from a lobby, assumes one assigned bedside nurse initially, and uses a compact role-readiness workflow. The web lab offers its fuller equipment/care stations and begins its role-assignment checklist unconfirmed. These are interface/workflow choices, not different physical models. They do not change source, ventilation, arrest or compression equations.

The shared `pulmonary.ts` bytes remain identical; `src/model/provenance.json` records the checksum. Review both this record and the native coordinator whenever upstream case inputs change. No web module is imported at runtime, so the mobile application remains independently installable and buildable.
