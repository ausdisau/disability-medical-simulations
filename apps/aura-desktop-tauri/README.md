# AURA desktop via Tauri 2 — staging scaffold

Wraps the existing **React/Vite AURA cockpit**. No second Vue physiology engine or duplicate clinical truth is introduced. This is an optional desktop target using the same built static assets; the Tauri frontend has **no network, filesystem, device, IPC or shell plugin capabilities**.

## Preparation

1. Install current supported Rust toolchain, Tauri OS prerequisites, Node and npm, and `@tauri-apps/cli` as a development tool in this package.
2. `cd apps/anzcor-react-web && npm install && npm test && npm run build`.
3. `cd apps/aura-desktop-tauri && npm install && npm run tauri:dev` to test locally.

The desktop manifest intentionally leaves installer bundling OFF. A signing, icon, dependency-lockfile and platform security review is required before an installation package is enabled. Current CI only tests the browser app and static desktop-config syntax, not Rust native binaries or OS-level accessibility.

The app remains **simulation-only** and does not access real patient data, devices or administer treatment.
