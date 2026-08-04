import { rohanTree, phaseOrder } from "./rohan-tree.js";
import {
  commitTreeChoice,
  createTreeRuntime,
  formatTime,
  pauseForCommunication,
  reassess,
  restoreCommunication,
  selectChoice,
  summarizeOutcome,
  tick
} from "./runtime.js";

const byId = (id) => document.getElementById(id);
let state = createTreeRuntime(rohanTree);

function labelForKey(key) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function meter(label, value) {
  const safeValue = Math.max(0, Math.min(5, value));
  return `<div class="meter-row"><span>${label}</span><meter min="0" max="5" value="${safeValue}">${safeValue} of 5</meter><strong>${safeValue}/5</strong></div>`;
}

function renderBody() {
  byId("body-ledger").innerHTML = Object.entries(state.body)
    .map(([key, value]) => meter(labelForKey(key), value))
    .join("");
}

function renderDefinitionList(target, object) {
  target.innerHTML = Object.entries(object)
    .map(([key, value]) => `<div><dt>${labelForKey(key)}</dt><dd>${Array.isArray(value) ? value.join(", ") : String(value)}</dd></div>`)
    .join("");
}

function renderChoices(node) {
  if (!node.choices.length) {
    const outcome = summarizeOutcome(state);
    byId("choice-list").innerHTML = `<div class="outcome"><h3>Pathway complete</h3><p>${outcome.decisions} decisions recorded. Crisis debt: ${outcome.crisisDebt}. Rohan-team trust: ${outcome.rohanTrust}. Mother-team trust: ${outcome.motherTrust}.</p></div>`;
    byId("commit-decision").disabled = true;
    return;
  }

  byId("commit-decision").disabled = false;
  byId("choice-list").innerHTML = node.choices.map((choice) => `
    <label class="choice">
      <input type="radio" name="decision" value="${choice.id}" ${state.selectedChoiceId === choice.id ? "checked" : ""}>
      <span>${choice.label}</span>
    </label>`).join("");

  document.querySelectorAll("input[name='decision']").forEach((input) => {
    input.addEventListener("change", () => {
      state = selectChoice(state, input.value);
    });
  });
}

function renderPhaseMap() {
  const currentPhase = rohanTree.nodes[state.nodeId].phase;
  byId("phase-list").innerHTML = phaseOrder.map((phase) => {
    const visited = state.history.some((nodeId) => rohanTree.nodes[nodeId]?.phase === phase);
    const current = phase === currentPhase;
    return `<li class="${visited ? "visited" : ""} ${current ? "current" : ""}"><span>${phase}</span></li>`;
  }).join("");
}

function renderHistory() {
  byId("history-list").innerHTML = state.history.map((nodeId) => {
    const node = rohanTree.nodes[nodeId];
    return `<li><strong>${node.phase}</strong><br>${node.title}</li>`;
  }).join("");
}

function renderLog() {
  byId("event-log").innerHTML = state.events.length
    ? state.events.map((event) => `<li><strong>${formatTime(event.seconds)}</strong> ${event.message}</li>`).join("")
    : "<li>No decisions committed yet.</li>";
}

function render() {
  const node = rohanTree.nodes[state.nodeId];
  byId("phase").textContent = node.phase;
  byId("node-title").textContent = node.title;
  byId("clock").textContent = formatTime(state.seconds);
  byId("clock-note").textContent = state.pauseReason === "communication" ? "Paused for communication" : state.completed ? "Complete" : "Running";
  byId("latest-message").textContent = state.voice.latestReliableMessage;
  byId("voice-reliability").textContent = state.voice.reliability;
  byId("crisis-debt").textContent = state.crisisDebt;
  byId("scene-phase").textContent = node.phase;
  byId("scene-title").textContent = node.title;
  byId("scene-text").textContent = node.scene;
  byId("decision-title").textContent = node.prompt;
  byId("aac-description").textContent = `${rohanTree.patient.communication}. Current reliability: ${state.voice.reliability}. No response is recorded as unknown, not consent.`;

  renderBody();
  renderDefinitionList(byId("voice-ledger"), state.voice);
  renderDefinitionList(byId("system-ledger"), state.system);
  byId("trust-ledger").innerHTML = [
    meter("Rohan ↔ team", state.trust.rohanTeam),
    meter("Mother ↔ team", state.trust.motherTeam)
  ].join("");
  renderChoices(node);
  renderPhaseMap();
  renderHistory();
  renderLog();
}

byId("commit-decision").addEventListener("click", () => {
  const result = commitTreeChoice(state, rohanTree);
  state = result.state;
  byId("feedback").textContent = result.feedback;
  render();
});

byId("pause-aac").addEventListener("click", () => {
  state = pauseForCommunication(state);
  byId("aac-live").textContent = "Simulation clock paused while communication is composed or scanned.";
  render();
});

byId("restore-aac").addEventListener("click", () => {
  state = restoreCommunication(state);
  byId("aac-live").textContent = "AAC returned, positioned and recalibrated. Reliability must still be verified.";
  render();
});

byId("reassess").addEventListener("click", () => {
  state = reassess(state);
  byId("feedback").textContent = "Reassessment documented. One point of unresolved crisis debt was removed where possible.";
  render();
});

byId("reset").addEventListener("click", () => {
  state = createTreeRuntime(rohanTree);
  byId("feedback").textContent = "Scenario restarted. Consequences persist only within the current run.";
  render();
});

byId("low-sensory").addEventListener("change", (event) => document.body.classList.toggle("low-sensory", event.target.checked));
byId("reduced-motion").addEventListener("change", (event) => document.body.classList.toggle("reduced-motion", event.target.checked));

setInterval(() => {
  const next = tick(state);
  if (next !== state) {
    state = next;
    byId("clock").textContent = formatTime(state.seconds);
  }
}, 1000);

render();
