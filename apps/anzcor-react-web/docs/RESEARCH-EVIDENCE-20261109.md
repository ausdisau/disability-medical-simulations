# AURA evidence registry · 9 November 2026

## Status and provenance

The saved PubMed RSS URL supplied by the user was registered exactly in `src/evidence.mjs`, but direct retrieval failed. Its underlying search expression and item list are **UNKNOWN**. `FETCH_UNVERIFIED` is intentional. The curated sources here were obtained through **independent, topic-specific PubMed searches** and publicly accessible JSTOR item metadata, not from the inaccessible RSS feed.

**PubMed topic queries (examples)**

- `("cerebral palsy" OR "complex communication needs") AND ("augmentative and alternative communication" OR "communication access") AND (healthcare OR hospital)`
- `("cerebral palsy" AND ("respiratory management" OR "respiratory disease" OR "dysphagia"))`
- `("diagnostic overshadowing" AND disability) OR ("communication disorders" AND "simulation" AND medication)`
- 2026 specific follow-up PMIDs: `41649064`, `41814483`, `42811635`, `42026895`, `41950287`

**JSTOR public-source candidate set**

- https://www.jstor.org/stable/48722142 — safe medication administration, communication disorders, simulation enhanced interprofessional education. **METADATA_ONLY; full text NOT inspected.**
- https://www.jstor.org/stable/10.5325/j.ctv2f4v614.6 — autonomy and speech, graphic ethics casebook. **METADATA_ONLY; chapter NOT inspected.**
- https://www.jstor.org/stable/j.ctv15d8195 — Encountering Pain, open access book description, no chapter-level review. **METADATA_ONLY.**

Each source retains an explicit title, year, identifier, inspected-evidence label, supported claim limited to accessible evidence, simulation implication, limitations, and topic domain.

## Clinical and human-rights translation

- **Clinical evidence:** recognise risks and uncertainty, always individualise the baseline. Do not transfer long-term CP respiratory support findings to the separate Rohan DMD arrest branch.
- **Baseline and access:** preserve speech, switch/eye-gaze setups, communication partner support, device positioning, and meaningful response time. Treat silence as unknown, not refusal or consent.
- **Ethics and systems:** diagnostic overshadowing should be a remediable failure mode. Family support and supported decision making are not substitute legal authority.
- **Educational evidence:** co-designed simulated patients and accessibility-first virtual rehearsal warrant study and paid lived-experience review; do not overclaim generalizability or clinical benefit.

## Immutable authority boundary

Research records are NEVER executable clinical rules. `canChangeVIRGALPhysiology` and `canAuthoriseClinicalIntervention` both return `false`. The promotion pathway is separate and must include qualified clinical + paid disability-lived-experience review, a controlling local NSW protocol where applicable, and versioned scenario and regression checks.

PubMed abstract review and JSTOR metadata review are not evidence of full-text inspection or automatically approved clinical recommendations.

## Related scenarios

`content/scenarios/cerebral-palsy-respiratory-aac-v01.json` is a distinct fictional adult respiratory/AAC training case; it **does not overwrite** or identify Rohan Malik. Its medication and procedure workflows are held until separately verified.
