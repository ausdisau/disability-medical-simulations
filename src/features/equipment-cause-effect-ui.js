import {
  EQUIPMENT_DEFINITIONS,
  EQUIPMENT_IDS,
  buildEquipmentCauseEffectGraph,
  commitEquipmentEffect,
  createEquipmentStation,
  deriveBodyVisual,
  previewEquipmentEffect,
  transitionEquipmentStation,
  visualDeteriorationIndex
} from "./equipment-cause-effect-engine.js";

const byId = (id) => document.getElementById(id);

const SCENARIO_EQUIPMENT_MODELS = Object.freeze({
  "adult-suction": {
    bodyState: {
      oxygenationReserve: 0.54,
      ventilationReserve: 0.43,
      airwayPatency: 0.58,
      secretionBurden: 0.72,
      workOfBreathing: 0.74,
      hemodynamicReserve: 0.66,
      postureSupport: 0.64,
      aacAccess: 0.92,
      signalReliability: 0.90
    },
    gates: {
      oxygenIndicated: false,
      secretionsEvidence: true,
      ventilationFailure: false,
      shockableArrest: false,
      positioningCompatible: true,
      aacAccessImpaired: false
    },
    contextOnly: []
  },
  "rohan-alarm": {
    bodyState: {
      oxygenationReserve: 0.52,
      ventilationReserve: 0.40,
      airwayPatency: 0.60,
      secretionBurden: 0.30,
      workOfBreathing: 0.76,
      hemodynamicReserve: 0.62,
      postureSupport: 0.61,
      aacAccess: 0.78,
      signalReliability: 0.55
    },
    gates: {
      oxygenIndicated: false,
      secretionsEvidence: false,
      ventilationFailure: false,
      shockableArrest: false,
      positioningCompatible: true,
      aacAccessImpaired: false
    },
    // Rohan is a paediatric case. Advanced airway/defibrillation execution is deliberately
    // not borrowed from the adult pathway; these objects stay visible as context only here.
    contextOnly: [EQUIPMENT_IDS.MANUAL_VENTILATION, EQUIPMENT_IDS.DEFIBRILLATOR]
  }
});

const EQUIPMENT_ORDER = [
  EQUIPMENT_IDS.OXYGEN,
  EQUIPMENT_IDS.SUCTION,
  EQUIPMENT_IDS.MANUAL_VENTILATION,
  EQUIPMENT_IDS.REPOSITION,
  EQUIPMENT_IDS.DEFIBRILLATOR,
  EQUIPMENT_IDS.AAC_RESTORE
];

const WORKSTREAM = Object.freeze({
  [EQUIPMENT_IDS.OXYGEN]: "AIRWAY_BREATHING",
  [EQUIPMENT_IDS.SUCTION]: "AIRWAY_TRAINED_CLINICIAN",
  [EQUIPMENT_IDS.MANUAL_VENTILATION]: "AIRWAY_TRAINED_CLINICIAN",
  [EQUIPMENT_IDS.REPOSITION]: "BEDSIDE_TEAM",
  [EQUIPMENT_IDS.DEFIBRILLATOR]: "ALS_TEAM",
  [EQUIPMENT_IDS.AAC_RESTORE]: "ANY_BEDSIDE_TEAM_MEMBER"
});

const METRIC_LABELS = Object.freeze({
  oxygenationReserve: "Oxygenation reserve",
  ventilationReserve: "Ventilation reserve",
  airwayPatency: "Airway patency",
  secretionBurden: "Secretion burden",
  workOfBreathing: "Work of breathing",
  hemodynamicReserve: "Haemodynamic reserve",
  postureSupport: "Posture support",
  aacAccess: "AAC access",
  signalReliability: "Signal reliability"
});

let model = null;
let liveMessage = "";

function scenarioModel(scenarioId) {
  return SCENARIO_EQUIPMENT_MODELS[scenarioId] ?? SCENARIO_EQUIPMENT_MODELS["adult-suction"];
}

function createModel(scenarioId) {
  const seed = scenarioModel(scenarioId);
  const stations = Object.fromEntries(
    EQUIPMENT_ORDER.map((equipmentId) => [
      equipmentId,
      createEquipmentStation(equipmentId, {
        contextOnly: seed.contextOnly.includes(equipmentId)
      })
    ])
  );

  return {
    scenarioId,
    bodyState: { ...seed.bodyState },
    gates: { ...seed.gates },
    stations,
    ledger: []
  };
}

function nextActionLabel(station) {
  if (station.contextOnly) return "Context only";
  switch (station.state) {
    case "available": return "Select";
    case "selected": return "Check";
    case "checked": return "Assign";
    case "assigned": return "Commit";
    case "committed": return "Committed";
    default: return "Unavailable";
  }
}

function gateStatus(station) {
  const definition = EQUIPMENT_DEFINITIONS[station.equipmentId];
  if (station.contextOnly) return "Context only — clinical execution locked";
  return model.gates[definition.evidenceGate]
    ? `Evidence gate open: ${definition.evidenceGate}`
    : `Evidence gate closed: ${definition.evidenceGate}`;
}

function metricBar(key, value) {
  const percent = Math.round(value * 100);
  return `
    <div class="body-metric">
      <div class="body-metric-heading">
        <span>${METRIC_LABELS[key]}</span>
        <strong>${percent}/100 synthetic</strong>
      </div>
      <div class="body-meter" role="meter" aria-label="${METRIC_LABELS[key]} synthetic simulation value" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}">
        <span style="width:${percent}%"></span>
      </div>
    </div>`;
}

function renderBody() {
  const visual = deriveBodyVisual(model.bodyState);
  const decline = Math.round(visualDeteriorationIndex(model.bodyState) * 100);
  const stability = Math.round(visual.verticalStability * 100);

  byId("body-visual-summary").innerHTML = `
    <div class="body-stability-figure" aria-hidden="true">
      <div class="body-head"></div>
      <div class="body-torso" style="transform:rotate(${Math.round((1 - visual.verticalStability) * 12)}deg)"></div>
      <div class="breathing-pulse" style="--effort:${Math.round(visual.chestEffort * 100)}%"></div>
    </div>
    <div>
      <p><strong>Visual decline load:</strong> ${decline}/100 synthetic</p>
      <p><strong>Vertical/postural stability:</strong> ${stability}/100 synthetic</p>
      <p><strong>Visible cues:</strong> ${visual.cues.length ? visual.cues.join(", ") : "none currently generated"}</p>
    </div>`;

  const keys = [
    "oxygenationReserve",
    "ventilationReserve",
    "airwayPatency",
    "workOfBreathing",
    "postureSupport",
    "aacAccess"
  ];
  byId("body-metric-grid").innerHTML = keys.map((key) => metricBar(key, model.bodyState[key])).join("");
}

function renderCauseGraph() {
  const graph = buildEquipmentCauseEffectGraph(model.bodyState, Object.values(model.stations), model.gates);
  const rows = graph.map((node) => {
    if (!node.allowed) {
      return `<li><strong>${node.label}</strong> → no causal edge yet (${node.blockedReasons.join("; ") || "complete the station lifecycle"}).</li>`;
    }
    if (node.edges.length === 0) {
      return `<li><strong>${node.label}</strong> → controller-owned clinical event; no deterministic body-state edge.</li>`;
    }
    const edges = node.edges.map((edge) => `${METRIC_LABELS[edge.to] ?? edge.to} ${edge.direction === "increase" ? "↑" : "↓"}`).join(", ");
    return `<li><strong>${node.label}</strong> → ${edges} <span class="synthetic-tag">synthetic</span></li>`;
  });
  byId("equipment-cause-graph").innerHTML = rows.join("");
}

function renderEquipment() {
  byId("equipment-effect-grid").innerHTML = EQUIPMENT_ORDER.map((equipmentId) => {
    const station = model.stations[equipmentId];
    const definition = EQUIPMENT_DEFINITIONS[equipmentId];
    const preview = previewEquipmentEffect(model.bodyState, station, model.gates);
    const disabled = station.contextOnly || station.state === "committed";
    return `
      <article class="equipment-effect-card" data-equipment="${equipmentId}">
        <div class="equipment-card-heading">
          <h3>${definition.label}</h3>
          <span class="station-state">${station.state}</span>
        </div>
        <p>${gateStatus(station)}</p>
        <p><strong>Reassess:</strong> ${definition.reassess.join(", ")}</p>
        <p class="equipment-preview">${preview.allowed
          ? "Preview available after assignment; synthetic effect does not become clinical truth until a controller-valid commit/reassessment."
          : `Blocked: ${preview.blockedReasons.join("; ") || "complete lifecycle"}`}</p>
        <button type="button" data-equipment-action="${equipmentId}" ${disabled ? "disabled" : ""}>${nextActionLabel(station)}</button>
      </article>`;
  }).join("");

  document.querySelectorAll("[data-equipment-action]").forEach((button) => {
    button.addEventListener("click", () => advanceEquipment(button.dataset.equipmentAction));
  });
}

function advanceEquipment(equipmentId) {
  let station = model.stations[equipmentId];
  const definition = EQUIPMENT_DEFINITIONS[equipmentId];

  if (station.contextOnly || station.state === "committed") return;

  if (station.state === "available") {
    station = transitionEquipmentStation(station, "SELECT");
    liveMessage = `${definition.label} selected. No body state changed.`;
  } else if (station.state === "selected") {
    station = transitionEquipmentStation(station, "CHECK", {
      ready: true,
      compatible: true,
      evidenceGateSatisfied: model.gates[definition.evidenceGate] === true
    });
    liveMessage = `${definition.label} checked. ${gateStatus(station)}.`;
  } else if (station.state === "checked") {
    station = transitionEquipmentStation(station, "ASSIGN", {
      workstream: WORKSTREAM[equipmentId]
    });
    const preview = previewEquipmentEffect(model.bodyState, station, model.gates);
    liveMessage = preview.allowed
      ? `${definition.label} assigned. Cause-and-effect preview is now visible.`
      : `${definition.label} assigned, but commitment remains blocked: ${preview.blockedReasons.join("; ")}.`;
  } else if (station.state === "assigned") {
    station = transitionEquipmentStation(station, "COMMIT");
    const result = commitEquipmentEffect(model.bodyState, station, model.gates);
    if (result.committed && !result.controllerEventRequired) {
      model.bodyState = { ...result.resultingState };
      liveMessage = `${definition.label} committed in the synthetic model. Reassessment is required; this is not a patient-specific treatment prediction.`;
    } else if (result.committed && result.controllerEventRequired) {
      liveMessage = `${definition.label} reached the controller gate. The clinical event engine, not this visual model, must determine rhythm/outcome.`;
    } else {
      liveMessage = `${definition.label} could not change the body model: ${result.blockedReasons.join("; ")}.`;
    }
    model.ledger.unshift({
      equipmentId,
      allowed: result.allowed,
      controllerEventRequired: result.controllerEventRequired,
      state: station.state,
      bodyState: { ...model.bodyState }
    });
  }

  model.stations[equipmentId] = station;
  renderEquipmentEffectUI();
}

export function renderEquipmentEffectUI() {
  if (!model || !byId("equipment-effect-grid")) return;
  renderBody();
  renderEquipment();
  renderCauseGraph();
  byId("equipment-effect-live").textContent = liveMessage;
  byId("equipment-ledger-count").textContent = `${model.ledger.length} committed equipment event${model.ledger.length === 1 ? "" : "s"}`;
}

export function resetEquipmentEffectUI(scenarioId) {
  model = createModel(scenarioId);
  liveMessage = "Explore equipment in sequence. Selection alone never changes the body model.";
  renderEquipmentEffectUI();
}

export function initEquipmentEffectUI(initialScenarioId) {
  resetEquipmentEffectUI(initialScenarioId);

  const resetButton = byId("reset-equipment-effects");
  if (resetButton) {
    resetButton.addEventListener("click", () => resetEquipmentEffectUI(model.scenarioId));
  }
}
