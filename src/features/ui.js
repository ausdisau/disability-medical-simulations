import { scenarios, stationDefinitions } from "../scenarios.js";
import { downloadSimulationExport } from "../export.js";
import {
  advanceStation,
  commitChoice,
  createRuntime,
  formatTime,
  pauseForCommunication,
  reassess,
  restoreCommunication,
  selectChoice,
  stationNextLabel,
  tick
} from "../runtime.js";

const byId = (id) => document.getElementById(id);
let scenarioIndex = 0;
let state = createRuntime(scenarios[scenarioIndex].id);

function list(target, items) {
  target.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}

function currentScenario() {
  return scenarios[scenarioIndex];
}

function accessibilityPreferences() {
  return {
    lowSensory: Boolean(byId("low-sensory")?.checked),
    reducedMotion: Boolean(byId("reduced-motion")?.checked)
  };
}

function renderLog() {
  const items = state.events.map((event) => `<li><strong>${formatTime(event.seconds)}</strong> ${event.message}</li>`);
  byId("event-log").innerHTML = items.join("") || "<li>No events yet.</li>";
}

function renderStations() {
  byId("station-grid").innerHTML = stationDefinitions.map((station) => {
    const status = state.stations[station.id];
    return `
      <article class="station" data-kind="${station.kind}">
        <h3>${station.id} · ${station.label}</h3>
        <span class="station-state">${status}</span>
        <p>${station.purpose}</p>
        <button type="button" data-station-id="${station.id}" ${status === "committed" ? "disabled" : ""}>
          ${stationNextLabel(status)}
        </button>
      </article>`;
  }).join("");

  document.querySelectorAll("[data-station-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state = advanceStation(state, button.dataset.stationId);
      render();
    });
  });
}

function renderChoices() {
  const scenario = currentScenario();
  byId("choice-list").innerHTML = scenario.choices.map((choice) => `
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

function render() {
  const scenario = currentScenario();
  byId("patient-name").textContent = scenario.patient.name;
  byId("patient-profile").textContent = scenario.patient.profile;
  byId("communication-method").textContent = scenario.patient.communication;
  byId("communication-detail").textContent = scenario.patient.communicationDetail;
  byId("clock").textContent = formatTime(state.seconds);
  byId("clock-note").textContent = state.pauseReason === "communication" ? "Paused for communication" : state.paused ? "Paused" : "Running";
  byId("scenario-state").textContent = state.completed ? "Cause-led branch opened" : "Assessment";
  byId("scene-setting").textContent = `${scenario.setting} · ${scenario.jurisdiction}`;
  byId("scene-title").textContent = scenario.title;
  byId("patient-voice").textContent = `“${scenario.patient.voice}”`;
  byId("opening-text").textContent = scenario.opening;
  byId("aac-description").textContent = scenario.patient.communicationDetail;
  byId("decision-title").textContent = scenario.decisionPrompt;
  list(byId("baseline-list"), scenario.baseline);
  list(byId("change-list"), scenario.changes);
  list(byId("assumption-list"), scenario.assumptions);
  list(byId("debrief-list"), scenario.debrief);
  renderChoices();
  renderStations();
  renderLog();
}

export function initApp() {
  function loadScenario(index) {
    scenarioIndex = Number(index);
    state = createRuntime(currentScenario().id);
    byId("feedback").textContent = "Choose an action. The simulation rewards sequence, reassessment and direct communication—not speed alone.";
    byId("aac-live").textContent = "";
    byId("session-live").textContent = "New memory-only simulation started. Nothing has been saved.";
    render();
  }

  byId("scenario-select").innerHTML = scenarios.map((scenario, index) => `<option value="${index}">${scenario.title}</option>`).join("");
  byId("scenario-select").addEventListener("change", (event) => loadScenario(event.target.value));
  byId("pause-aac").addEventListener("click", () => {
    state = pauseForCommunication(state);
    byId("aac-live").textContent = "Simulation clock paused while communication is composed or scanned.";
    render();
  });
  byId("restore-aac").addEventListener("click", () => {
    state = restoreCommunication(state);
    byId("aac-live").textContent = "AAC access restored and confirmed.";
    render();
  });
  byId("commit-decision").addEventListener("click", () => {
    const result = commitChoice(state, currentScenario());
    state = result.state;
    byId("feedback").textContent = result.feedback;
    render();
  });
  byId("reassess").addEventListener("click", () => {
    state = reassess(state);
    render();
  });
  byId("export-json").addEventListener("click", () => {
    downloadSimulationExport({
      scenario: currentScenario(),
      state,
      accessibility: accessibilityPreferences()
    });
    byId("session-live").textContent = "JSON exported to your device. The platform did not save a copy.";
  });
  byId("discard-session").addEventListener("click", () => {
    const confirmed = window.confirm("Discard this simulation? The current in-memory state will be permanently removed. Export JSON first if you want to keep it.");
    if (!confirmed) return;
    loadScenario(scenarioIndex);
    byId("session-live").textContent = "Previous in-memory simulation discarded. A fresh session is ready.";
  });
  byId("reset-scenario").addEventListener("click", () => loadScenario(scenarioIndex));
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
  byId("session-live").textContent = "Memory-only session active. Nothing is retained unless you explicitly export JSON.";
}
