# Noah ICU Simulation Debrief — FormHug integration

## Current status

**Created and verified on 29 October 2026:** `Noah ICU Simulation Debrief` contains 12 fields and is owned by the authenticated creator. Verification reported zero entries, English (`en`), timezone `Australia/Sydney`, `manually_closed: true` and `show_form_before_open: false`. The form remains closed for owner review and does not accept responses.

The earlier reauthentication issue cleared during the current authenticated read and write checks. Creation and verification succeeded; this records a successful check at that time and does not guarantee that the connection will remain authenticated. The reproducible field definition in `formhug-debrief.json` has been validated against the live API schema and includes generic creation metadata. Form tokens, account identifiers and owner/edit URLs are omitted from this public package.

## Intended operation

Keep the existing form manually closed for review of fictional adult sessions. Do not create respondent submissions, enable notifications, open response collection, collect real patient identifiers or use clinical scoring. Review the existing form through the owner's authenticated FormHug interface before making further changes; do not create a duplicate merely because a later connection needs reauthentication.

The form supports ICU 01 (CP airway review), ICU 02 (DMD ETT arrest) and Skills 03 (generic adult BVM arrest). It asks about session context, mode and interface, ventilation versus oxygenation, bag ventilation and CPR, communication and agency, teamwork, reassessment, learning and access feedback.

## Application integration

The simulator has no automatic FormHug submission or session upload. Local reflection and exports remain separate from the external form. Owner review uses the authenticated FormHug interface; no private owner link is embedded in this public application package. The JSON definition remains available for local debrief preparation. Live response collection remains disabled and out of scope for this build.
