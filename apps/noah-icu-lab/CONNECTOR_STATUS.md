# Connector status · Noah ICU v0.4

Checked 29 October 2026.

## Healthcare Public Data

Used the PubMed connector for targeted searches, citation/identifier verification, rights checks and eligible complete PMC bodies. Sources inform teaching domains and limitations; no clinical dataset calibrates this synthetic engine. See `docs/healthcare-public-data-evidence.md`.

## Health

Personal Health records were not accessed. This is professional software work using fictional cases; no personal record import or real-patient monitoring is present.

## FormHug

The earlier reauthentication block cleared on the current authenticated read and write checks. `Noah ICU Simulation Debrief` was created and verified with 12 fields, creator ownership, zero entries, English (`en`) and timezone `Australia/Sydney`. It remains closed for owner review: `manually_closed: true` and `show_form_before_open: false`.

This records successful access on the check date, not a guarantee of persistent authentication. The public package contains the validated field definition and generic metadata in `docs/formhug-debrief.json`, with details in `docs/formhug-debrief.md`; it omits form tokens, account identifiers and owner/edit URLs. No patient identifiers are requested, no test respondent entries were created, and the simulator has no automatic FormHug submission or session upload.

## GitHub

The connected account's `ausdisau/disability-medical-simulations` repository was inspected. The addition is prepared as a standalone `apps/noah-icu-lab` contribution with its own build and tests. The final handoff records the actual branch and draft pull request after successful creation. Existing root simulations and persistence remain unchanged by this additive proposal.

## Running app

The simulator works entirely in the browser. Evidence links are ordinary external links. The connector calls above were authoring/research operations, not live clinical data feeds. The current app has no API credential, backend patient-data pipeline, or automatic external submission.

## Legacy shell

The source package retains its earlier Electron/Wiley implementation. It is separate from the new default lab and was not re-certified as a live feed or Windows installer in this release. Historical status is preserved in `docs/legacy-v0.2/CONNECTOR_STATUS.md`.
