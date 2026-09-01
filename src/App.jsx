import React, { useEffect, useMemo, useState } from "react";
import { scenarios, stationDefinitions } from "./scenarios.js";
import { auditPersonhood } from "./guardian.js";
import { downloadSimulationExport } from "./export.js";
import {
  advanceStation,
  commitChoice,
  createRuntime,
  facilitatorPause,
  formatTime,
  pauseForCommunication,
  reassess,
  restoreCommunication,
  resumeSimulation,
  selectChoice,
  startSimulation,
  stationNextLabel,
  tick
} from "./runtime.js";
import { APP_VERSION } from "./version.js";

function StatusRow({ label, value, tone = "neutral" }) {
  return (
    <div className={`state-row tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Card({ title, children, className = "" }) {
  return (
    <section className={`card ${className}`}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function App() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const scenario = scenarios[scenarioIndex];
  const [runtime, setRuntime] = useState(() => createRuntime(scenarios[0], { seed: 17, startPaused: true }));
  const [message, setMessage] = useState("Memory-only session ready. Start when you are ready.");
  const [feedback, setFeedback] = useState("Choose an action. The simulation rewards sequence, reassessment and direct communication — not speed alone.");
  const [preferences, setPreferences] = useState({ lowSensory: false, reducedMotion: false, largeText: false });

  const guardian = useMemo(() => auditPersonhood(runtime, scenario), [runtime, scenario]);

  useEffect(() => {
    document.body.classList.toggle("low-sensory", preferences.lowSensory);
    document.body.classList.toggle("reduced-motion", preferences.reducedMotion);
    document.body.classList.toggle("large-text", preferences.largeText);
  }, [preferences]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRuntime((current) => tick(current, 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  function resetScenario(index = scenarioIndex) {
    const nextScenario = scenarios[index];
    setScenarioIndex(index);
    setRuntime(createRuntime(nextScenario, { seed: 17, startPaused: true }));
    setFeedback("Choose an action. The simulation rewards sequence, reassessment and direct communication — not speed alone.");
    setMessage("Fresh memory-only session ready. Nothing from the previous run was retained by Project Hope.");
  }

  function commitDecision() {
    const result = commitChoice(runtime, scenario);
    setRuntime(result.state);
    setFeedback(result.feedback);
  }

  function exportJson() {
    downloadSimulationExport({ scenario, state: runtime, accessibility: preferences });
    setMessage("JSON exported to your device. Project Hope did not save a copy.");
  }

  function discardSession() {
    const confirmed = window.confirm("Discard this simulation? The current in-memory state will be removed. Export JSON first if you want to keep it.");
    if (confirmed) resetScenario();
  }

  const patientMessage = scenario.patient.authoredOpeningMessage || "RESPONSE UNKNOWN — no reliable patient-authored message has been established.";
  const communicationTone = runtime.communication.status === "available" ? "good" : "warn";
  const runningLabel = runtime.paused ? "PAUSED" : runtime.evaluationPaused ? "CLINICAL RUNNING / EVALUATION PAUSED" : "RUNNING";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <span className="kicker">PROJECT HOPE EMULATOR</span>
          <strong>{scenario.patient.name}</strong>
          <span>{scenario.setting}</span>
          <span>{scenario.jurisdiction}</span>
        </div>
        <div className="phase-block">
          <span>{scenario.phaseLabel}</span>
          <strong>{scenario.title}</strong>
        </div>
        <div className="clock-cluster" aria-label="Simulation clocks">
          <div><span>Clinical</span><strong>{formatTime(runtime.clinicalSeconds)}</strong></div>
          <div><span>Evaluation</span><strong>{formatTime(runtime.evaluationSeconds)}</strong></div>
          <small>{runningLabel}</small>
        </div>
      </header>

      <div className="control-strip" aria-label="Simulation controls">
        <label>
          Scenario
          <select value={scenarioIndex} onChange={(event) => resetScenario(Number(event.target.value))}>
            {scenarios.map((item, index) => <option key={item.id} value={index}>{item.title}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => setRuntime(startSimulation(runtime))}>Start</button>
        <button type="button" className="secondary" onClick={() => setRuntime(facilitatorPause(runtime))}>Facilitator pause</button>
        <button type="button" className="secondary" onClick={() => setRuntime(resumeSimulation(runtime))}>Resume</button>
        <label className="toggle"><input type="checkbox" checked={preferences.lowSensory} onChange={(e) => setPreferences({ ...preferences, lowSensory: e.target.checked })} /> Low sensory</label>
        <label className="toggle"><input type="checkbox" checked={preferences.reducedMotion} onChange={(e) => setPreferences({ ...preferences, reducedMotion: e.target.checked })} /> Reduced motion</label>
        <label className="toggle"><input type="checkbox" checked={preferences.largeText} onChange={(e) => setPreferences({ ...preferences, largeText: e.target.checked })} /> Large text</label>
      </div>

      <main id="simulation-main" className="simulation-grid">
        <section className="primary-column" aria-label="Patient and simulation workstreams">
          <section className="hero card" aria-labelledby="patient-scene-title">
            <div className="hero-copy">
              <p className="eyebrow">Patient / primary scene</p>
              <h1 id="patient-scene-title">{scenario.patient.name}</h1>
              <p className="profile">{scenario.patient.profile}</p>
              <div className="patient-message" aria-label="Patient-authored communication">
                <span>Patient-authored communication</span>
                <strong>{patientMessage}</strong>
              </div>
              <p>{scenario.opening}</p>
              <div className="access-banner">
                <strong>{scenario.patient.communication}</strong>
                <span>{scenario.patient.communicationDetail}</span>
              </div>
            </div>
            <figure className="scene-figure">
              <img src="/assets/icu-scene.svg" alt="Stylised ICU training scene with a patient, AAC display, clinicians and monitoring equipment." />
              <figcaption>Illustrated context only — visual realism is not evidence of clinical indication.</figcaption>
            </figure>
          </section>

          <section className="workstream-section" aria-labelledby="workstreams-title">
            <div className="section-title-row"><h2 id="workstreams-title">Parallel workstreams</h2><span>Clinical + access + systems</span></div>
            <div className="workstream-grid">
              {scenario.workstreams.map((stream) => (
                <article className="workstream-card" key={stream.id}>
                  <span className="workstream-id">{stream.id}</span>
                  <h3>{stream.title}</h3>
                  <p>{stream.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="decision-panel card" aria-labelledby="decision-title">
            <p className="eyebrow">Current decision</p>
            <h2 id="decision-title">{scenario.decisionPrompt}</h2>
            <div className="decision-options">
              {scenario.choices.map((choice) => (
                <label className={`decision-option ${runtime.selectedChoiceId === choice.id ? "selected" : ""}`} key={choice.id}>
                  <input
                    type="radio"
                    name="decision"
                    value={choice.id}
                    checked={runtime.selectedChoiceId === choice.id}
                    onChange={() => setRuntime(selectChoice(runtime, choice.id))}
                  />
                  <span>{choice.label}</span>
                </label>
              ))}
            </div>
            <div className="decision-actions">
              <button type="button" onClick={commitDecision}>Commit decision</button>
              <button type="button" className="secondary" onClick={() => setRuntime(reassess(runtime))}>Reassess</button>
            </div>
            <p className="feedback" role="status" aria-live="polite">{feedback}</p>
          </section>

          <section className="station-section card" aria-labelledby="stations-title">
            <div className="section-title-row">
              <div><p className="eyebrow">Evidence-gated stations</p><h2 id="stations-title">Instrumental action stations</h2></div>
              <span>available → relevant → assigned → committed → applied</span>
            </div>
            <div className="station-grid">
              {stationDefinitions.map((station) => {
                const status = runtime.stations[station.id];
                return (
                  <article className={`station kind-${station.kind}`} key={station.id}>
                    <span className="station-code">{station.id}</span>
                    <h3>{station.label}</h3>
                    <p>{station.purpose}</p>
                    <strong className="station-status">State: {status}</strong>
                    <button type="button" className="secondary" disabled={status === "applied"} onClick={() => setRuntime(advanceStation(runtime, station.id))}>
                      {stationNextLabel(status)}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </section>

        <aside className="state-rail" aria-label="Live clinical, communication and rights state">
          <Card title="Live state">
            <StatusRow label="Airway" value={scenario.clinicalSnapshot.airway} tone="warn" />
            <StatusRow label="Breathing" value={scenario.clinicalSnapshot.breathing} tone="warn" />
            <StatusRow label="Circulation" value={scenario.clinicalSnapshot.circulation} />
            <StatusRow label="Neurology" value={scenario.clinicalSnapshot.neurology} />
            <StatusRow label="Communication" value={`${scenario.clinicalSnapshot.communication} · ${runtime.communication.status}`} tone={communicationTone} />
            <StatusRow label="Agency" value={scenario.clinicalSnapshot.agency} tone="good" />
          </Card>

          <Card title="AAC / access" className="access-card">
            <p><strong>Current response:</strong> {runtime.communication.response.toUpperCase()}</p>
            <p><strong>Reliability:</strong> {runtime.communication.reliability}</p>
            <div className="stack-actions">
              <button type="button" onClick={() => setRuntime(pauseForCommunication(runtime))}>AAC composing / scanning</button>
              <button type="button" className="secondary" onClick={() => setRuntime(restoreCommunication(runtime))}>Restore / confirm access</button>
            </div>
            <p className="small-note">AAC composition pauses evaluation time only. Clinical time continues unless the facilitator pauses the whole simulation.</p>
          </Card>

          <Card title="Personhood guardian" className="guardian-card">
            <StatusRow label="Personhood" value={guardian.PERSONHOOD_STATUS.toUpperCase()} tone={guardian.PERSONHOOD_STATUS === "protected" ? "good" : "warn"} />
            <StatusRow label="Rights / agency" value={guardian.VOICE_AND_AGENCY_CHECK.status.toUpperCase()} tone={guardian.VOICE_AND_AGENCY_CHECK.status === "protected" ? "good" : "warn"} />
            <StatusRow label="Relational" value="SUPPORTER ROLE ONLY" tone="good" />
            <StatusRow label="Mediator" value={guardian.NARRATIVE_PERMISSION.decision} tone={guardian.NARRATIVE_PERMISSION.decision === "CONTINUE" ? "good" : "warn"} />
            {guardian.ACTIVE_GUARDIAN_FLAGS.length > 0 && (
              <div className="guardian-alert"><strong>Repair required</strong><p>{guardian.REQUIRED_REPAIR_ACTIONS.join(" · ")}</p></div>
            )}
          </Card>

          <Card title="Risk watch">
            <ul className="risk-list">{scenario.riskWatch.map((risk) => <li key={risk}>{risk}</li>)}</ul>
          </Card>

          <Card title="Session data" className="data-card">
            <p><strong>Runtime:</strong> memory only</p>
            <p><strong>Platform retention:</strong> none</p>
            <p><strong>Durable output:</strong> user-initiated JSON only</p>
            <div className="stack-actions">
              <button type="button" onClick={exportJson}>Export JSON</button>
              <button type="button" className="danger-outline" onClick={discardSession}>Discard session</button>
            </div>
            <p className="live-message" role="status" aria-live="polite">{message}</p>
          </Card>
        </aside>
      </main>

      <section className="lower-grid" aria-label="Timeline and debrief">
        <Card title="Recent event log">
          <ol className="event-log">
            {[...runtime.events].reverse().slice(0, 12).map((event) => (
              <li key={event.id}><time>{formatTime(event.clinicalSeconds)}</time><span>{event.message}</span></li>
            ))}
            {runtime.events.length === 0 && <li><span>No events yet.</span></li>}
          </ol>
        </Card>
        <Card title="Debrief prompts">
          <ul>{scenario.debrief.map((item) => <li key={item}>{item}</li>)}</ul>
        </Card>
        <Card title="Runtime provenance">
          <p><strong>Version:</strong> {APP_VERSION}</p>
          <p><strong>Scenario:</strong> {scenario.version}</p>
          <p><strong>Seed:</strong> {runtime.seed}</p>
          <p><strong>Commands:</strong> {runtime.commandLog.length}</p>
          <p><strong>Data origin:</strong> fictional_synthetic</p>
        </Card>
      </section>

      <footer className="footer-boundary">
        <strong>Fictional synthetic educational simulation.</strong>
        <span>Patient report is clinical data · access failure ≠ incapacity · supporter ≠ substitute authority · successful intervention ≠ case resolved.</span>
      </footer>
    </div>
  );
}
