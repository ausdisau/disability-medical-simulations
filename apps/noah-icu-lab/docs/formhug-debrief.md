# Noah ICU Simulation Debrief — FormHug integration

## Current status

A 12-field reproducible design is saved in `formhug-debrief.json`. No remote form has been created and no form token or verified URL is available. The initial mandatory `formhug://guide` read stalled and was aborted. A single retry returned: **“This app connection requires reauthentication. Reconnect the app and try again.”** No creation request was submitted. Reconnect FormHug before reading its guide and creating the unpublished draft. The schema is a portable design and has not yet been validated against the live FormHug field reference.

## Intended operation

Create one unpublished, manually closed draft for fictional adult sessions. Do not create respondent submissions, enable notifications, publish the form, collect real patient identifiers or use clinical scoring. Preserve any returned token and inspect the existing form before retrying a mutation.

The form supports ICU 01 (CP airway review), ICU 02 (DMD ETT arrest) and Skills 03 (generic adult BVM arrest). It asks about session context, mode and interface, ventilation versus oxygenation, bag ventilation and CPR, communication and agency, teamwork, reassessment, learning and access feedback.

## Application integration

The application may expose a draft-review link only after FormHug returns an authenticated edit or preview URL. Until then, do not render an invented link or advertise a connected form. The JSON design can be used for local debrief preparation. Live response collection remains out of scope for this build.
