# Connector status · Noah ICU v0.4

Checked 29 October 2026.

## Healthcare Public Data

Used the PubMed connector for targeted searches, citation/identifier verification, rights checks and eligible complete PMC bodies. Sources inform teaching domains and limitations; no clinical dataset calibrates this synthetic engine. See `docs/healthcare-public-data-evidence.md`.

## Health

Personal Health records were not accessed. This is professional software work using fictional cases; no personal record import or real-patient monitoring is present.

## FormHug

A structured fictional simulation debrief definition is prepared separately. The mandatory FormHug guide call returned: "This app connection requires reauthentication. Reconnect the app and try again." No live form was created and no shareable form URL is claimed. See `docs/formhug-debrief.md` and its JSON schema. No patient identifiers are requested, no test respondent entries are created, and there is no automatic session upload.

## GitHub

The connected account's `ausdisau/disability-medical-simulations` repository was inspected. The addition is prepared as a standalone `apps/noah-icu-lab` contribution with its own build and tests. The final handoff records the actual branch and draft pull request after successful creation. Existing root simulations and persistence remain unchanged by this additive proposal.

## Running app

The simulator works entirely in the browser. Evidence links are ordinary external links. The connector calls above were authoring/research operations, not live clinical data feeds. The current app has no API credential, backend patient-data pipeline, or automatic external submission.

## Legacy shell

The source package retains its earlier Electron/Wiley implementation. It is separate from the new default lab and was not re-certified as a live feed or Windows installer in this release. Historical status is preserved in `docs/legacy-v0.2/CONNECTOR_STATUS.md`.
