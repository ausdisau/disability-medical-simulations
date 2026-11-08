# RehabSense v0.5 — fictional training staging
An isolated Next.js application in the Disability Medical Simulations repository, with a separate Vercel project and root directory apps/rehabsense.
Run: npm install && npm run test && npm run build.
Fictional case only. The public dashboard has no persistence or external sharing. Do not enter real patient information. Discharge clearance and actual consent are never generated from checklists.
The /api/protected route refuses requests until an Auth0 AD.iD session and server-held tenant-specific role binding are configured.
Register an AD.iD Auth0 Regular Web Application. Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET, APP_BASE_URL and REHABSENSE_ROLE_BINDINGS in Vercel project secrets. No default user or self-selectable role. Real clinical storage, consent, auditing and NSW Health integration are not implemented.
