# Accessible Futures repository reconciliation

## Decision

`ausdisau/disability-medical-simulations` remains the canonical repository. The existing root static simulation is preserved during migration for service continuity.

The private `ausdisau/disasim` repository is treated as a legacy snapshot. Its scenario and UI patterns are already represented or superseded in the canonical repository; nothing is copied back unless a later comparison identifies unique required behaviour.

## Added in this branch

- `apps/simlab` — Accessible Futures Clinical Simulation Lab Next.js prototype.
- `apps/policy-repository` — Disability Policy Repository Next.js scaffold.
- Four disability-inclusive sandbox scenarios: AF-001 through AF-004.

## Safety boundary

This branch adds educational software only. It does not provide live clinical decision support, competency certification, medication dosing, device control or restrictive-practice recommendations. Scenario publication still requires clinical and lived-experience review.

## Cutover strategy

1. Keep the existing root deployment unchanged.
2. Deploy both new apps as separate Vercel previews.
3. Review accessibility, scenario behaviour and deployment logs.
4. Merge only after review.
5. Retire the legacy `disasim` deployment only after functional parity and explicit production approval.
