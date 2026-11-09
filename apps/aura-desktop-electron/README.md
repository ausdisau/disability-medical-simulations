# Optional Electron fallback shell

The canonical AURA web app and its VIRGAL state reducer are under `../anzcor-react-web/`. This wrapper is **an alternative to Tauri, not a parallel second engine**. It loads only the already-built static app and exposes no filesystem, external network, clinical or hardware commands.

```sh
cd apps/anzcor-react-web
npm install && npm test && npm run build
cd ../aura-desktop-electron
npm install && npm start
```

The Electron version, CSP, packaging, OS permissions and links to external research are **not yet signed off**. External navigation is disabled in the shell by design. The app has no installer, device SDK, remote clinician authority, or persistence. Browser build is independently CI-verified; desktop runtime/build is **not** verified.

Prefer Tauri for a reviewed, lower-privilege packaged desktop after OS testing, but keep this Electron adapter for comparison and compatibility.
