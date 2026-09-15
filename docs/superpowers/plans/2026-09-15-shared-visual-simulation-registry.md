# Shared Visual Simulation Registry v0.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable, accessible, evidence-gated visual/equipment interaction runtime that works across Maya, Rohan, Eli and future Project Hope scenarios without allowing images or UI hotspots to create clinical truth, consent, authority or physiology.

**Architecture:** Add a language-neutral JSON visual registry and scenario manifest on top of the VIRGAL v0.4 Character-World runtime. Visual interactions are normalized into proposals, checked against deterministic evidence/rights/guardian gates, then committed through the existing VIRGAL event path. The current web app is the first renderer; React Native and Hugging Face/local-model integrations remain thin optional adapters after the web contract is stable.

**Tech Stack:** Node.js >=20, ES modules, browser-compatible JavaScript, Node built-in test runner, existing VIRGAL v0.4 runtime, static HTML/CSS, optional Neon persistence, Vercel Preview deployments. TypeScript/Zod is reserved for a later authoring package and is not a prerequisite for this runtime slice.

**Spec:** `docs/superpowers/specs/2026-09-15-shared-visual-simulation-registry-design.md`

## Global Constraints

- Base implementation branch must start from `feat/virgal-character-world-v04` at or after commit `5ae9d0f2d76b9cd879c7c24cbdb55561063d91b4` unless PR #18 has already merged; if merged, start from the resulting `main` head instead.
- Do not modify the canonical VIRGAL event hash-chain semantics.
- `VISIBLE != INDICATED != AUTHORISED != COMMITTED` is a release-blocking invariant.
- No visual asset, hotspot, model output or UI state may directly write physiology, diagnosis, medication/device settings, consent/refusal, capacity, substitute authority, treatment ceilings or patient-authored speech.
- AAC failure maps to reduced information reliability, never automatic incapacity.
- Support-worker/family presence maps to support availability, never automatic substitute authority.
- Communication composition continues clinical/world time while learner-evaluation time pauses, preserving the existing runtime semantics.
- Every critical visual interaction must also have a semantic non-pointer route.
- No critical state may depend only on colour, pitch, motion or image recognition.
- Missing image bytes must degrade to an accessible semantic interaction rather than break the scenario.
- Documentary/generated visuals remain context, never proof of clinical indication.
- Production promotion remains outside this implementation plan; implementation stops at verified Vercel Preview plus review-ready pull request.

---

## File Structure

Create focused modules under `src/visual-runtime/` rather than expanding `src/runtime.js` or `src/features/ui.js` into large mixed-responsibility files.

```text
src/
  visual-runtime/
    registry.js              # validates/normalizes visual assets and hotspots
    manifests.js             # scenario visual manifests and lookup helpers
    evidence.js              # pure evidence-expression evaluator
    actions.js               # builds/evaluates visual action proposals
    reducer.js               # derives visual presentation state from committed events
    accessibility.js         # semantic announcements and hotspot traversal order
  data/
    visual-assets.js         # v0.1 visual registry records + provenance
    visual-manifests.js      # Maya/Rohan initial scene manifests
  features/
    visual-ui.js             # DOM renderer/events for scene image, hotspots, drawer
    ui.js                    # delegates visual rendering/action handling
  runtime.js                 # integrates visual state into runtime and commits events
  scenarios.js               # scenario-level visual scene IDs only
assets/
  visual-registry/
    maya-ed-arrival.png
    maya-icu-respiratory-support.png
    paediatric-retrieval-prep.png
    oxygen-interface-13.png
    equipment-inventory-40.png
tests/
  visual-registry.test.mjs
  visual-actions.test.mjs
  visual-accessibility.test.mjs
  visual-integration.test.mjs
  runtime.test.mjs           # existing tests retained + targeted regression cases
```

`src/data/visual-assets.js` contains metadata and relative asset paths only. Clinical/runtime state remains elsewhere.

---

### Task 1: Establish the visual registry and validation contract

**Files:**
- Create: `src/visual-runtime/registry.js`
- Create: `src/data/visual-assets.js`
- Create: `tests/visual-registry.test.mjs`

**Interfaces:**
- Produces: `VISUAL_ASSET_TYPES`, `VISUAL_INTERACTION_MODES`, `normalizeVisualAsset(input)`, `normalizeVisualHotspot(input)`, `buildVisualRegistry({ assets, hotspots })`, `getVisualAsset(registry, assetId)`, `getVisualHotspots(registry, assetId)`.
- Consumes: no runtime mutation APIs.

- [ ] **Step 1: Write failing registry validation tests**

Create `tests/visual-registry.test.mjs` with these assertions:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildVisualRegistry,
  normalizeVisualAsset,
  normalizeVisualHotspot
} from "../src/visual-runtime/registry.js";

test("visual asset requires accessible text and explicit safety invariants", () => {
  assert.throws(() => normalizeVisualAsset({
    id: "oxygen-interface-13",
    title: "Oxygen interface",
    assetType: "equipment_detail",
    source: {
      kind: "bundled",
      path: "./assets/visual-registry/oxygen-interface-13.png",
      provenanceRef: "project-hope:oxygen-interface-13",
      fictionalDepiction: true
    },
    sceneIds: ["ed-arrival"],
    hotspotIds: [],
    interactionModes: ["inspect"],
    visibleWhen: [],
    altText: "",
    sortOrder: 10,
    safety: {
      canCreateClinicalFact: false,
      canCreateConsent: false,
      canCreateAuthority: false,
      canMutatePhysiology: false
    }
  }), /altText/i);
});

test("visual hotspot uses percentage geometry and stable tab order", () => {
  const hotspot = normalizeVisualHotspot({
    id: "hotspot-oxygen-13",
    visualAssetId: "maya-ed-arrival",
    equipmentId: "13",
    label: "Oxygen interface",
    geometry: { x: 68, y: 42, width: 17, height: 25, units: "percent" },
    tabOrder: 3,
    interaction: "inspect",
    visibleWhen: [],
    enabledWhen: [],
    disabledReason: "Inspect current evidence before use.",
    altText: "Oxygen interface beside the resuscitation trolley."
  });
  assert.equal(hotspot.geometry.units, "percent");
  assert.equal(hotspot.tabOrder, 3);
});

test("registry rejects a visual asset that claims authority or physiology mutation", () => {
  assert.throws(() => buildVisualRegistry({
    assets: [{
      id: "unsafe",
      title: "Unsafe",
      assetType: "overlay",
      source: { kind: "bundled", path: "unsafe.png", provenanceRef: "test", fictionalDepiction: true },
      sceneIds: ["scene"],
      hotspotIds: [],
      interactionModes: ["inspect"],
      visibleWhen: [],
      altText: "Unsafe test visual asset.",
      sortOrder: 0,
      safety: {
        canCreateClinicalFact: true,
        canCreateConsent: false,
        canCreateAuthority: false,
        canMutatePhysiology: false
      }
    }],
    hotspots: []
  }), /clinical fact/i);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/visual-registry.test.mjs
```

Expected: FAIL because `src/visual-runtime/registry.js` does not exist.

- [ ] **Step 3: Implement the minimal registry module**

Implement constant sets and explicit validation. Do not add a validation dependency in this slice.

```js
export const VISUAL_ASSET_TYPES = new Set([
  "scene",
  "equipment_detail",
  "inventory_card",
  "monitor_view",
  "communication_view",
  "overlay"
]);

export const VISUAL_INTERACTION_MODES = new Set([
  "inspect",
  "select",
  "assign",
  "request_commit"
]);

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

export function normalizeVisualAsset(input) {
  const asset = structuredClone(input);
  asset.id = requiredString(asset.id, "id");
  asset.title = requiredString(asset.title, "title");
  asset.altText = requiredString(asset.altText, "altText");
  if (!VISUAL_ASSET_TYPES.has(asset.assetType)) throw new TypeError("unknown assetType");
  if (!Array.isArray(asset.interactionModes) || asset.interactionModes.some((mode) => !VISUAL_INTERACTION_MODES.has(mode))) {
    throw new TypeError("invalid interactionModes");
  }
  const safety = asset.safety ?? {};
  if (safety.canCreateClinicalFact !== false) throw new TypeError("visual asset cannot create clinical fact");
  if (safety.canCreateConsent !== false) throw new TypeError("visual asset cannot create consent");
  if (safety.canCreateAuthority !== false) throw new TypeError("visual asset cannot create authority");
  if (safety.canMutatePhysiology !== false) throw new TypeError("visual asset cannot mutate physiology");
  return Object.freeze(asset);
}

export function normalizeVisualHotspot(input) {
  const hotspot = structuredClone(input);
  hotspot.id = requiredString(hotspot.id, "id");
  hotspot.visualAssetId = requiredString(hotspot.visualAssetId, "visualAssetId");
  hotspot.label = requiredString(hotspot.label, "label");
  hotspot.altText = requiredString(hotspot.altText, "altText");
  if (hotspot.geometry?.units !== "percent") throw new TypeError("hotspot geometry must use percent units");
  for (const key of ["x", "y", "width", "height"]) {
    const value = hotspot.geometry?.[key];
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new TypeError(`invalid hotspot geometry ${key}`);
  }
  if (!Number.isInteger(hotspot.tabOrder) || hotspot.tabOrder < 0) throw new TypeError("tabOrder must be a non-negative integer");
  if (!VISUAL_INTERACTION_MODES.has(hotspot.interaction)) throw new TypeError("invalid hotspot interaction");
  return Object.freeze(hotspot);
}

export function buildVisualRegistry({ assets, hotspots }) {
  const normalizedAssets = assets.map(normalizeVisualAsset);
  const normalizedHotspots = hotspots.map(normalizeVisualHotspot);
  const assetById = Object.fromEntries(normalizedAssets.map((asset) => [asset.id, asset]));
  for (const hotspot of normalizedHotspots) {
    if (!assetById[hotspot.visualAssetId]) throw new TypeError(`unknown visualAssetId ${hotspot.visualAssetId}`);
  }
  return Object.freeze({
    assets: normalizedAssets,
    hotspots: normalizedHotspots,
    assetById: Object.freeze(assetById)
  });
}

export function getVisualAsset(registry, assetId) {
  return registry.assetById[assetId] ?? null;
}

export function getVisualHotspots(registry, assetId) {
  return registry.hotspots
    .filter((hotspot) => hotspot.visualAssetId === assetId)
    .sort((a, b) => a.tabOrder - b.tabOrder || a.id.localeCompare(b.id));
}
```

- [ ] **Step 4: Add v0.1 asset metadata records**

Create `src/data/visual-assets.js` exporting `visualAssets` and `visualHotspots` for these exact asset IDs:

```text
maya-ed-arrival
maya-icu-respiratory-support
paediatric-retrieval-prep
oxygen-interface-13
equipment-inventory-40
```

All records must use `fictionalDepiction: true`, explicit provenance refs, bundled relative asset paths, meaningful alt text, and all safety booleans set to `false`.

Add at least these hotspots to `maya-ed-arrival`:

```text
hotspot-maya-aac       -> communication / inspect
hotspot-monitor         -> monitoring / inspect
hotspot-oxygen-13       -> breathing / inspect
hotspot-support-worker  -> communication / inspect
```

Keep geometry explicitly reviewable in code; do not auto-detect it with a vision model.

- [ ] **Step 5: Run focused and full tests**

Run:

```bash
node --test tests/visual-registry.test.mjs
npm test
```

Expected: all existing and new tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/visual-runtime/registry.js src/data/visual-assets.js tests/visual-registry.test.mjs
git commit -m "feat: add shared visual registry contract"
```

---

### Task 2: Add scenario manifests and pure evidence evaluation

**Files:**
- Create: `src/visual-runtime/evidence.js`
- Create: `src/visual-runtime/manifests.js`
- Create: `src/data/visual-manifests.js`
- Modify: `src/scenarios.js`
- Extend: `tests/visual-registry.test.mjs`

**Interfaces:**
- Consumes: `buildVisualRegistry()` output from Task 1.
- Produces: `evaluateEvidenceExpression(expression, context)`, `evaluateEvidenceList(expressions, context)`, `getScenarioVisualManifest(scenarioId)`, `getSceneVisuals(manifest, sceneId)`.

- [ ] **Step 1: Write failing manifest/evidence tests**

Add:

```js
import {
  evaluateEvidenceExpression,
  evaluateEvidenceList
} from "../src/visual-runtime/evidence.js";
import { getScenarioVisualManifest } from "../src/visual-runtime/manifests.js";

test("evidence expressions read state but never create missing facts", () => {
  const context = { controller: { hypoxaemiaEstablished: true } };
  const result = evaluateEvidenceExpression({
    fact: "hypoxaemiaEstablished",
    operator: "eq",
    value: true,
    source: "controller"
  }, context);
  assert.deepEqual(result, { satisfied: true, resolved: true });
  assert.equal(context.controller.hypoxaemiaEstablished, true);
});

test("missing evidence remains unresolved rather than false clinical truth", () => {
  const result = evaluateEvidenceList([{
    fact: "currentAirwayObstruction",
    operator: "eq",
    value: false,
    source: "controller"
  }], { controller: {} });
  assert.equal(result.resolved, false);
  assert.deepEqual(result.missing, ["controller.currentAirwayObstruction"]);
});

test("adult suction manifest opens with Maya ED visual", () => {
  const manifest = getScenarioVisualManifest("adult-suction");
  assert.equal(manifest.scenes[0].primaryVisualAssetId, "maya-ed-arrival");
  assert.ok(manifest.scenes[0].enabledVisualAssetIds.includes("oxygen-interface-13"));
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
node --test tests/visual-registry.test.mjs
```

Expected: FAIL because evidence/manifest modules are missing.

- [ ] **Step 3: Implement evidence evaluator**

`src/visual-runtime/evidence.js` must only read supplied context:

```js
const SOURCES = new Set(["controller", "scenario", "world", "access", "guardian"]);

export function evaluateEvidenceExpression(expression, context) {
  if (!SOURCES.has(expression.source)) throw new TypeError("unknown evidence source");
  const sourceState = context?.[expression.source] ?? {};
  if (!Object.prototype.hasOwnProperty.call(sourceState, expression.fact)) {
    return { satisfied: false, resolved: false };
  }
  const actual = sourceState[expression.fact];
  const satisfied = expression.operator === "eq"
    ? actual === expression.value
    : expression.operator === "neq"
      ? actual !== expression.value
      : expression.operator === "includes"
        ? Array.isArray(actual) && actual.includes(expression.value)
        : expression.operator === "exists"
          ? actual !== undefined && actual !== null
          : (() => { throw new TypeError("unknown evidence operator"); })();
  return { satisfied, resolved: true };
}

export function evaluateEvidenceList(expressions, context) {
  const results = expressions.map((expression) => ({
    expression,
    result: evaluateEvidenceExpression(expression, context)
  }));
  return {
    open: results.every(({ result }) => result.resolved && result.satisfied),
    resolved: results.every(({ result }) => result.resolved),
    satisfied: results.filter(({ result }) => result.satisfied).map(({ expression }) => `${expression.source}.${expression.fact}`),
    missing: results.filter(({ result }) => !result.resolved).map(({ expression }) => `${expression.source}.${expression.fact}`),
    unsatisfied: results.filter(({ result }) => result.resolved && !result.satisfied).map(({ expression }) => `${expression.source}.${expression.fact}`)
  };
}
```

- [ ] **Step 4: Implement manifests**

Create `src/data/visual-manifests.js` with manifests for `adult-suction` and `rohan-alarm`. Keep scene IDs explicit:

```text
adult-suction -> ed-arrival
rohan-alarm   -> picu-alarm
```

Create `src/visual-runtime/manifests.js` that validates manifest version `0.1`, unique scene IDs and referenced asset IDs.

Add `visualSceneId` to the two scenario records in `src/scenarios.js`; do not move clinical state into the manifest.

- [ ] **Step 5: Run tests and commit**

Run:

```bash
node --test tests/visual-registry.test.mjs
npm test
```

Then:

```bash
git add src/visual-runtime/evidence.js src/visual-runtime/manifests.js src/data/visual-manifests.js src/scenarios.js tests/visual-registry.test.mjs
git commit -m "feat: add scenario visual manifests and evidence gates"
```

---

### Task 3: Build auditable visual action proposals and deterministic decisions

**Files:**
- Create: `src/visual-runtime/actions.js`
- Create: `tests/visual-actions.test.mjs`

**Interfaces:**
- Consumes: `evaluateEvidenceList()`, current VIRGAL `headEventHash`, current equipment state.
- Produces: `buildVisualActionProposal(input)`, `evaluateVisualAction({ proposal, currentHeadEventHash, asset, hotspot, equipmentState, evidenceContext, rightsResult, guardianResult })`.

- [ ] **Step 1: Write failing action tests**

Create tests proving:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildVisualActionProposal,
  evaluateVisualAction
} from "../src/visual-runtime/actions.js";

test("inspect is allowed without mutating equipment state", () => {
  const proposal = buildVisualActionProposal({
    actionId: "a1",
    scenarioId: "adult-suction",
    sceneId: "ed-arrival",
    actorId: "learner",
    visualAssetId: "oxygen-interface-13",
    equipmentId: "13",
    action: "inspect",
    basedOnHeadEventHash: "head-1",
    requestedAtWorldTime: 12
  });
  const decision = evaluateVisualAction({
    proposal,
    currentHeadEventHash: "head-1",
    asset: { visibleWhen: [] },
    hotspot: null,
    equipmentState: "available",
    evidenceContext: {},
    rightsResult: { decision: "CONTINUE", hardStopCodes: [] },
    guardianResult: { decision: "CONTINUE" }
  });
  assert.equal(decision.status, "allowed");
  assert.equal(decision.eventProposal.type, "VISUAL_ASSET_INSPECTED");
  assert.equal(equipmentStateIsUnchanged(decision), true);
});

function equipmentStateIsUnchanged(decision) {
  return !Object.hasOwn(decision.eventProposal.payload, "nextEquipmentState");
}

test("stale proposal is rejected before evidence or guardian evaluation", () => {
  const proposal = buildVisualActionProposal({
    actionId: "a2",
    scenarioId: "adult-suction",
    sceneId: "ed-arrival",
    actorId: "learner",
    visualAssetId: "oxygen-interface-13",
    action: "request_commit",
    basedOnHeadEventHash: "old-head",
    requestedAtWorldTime: 12
  });
  const decision = evaluateVisualAction({
    proposal,
    currentHeadEventHash: "new-head",
    asset: { visibleWhen: [] },
    hotspot: null,
    equipmentState: "assigned",
    evidenceContext: {},
    rightsResult: { decision: "CONTINUE", hardStopCodes: [] },
    guardianResult: { decision: "CONTINUE" }
  });
  assert.equal(decision.status, "stale");
});

test("closed evidence gate holds only commit request", () => {
  const proposal = buildVisualActionProposal({
    actionId: "a3",
    scenarioId: "adult-suction",
    sceneId: "ed-arrival",
    actorId: "learner",
    visualAssetId: "oxygen-interface-13",
    equipmentId: "13",
    action: "request_commit",
    basedOnHeadEventHash: "head-1",
    requestedAtWorldTime: 12
  });
  const decision = evaluateVisualAction({
    proposal,
    currentHeadEventHash: "head-1",
    asset: { visibleWhen: [] },
    hotspot: {
      enabledWhen: [{ fact: "compatibilityVerified", operator: "eq", value: true, source: "scenario" }]
    },
    equipmentState: "assigned",
    evidenceContext: { scenario: { compatibilityVerified: false } },
    rightsResult: { decision: "CONTINUE", hardStopCodes: [] },
    guardianResult: { decision: "CONTINUE" }
  });
  assert.equal(decision.status, "held");
  assert.match(decision.feedback, /evidence/i);
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
node --test tests/visual-actions.test.mjs
```

- [ ] **Step 3: Implement action evaluation**

Enforce order:

```text
1. validate proposal
2. stale-head check
3. visibility/evidence check
4. rights hard-stop check
5. clinical/guardian hold check
6. map action to event proposal
```

Required event mapping:

```js
const EVENT_BY_ACTION = {
  inspect: "VISUAL_ASSET_INSPECTED",
  select: "EQUIPMENT_SELECTED",
  assign: "WORKSTREAM_ASSIGNED",
  request_commit: "EQUIPMENT_COMMIT_REQUESTED"
};
```

Do not emit `EQUIPMENT_COMMITTED` from this module. Actual commit remains a later runtime/controller action.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/visual-actions.test.mjs
npm test
git add src/visual-runtime/actions.js tests/visual-actions.test.mjs
git commit -m "feat: add evidence-gated visual action proposals"
```

---

### Task 4: Add visual state projection to the runtime without bypassing VIRGAL

**Files:**
- Create: `src/visual-runtime/reducer.js`
- Modify: `src/runtime.js`
- Create: `tests/visual-integration.test.mjs`
- Extend: `tests/runtime.test.mjs`

**Interfaces:**
- Consumes: committed VIRGAL events.
- Produces: `createVisualState(manifest)`, `applyVisualEvent(visualState, event)`, `proposeVisualAction(state, input)`, `commitVisualAction(state, decision)`.

- [ ] **Step 1: Write failing integration tests**

Required assertions:

```js
test("runtime includes visual state but current station states remain authoritative", () => {
  const state = createRuntime("adult-suction");
  assert.equal(state.visual.sceneId, "ed-arrival");
  assert.equal(state.stations["13"], "available");
});

test("inspecting an oxygen image commits an audit event and does not advance equipment", () => {
  const state = createRuntime("adult-suction");
  const decision = proposeVisualAction(state, {
    actionId: "inspect-13",
    actorId: "learner",
    visualAssetId: "oxygen-interface-13",
    equipmentId: "13",
    action: "inspect"
  });
  const next = commitVisualAction(state, decision);
  assert.equal(next.stations["13"], "available");
  assert.equal(next.events[0].type, "VISUAL_ASSET_INSPECTED");
});

test("request commit never bypasses equipment/evidence progression", () => {
  const state = createRuntime("adult-suction");
  const decision = proposeVisualAction(state, {
    actionId: "commit-too-soon",
    actorId: "learner",
    visualAssetId: "oxygen-interface-13",
    equipmentId: "13",
    action: "request_commit"
  });
  assert.notEqual(decision.status, "allowed");
  assert.equal(state.stations["13"], "available");
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
node --test tests/visual-integration.test.mjs tests/runtime.test.mjs
```

- [ ] **Step 3: Add equipment IDs 13 and 40 without breaking existing stations**

Extend `stationDefinitions` in `src/scenarios.js` with:

```js
{ id: "13", label: "Oxygen interface", kind: "breathing", purpose: "Supports the oxygen workstream when clinically required; does not establish airway patency or effective ventilation." },
{ id: "40", label: "Equipment inventory", kind: "utility", purpose: "Checks readiness, compatibility and unresolved equipment requirements before transfer or escalation." }
```

If current rendering does not style `utility`, leave default station styling rather than creating colour-only meaning.

- [ ] **Step 4: Implement visual state reducer and runtime adapters**

`createRuntime(scenarioId)` gains:

```js
visual: createVisualState(getScenarioVisualManifest(scenarioId))
```

`commitVisualAction()` must call existing `appendEvent()` so every action enters the VIRGAL ledger and receives event hash/provenance.

Do not duplicate the hash-chain logic inside `reducer.js`.

- [ ] **Step 5: Preserve current AAC timing tests**

Run:

```bash
npm test
```

Explicitly verify the existing AAC test still proves clinical/world time advances and evaluation time pauses.

- [ ] **Step 6: Commit**

```bash
git add src/visual-runtime/reducer.js src/runtime.js src/scenarios.js tests/visual-integration.test.mjs tests/runtime.test.mjs
git commit -m "feat: integrate visual events with VIRGAL runtime"
```

---

### Task 5: Add the patient-autonomy/rights adapter and branch-scoped holds

**Files:**
- Create: `src/visual-runtime/rights.js`
- Extend: `src/visual-runtime/actions.js`
- Extend: `tests/visual-actions.test.mjs`

**Interfaces:**
- Produces: `buildRightsEnvelope({ state, proposal, asset, hotspot })`, `normalizeRightsGate(result)`.
- Runtime contract must accept injected rights results so tests stay deterministic and browser runtime does not pretend to execute jurisdictional law autonomously.

- [ ] **Step 1: Write failing rights tests**

Add tests for these exact invariants:

```js
test("AAC unavailable does not create incapacity", () => {
  const envelope = buildRightsEnvelope({
    state: { access: { aacAvailable: false }, rights: { capacityStatus: "presumed" } },
    proposal: { action: "inspect", actorId: "learner" },
    asset: { id: "maya-aac-view" },
    hotspot: null
  });
  assert.equal(envelope.forbiddenInferences.includes("AAC_FAILURE->INCAPACITY"), true);
  assert.equal(envelope.capacityStatus, "presumed");
});

test("supporter presence cannot create substitute authority", () => {
  const gate = normalizeRightsGate({
    RIGHTS_STATUS: "protected",
    STOP_OR_CONTINUE_DECISION: { decision: "CONTINUE", hard_stop_codes: [], basis: "", resume_when: [] }
  });
  assert.equal(gate.decision, "CONTINUE");
  assert.deepEqual(gate.hardStopCodes, []);
});

test("rights hard stop holds the affected visual action", () => {
  const decision = evaluateVisualAction({
    proposal: validTouchSensitiveProposal,
    currentHeadEventHash: validTouchSensitiveProposal.basedOnHeadEventHash,
    asset: { visibleWhen: [] },
    hotspot: { enabledWhen: [] },
    equipmentState: "checked",
    evidenceContext: {},
    rightsResult: { decision: "STOP", hardStopCodes: ["HS1_CONSENT_ASSUMED"] },
    guardianResult: { decision: "CONTINUE" }
  });
  assert.equal(decision.status, "held");
  assert.deepEqual(decision.guardianRefs, ["rights:HS1_CONSENT_ASSUMED"]);
});
```

Define `validTouchSensitiveProposal` in the test as a normal request-commit proposal over a patient-controlled device/equipment hotspot; do not create a clinical procedure in the test.

- [ ] **Step 2: Verify RED**

```bash
node --test tests/visual-actions.test.mjs
```

- [ ] **Step 3: Implement rights adapter**

`buildRightsEnvelope()` must include:

```text
jurisdiction
careSetting
proposedAction
communicationAccess
capacityStatus
supporterPresent
verifiedSubstitute
emergencyBasis
patientControlledObject
forbiddenInferences
```

`forbiddenInferences` must include:

```text
AAC_FAILURE->INCAPACITY
FAMILY_PRESENT->SUBSTITUTE_AUTHORITY
EQUIPMENT_AVAILABLE->CLINICALLY_INDICATED
```

The adapter does not invent a legal conclusion. Missing jurisdiction-specific facts remain unresolved upstream.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/visual-actions.test.mjs
npm test
git add src/visual-runtime/rights.js src/visual-runtime/actions.js tests/visual-actions.test.mjs
git commit -m "feat: add rights-aware visual action gate"
```

---

### Task 6: Add accessible semantic navigation and announcements

**Files:**
- Create: `src/visual-runtime/accessibility.js`
- Create: `tests/visual-accessibility.test.mjs`

**Interfaces:**
- Produces: `buildHotspotTraversal(registry, assetId)`, `describeVisualAssetState({ asset, hotspot, equipmentState, evidenceDecision })`, `buildAccessibleFallback({ asset, hotspots })`.

- [ ] **Step 1: Write failing accessibility tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHotspotTraversal,
  describeVisualAssetState
} from "../src/visual-runtime/accessibility.js";

test("hotspot traversal follows tabOrder rather than screen coordinates", () => {
  const order = buildHotspotTraversal(registryFixture, "maya-ed-arrival");
  assert.deepEqual(order.map((item) => item.id), [
    "hotspot-maya-aac",
    "hotspot-monitor",
    "hotspot-oxygen-13",
    "hotspot-support-worker"
  ]);
});

test("state description does not rely on colour", () => {
  const text = describeVisualAssetState({
    asset: registryFixture.assetById["oxygen-interface-13"],
    hotspot: null,
    equipmentState: "relevant",
    evidenceDecision: { evidenceGate: { status: "closed", missing: ["scenario.compatibilityVerified"] } }
  });
  assert.match(text, /Oxygen interface/);
  assert.match(text, /relevant/i);
  assert.match(text, /compatibility/i);
});
```

- [ ] **Step 2: Verify RED and implement minimal semantic helpers**

Run RED first, then implement pure string/list helpers only. Do not access the DOM in this module.

- [ ] **Step 3: Add missing-image fallback contract test**

Assert that `buildAccessibleFallback()` produces semantic buttons/labels from registry metadata when no image loads.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/visual-accessibility.test.mjs
npm test
git add src/visual-runtime/accessibility.js tests/visual-accessibility.test.mjs
git commit -m "feat: add accessible visual navigation contract"
```

---

### Task 7: Build the accessible web visual renderer

**Files:**
- Create: `src/features/visual-ui.js`
- Modify: `src/features/ui.js`
- Modify: `index.html`
- Modify: `styles.css`
- Extend: `tests/visual-accessibility.test.mjs` with DOM-independent markup contract tests where practical.

**Interfaces:**
- Consumes: registry, manifest, runtime action adapters, accessibility helpers.
- Produces: `createVisualRenderer({ root, liveRegion, onAction })`, with methods `render({ state, scenario })`, `destroy()`.

- [ ] **Step 1: Add the semantic DOM shell**

Replace the existing single static scene image figure with a visual runtime host while preserving a figure/fallback:

```html
<figure id="visual-scene" class="visual-scene" aria-labelledby="visual-caption">
  <div id="visual-stage" class="visual-stage"></div>
  <figcaption id="visual-caption">Visual media provides context. Clinical indication comes from the simulation state and evidence gates.</figcaption>
</figure>
<div id="visual-live" class="sr-live" role="status" aria-live="polite"></div>
<section id="visual-detail" class="visual-detail" aria-label="Selected visual asset"></section>
```

Keep the main scene comprehensible when CSS/background images fail.

- [ ] **Step 2: Implement renderer without clinical logic**

`visual-ui.js` may:

```text
render the current image
render button hotspots
render a semantic list fallback
announce focus/state
call onAction(proposalInput)
show held/allowed feedback
```

It may not:

```text
change station/equipment state itself
infer indications
write physiology
invent consent/authority
```

- [ ] **Step 3: Use real buttons for hotspots**

Each visual hotspot must render as a `<button type="button">` with:

```text
aria-label from semantic description
visible focus ring
data-hotspot-id
data-visual-action
```

Position buttons with percentage geometry. Add an always-available semantic list beneath or beside the image so switch/screen-reader users never depend on spatial targeting.

- [ ] **Step 4: Add visual detail drawer/panel**

For a selected equipment item display:

```text
title
station
current equipment state
alt text / extended description
evidence status
missing evidence text
available actions
```

Use words/icons plus styling; do not use colour alone.

- [ ] **Step 5: Wire `ui.js` to proposal/commit pipeline**

The UI handler sequence must be:

```js
const decision = proposeVisualAction(state, actionInput);
if (decision.status === "allowed" && decision.eventProposal) {
  state = commitVisualAction(state, decision);
}
render();
persistCurrentSnapshot();
```

A held action shows feedback but does not mutate state.

- [ ] **Step 6: Add low-sensory behaviour**

Existing low-sensory mode currently hides the scene figure. Change it so the image layer is hidden but the semantic visual interaction list remains visible and operable.

- [ ] **Step 7: Run the full suite and local smoke server**

```bash
npm test
python3 -m http.server 4173
```

Use a browser verification pass to check:

```text
page loads
no console errors
keyboard reaches every hotspot/action
low-sensory mode preserves semantic controls
focus remains visible
missing-image fallback is usable
mobile-width layout does not obscure controls
```

- [ ] **Step 8: Commit**

```bash
git add src/features/visual-ui.js src/features/ui.js index.html styles.css tests/visual-accessibility.test.mjs
git commit -m "feat: add accessible interactive visual renderer"
```

---

### Task 8: Import the five approved visual assets with immutable provenance

**Files:**
- Create binary assets under `assets/visual-registry/`
- Create: `assets/visual-registry/provenance.json`
- Extend: `tests/visual-registry.test.mjs`

**Interfaces:**
- Consumes the five approved conversation assets.
- Produces content-hashed provenance records referenced by `src/data/visual-assets.js`.

- [ ] **Step 1: Copy exactly five unique source assets into deterministic filenames**

Use the approved assets only:

```text
maya-ed-arrival.png
maya-icu-respiratory-support.png
paediatric-retrieval-prep.png
oxygen-interface-13.png
equipment-inventory-40.png
```

Do not include duplicate uploads of the retrieval or oxygen-interface images.

- [ ] **Step 2: Calculate SHA-256 hashes**

Run:

```bash
sha256sum assets/visual-registry/*.png
```

- [ ] **Step 3: Create provenance.json**

Use this exact structure per asset:

```json
{
  "assetId": "oxygen-interface-13",
  "file": "oxygen-interface-13.png",
  "sha256": "<64 lowercase hex characters from sha256sum>",
  "sourceKind": "user_supplied_or_project_generated",
  "fictionalDepiction": true,
  "approvedUses": ["educational_simulation", "project_hope_visual_runtime"],
  "clinicalEvidence": false,
  "accessibilityReview": "pending",
  "clinicalReview": "pending"
}
```

The actual SHA value must come from the copied bytes; never fabricate it.

- [ ] **Step 4: Add integrity tests**

Use `node:crypto` and `node:fs` to assert every provenance hash matches the file and every registry asset path exists.

- [ ] **Step 5: Run tests and commit**

```bash
npm test
git add assets/visual-registry src/data/visual-assets.js tests/visual-registry.test.mjs
git commit -m "feat: add versioned simulation visual asset pack"
```

---

### Task 9: Add scenario-specific evidence/relevance rules for Maya and Rohan

**Files:**
- Modify: `src/data/visual-assets.js`
- Modify: `src/data/visual-manifests.js`
- Modify: `src/scenarios.js`
- Extend: `tests/visual-integration.test.mjs`

**Interfaces:**
- Maya and Rohan share asset definitions but retain isolated scenario state/evidence.

- [ ] **Step 1: Write isolation tests**

Prove:

```js
test("Maya equipment relevance does not leak into Rohan scenario", () => {
  const maya = createRuntime("adult-suction");
  const rohan = createRuntime("rohan-alarm");
  const mayaNext = setScenarioEvidenceForTest(maya, { oxygenWorkstreamRelevant: true });
  assert.equal(getVisualEquipmentState(mayaNext, "13").relevant, true);
  assert.notEqual(getVisualEquipmentState(rohan, "13").relevant, true);
});
```

If test-only helper names differ, define equivalent fixture helpers in the test file rather than exporting mutable production backdoors.

- [ ] **Step 2: Add Maya evidence rules**

For oxygen interface 13, visibility may remain available while action relevance is scenario evidence-driven. Exact commit must require compatibility/readiness evidence and must not imply that oxygen resolves obstruction, secretion load or ineffective ventilation.

- [ ] **Step 3: Add Rohan evidence rules**

Rohan may see retrieval preparation/inventory assets when present in the PICU scene, but the same availability does not establish a route-changing intervention.

- [ ] **Step 4: Verify separate scenario reset/replay**

Switching scenarios must rebuild the active visual state from that scenario manifest; no focused/inspected/relevant state leaks across scenario boundaries.

- [ ] **Step 5: Run tests and commit**

```bash
npm test
git add src/data/visual-assets.js src/data/visual-manifests.js src/scenarios.js tests/visual-integration.test.mjs
git commit -m "feat: isolate visual evidence across simulation scenarios"
```

---

### Task 10: Preserve persistence/replay compatibility

**Files:**
- Modify: `src/persistence.js` only if snapshots currently serialize a curated subset; otherwise no change.
- Extend: `tests/visual-integration.test.mjs`
- Extend: `tests/virgal-world.test.mjs` if replay head verification needs an SVSR regression.

**Interfaces:**
- Persist version identifiers and committed visual events, not image bytes.

- [ ] **Step 1: Inspect current snapshot serialization and write failing round-trip test**

The expected persisted visual fields are:

```text
registryVersion
manifestVersion
sceneId
focusedAssetId
inspectedAssetIds
```

Equipment state remains in the existing runtime station/equipment state.

- [ ] **Step 2: Prove identical committed sequence reproduces identical visual projection**

Create a test that:

```text
creates runtime
inspects asset
selects equipment
serializes/rebuilds from committed events or snapshot path
asserts same scene/focus/inspection/equipment state and same VIRGAL head hash
```

- [ ] **Step 3: Implement only the minimum persistence projection needed**

Do not persist image binary or derived DOM geometry.

- [ ] **Step 4: Run full tests and commit**

```bash
npm test
git add src/persistence.js tests/visual-integration.test.mjs tests/virgal-world.test.mjs
git commit -m "test: preserve visual runtime replay and persistence"
```

Omit `src/persistence.js` from the commit if no production change is required.

---

### Task 11: Add optional local-model adapter boundary without enabling it by default

**Files:**
- Create: `src/visual-runtime/model-adapter.js`
- Create: `tests/visual-model-adapter.test.mjs`
- Modify: `README.md`

**Interfaces:**
- Produces: `validateModelAssistanceProposal(input)`.
- No model dependency is added yet.

- [ ] **Step 1: Write proposal-boundary tests**

Allow these proposal roles:

```text
learner_transcript
scene_caption_candidate
hotspot_candidate
asset_search_candidate
```

Reject these attempted outputs:

```text
clinical_fact
capacity_finding
consent_finding
treatment_indication
equipment_commit
physiology_mutation
```

- [ ] **Step 2: Implement validator only**

Do not add `@huggingface/transformers` in this task. The simulation remains complete without local ML.

- [ ] **Step 3: Document Hugging Face evaluation prerequisites**

README must require before any model is enabled:

```text
pinned repo + revision
licence review
model-card review
training-data/known-bias review when available
disability speech/representation evaluation
fallback path
memory/performance profiling
human review for generated accessibility text
```

- [ ] **Step 4: Run tests and commit**

```bash
npm test
git add src/visual-runtime/model-adapter.js tests/visual-model-adapter.test.mjs README.md
git commit -m "feat: define optional local model assistance boundary"
```

---

### Task 12: Define the React Native adapter package boundary without duplicating the engine

**Files:**
- Create: `docs/architecture/react-native-visual-runtime-adapter.md`
- Extend: `tests/visual-registry.test.mjs` with JSON-serializability test.

**Interfaces:**
- Native clients consume serialized registry/manifest/action/event contracts.
- No React Native dependency is added to the web repository in v0.1.

- [ ] **Step 1: Add JSON serialization regression**

Assert registry and manifest fixtures survive:

```js
const roundTrip = JSON.parse(JSON.stringify({ registry, manifest }));
assert.equal(roundTrip.manifest.version, "0.1");
assert.equal(roundTrip.registry.assets[0].id, registry.assets[0].id);
```

- [ ] **Step 2: Write adapter architecture doc**

Document:

```text
same action proposal schema
same event meanings
percentage geometry mapped to measured Image bounds
semantic list fallback on native
switch/external input normalized to action proposal
virtualized equipment lists
bounded image memory/cache
no clinical/guardian logic duplicated in native
```

- [ ] **Step 3: Run tests and commit**

```bash
npm test
git add docs/architecture/react-native-visual-runtime-adapter.md tests/visual-registry.test.mjs
git commit -m "docs: define React Native visual runtime adapter"
```

---

### Task 13: Add research/evidence register entries for communication access

**Files:**
- Create or modify the repository's existing evidence registry if one exists on the v0.4 branch; otherwise create: `docs/evidence/communication-access-evidence.md`
- Modify: `README.md`

**Interfaces:**
- Evidence affects learning-objective provenance only; it does not mutate patient state or treatment logic.

- [ ] **Step 1: Record the inspected PubMed evidence**

Add concise entries for:

```text
PMID 38866691 — mixed-methods systematic review; low-technology AAC in ICU
PMID 38627116 — scoping review; communication in cuff-inflated tracheostomy patients
PMID 40690241 — ICU nurses' AAC experience/knowledge/training preferences
PMID 42341409 — AAC/basic communication training intervention for ICU nurses
```

Each entry must include population/context, what the abstract directly supports, limitations, and the statement: `Does not validate simulator clinical outcomes or credentialing.`

- [ ] **Step 2: Record disability-studies evidence separately**

If JSTOR full text is not available during execution, include only metadata/abstract-level claims that were actually retrieved. Do not present humanities evidence as clinical treatment guidance.

- [ ] **Step 3: Link evidence register from README**

Explain that scenario clinical parameters require separate current authoritative clinical governance.

- [ ] **Step 4: Commit**

```bash
git add docs/evidence README.md
git commit -m "docs: record communication access evidence provenance"
```

---

### Task 14: Verification, preview deployment and review-ready handoff

**Files:**
- No feature code unless verification reveals a defect.
- Potentially update: `README.md` with final developer instructions.

**Interfaces:**
- Produces: verified feature branch, Vercel Preview, draft PR, review evidence.

- [ ] **Step 1: Run complete local verification**

```bash
npm install
npm test
```

Expected: zero failures.

- [ ] **Step 2: Run the app locally and complete browser checks**

```bash
python3 -m http.server 4173
```

Verify at minimum:

```text
Maya ED visual renders
semantic fallback list renders
keyboard focus reaches all critical actions
low-sensory mode retains semantic controls
held actions do not mutate station state
AAC timer semantics remain correct
Rohan scenario does not inherit Maya visual state
no console errors
```

- [ ] **Step 3: Run accessibility-oriented source checks**

Search the renderer for:

```text
click-only non-button hotspots
missing alt text
colour-only labels
aria-hidden interactive elements
positive tabindex values
```

Any match must be reviewed and either removed or justified.

- [ ] **Step 4: Push implementation branch and require Vercel Preview**

The implementation branch should be:

```text
feat/shared-visual-simulation-registry-v01
```

If PR #18 remains open, create this branch from `feat/virgal-character-world-v04` and open a stacked draft PR with base `feat/virgal-character-world-v04`. After #18 merges, retarget the SVSR PR to `main` and update/rebase without changing tested behavior.

- [ ] **Step 5: Verify Vercel Preview**

Use the existing `breathing-support-learning-hub` Vercel project. Confirm deployment status `READY`, then perform the same smoke flow against the Preview URL. Inspect runtime/build logs for missing asset or module errors.

Do not promote to production in this task.

- [ ] **Step 6: Require review evidence before merge-ready status**

The PR is not merge-ready until it contains evidence of:

```text
all Node tests passing
browser/keyboard smoke pass
Vercel Preview READY
Cursor BugBot inspection
CodeRabbit inspection
clinical review status recorded
accessibility review status recorded
lived-experience review status recorded
```

Clinical/accessibility/lived-experience statuses may be `pending` for a draft PR, but public/accredited-training claims remain prohibited while pending.

- [ ] **Step 7: Open draft PR**

PR title:

```text
feat: add shared visual simulation registry v0.1
```

PR summary must call out:

```text
shared Maya/Rohan visual registry
evidence-gated hotspots
rights-aware branch holds
semantic fallback/accessibility
VIRGAL event integration
immutable visual provenance
no production deployment
no clinical authority delegated to visuals/models
```

- [ ] **Step 8: Final whole-branch review**

Review changed files against the spec and explicitly confirm:

```text
visuals propose but do not commit clinical truth
rights/guardian holds are branch-scoped
same event stream replays deterministically
missing visual bytes preserve semantic interaction
all critical paths have non-pointer access
```

Do not merge automatically.

---

## Self-Review Against the Approved Spec

### Spec coverage

- Shared cross-character registry: Tasks 1, 2, 9.
- Scenario-specific visibility/state: Tasks 2, 9.
- Proposal/action contract and stale-head protection: Task 3.
- VIRGAL-only commit path: Task 4.
- Rights and autonomy integration: Task 5.
- Accessibility and missing-image fallback: Tasks 6, 7.
- Initial five visual assets + provenance: Task 8.
- Persistence/replay: Task 10.
- Optional Hugging Face/local-model boundary: Task 11.
- React Native adapter sequencing: Task 12.
- Evidence/research provenance: Task 13.
- Vercel Preview + review gates: Task 14.

### Type/name consistency

The plan consistently uses:

```text
VisualAsset
VisualHotspot
VisualActionProposal
VisualActionDecision
buildVisualRegistry
getScenarioVisualManifest
evaluateEvidenceList
buildVisualActionProposal
evaluateVisualAction
createVisualState
applyVisualEvent
proposeVisualAction
commitVisualAction
buildRightsEnvelope
normalizeRightsGate
buildHotspotTraversal
describeVisualAssetState
```

### No hidden clinical shortcuts

No task permits a visual, hotspot, model or renderer to directly author physiology, medication/device settings, diagnosis, consent, incapacity, substitute authority or treatment ceiling.

## Execution Default

Because the project owner has provided standing approval for normal project checkpoints, execution should default to **Subagent-Driven Development** with a fresh task worker and independent review gate per task. Do not repeatedly ask for approval between ordinary tasks. Still stop for destructive/irreversible repository actions, production promotion, secrets/credentials, or any proposed change that materially weakens the approved clinical/rights safety boundary.
