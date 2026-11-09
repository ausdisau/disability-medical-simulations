import React,{useReducer} from 'react';
import {ICU_STATIONS,ECG_12_LEADS,ICU_EVIDENCE_SOURCES,createTelemetry,telemetryGate,
 telemetryDispatch,telemetryStatus,telemetrySupervisor} from './icu-telemetry.mjs';
import './icu-telemetry.css';

export default function ICUTelemetryPanel({alexSession}){
 const [s,dispatch]=useReducer(telemetryDispatch,undefined,createTelemetry);
 const selected=ICU_STATIONS.find(x=>x.id===s.selected);
 const supervisor=telemetrySupervisor(s);
 const send=(type,id)=>dispatch({type,id});
 const gate=selected?telemetryGate(s,selected.id):null;
 const canDocument=selected&&gate.allow&&s.checks[selected.id]?.allow&&s.assignments[selected.id];
 return <section id="icu-telemetry" className="card icu-panel" aria-labelledby="icu-telemetry-title">
   <div className="section-heading"><div><small className="eyebrow">AURA · QUALIFIED ICU TELEMETRY WORKFLOW · FICTIONAL</small>
     <h2 id="icu-telemetry-title">Continuous monitoring and temperature-management review</h2></div>
     <span className="tag outline">ED → ICU consultation · Not an ICU admission</span></div>
   <p className="muted">Alex's fever, marked new lethargy and possible serious chest infection prompt urgent clinician-led monitoring. AIRA/VIRGAL does not receive live devices: every ECG signal, repeat core temperature and observation remains <b>not acquired</b> until a reliable authored source is available.</p>
   <div className="icu-vitals" aria-label="Monitoring provenance">
    <div className="icu-vital icu-known">
      <small>Known temperature · initial ED spot observation</small><strong>39.4°C</strong>
      <span>Fictional; not a core sensor or continuous trend</span>
    </div>
    <div className="icu-vital"><small>Continuous rhythm telemetry</small><strong>Not acquired</strong><span>No connected ECG stream; no rhythm inference</span></div>
    <div className="icu-vital"><small>12-lead diagnostic ECG</small><strong>Not acquired</strong><span>Only recorded and interpreted if indicated</span></div>
    <div className="icu-vital"><small>Core-temperature monitoring</small><strong>Not connected</strong><span>No validated probe or subsequent core values</span></div>
    <div className="icu-vital"><small>Blood pressure / perfusion</small><strong>Unknown</strong><span>No confirmed shock or circulatory response</span></div>
    <div className="icu-vital"><small>Chilled IV fluid / ice packs</small><strong>Not applied</strong><span>Cooling interventions not authorised</span></div>
   </div>
   <div className="icu-monitors">
     <div className="icu-monitor" role="group" aria-label="Continuous ECG telemetry signal">
       <div className="icu-monitor-top"><strong>Rhythm monitor</strong><span>Lead signal: NOT ACQUIRED</span></div>
       <div className="icu-black"><span>NO VERIFIED ECG SIGNAL</span><small>No waveform displayed: lack of a feed is not asystole</small></div>
       <p>Three- or five-lead bedside telemetry is not equivalent to a diagnostic 12-lead ECG. Actual rhythm, rate, artefact and QT/ST assessments need validated recordings and qualified interpretation.</p>
     </div>
     <div className="icu-monitor" role="group" aria-label="12 lead ECG grid showing no acquired results">
       <div className="icu-monitor-top"><strong>12-lead ECG</strong><span>Acquisition: PENDING CLINICAL INDICATION</span></div>
       <div className="icu-leads">
        {ECG_12_LEADS.map(lead=><div key={lead} className="icu-lead">
         <strong>{lead}</strong><span>Not acquired</span>
        </div>)}
       </div>
       <p>All 12 lead labels are represented for training. No cardiac disease, ST changes or arrhythmia is invented.</p>
     </div>
   </div>
   <div className="icu-temp-area">
     <div className="icu-temp-panel">
       <div className="section-heading"><h3>Core-temperature trend and source validity</h3><span className="tiny">One authored ED observation · no core feed</span></div>
       <svg viewBox="0 0 460 160" width="100%" role="img" aria-label="Illustrative measurement timeline: one initial ED spot temperature of 39.4 degrees Celsius. No later or continuous core temperature measurements exist.">
         <rect x="1" y="1" width="458" height="158" rx="10" fill="#f6f9fb" stroke="#d9e4eb"/>

         <line x1="48" y1="126" x2="425" y2="126" stroke="#8298a6" strokeWidth="1.5"/>
         <line x1="48" y1="23" x2="48" y2="126" stroke="#8298a6" strokeWidth="1.5"/>
         <circle cx="90" cy="60" r="5" fill="#9d3b3b"/>
         <text x="104" y="55" fontSize="13" fill="#733333" fontWeight="700">39.4°C triage</text>
         <text x="104" y="72" fontSize="11" fill="#526b7c">Synthetic spot measurement</text>
         <line x1="96" y1="105" x2="420" y2="105" stroke="#acb8c2" strokeWidth="1" strokeDasharray="5 6"/>
         <text x="200" y="96" fontSize="11" fill="#536c7c">No continuous core readings</text>
         <text x="52" y="147" fontSize="11" fill="#536c7c">Initial triage</text>
         <text x="315" y="147" fontSize="11" fill="#536c7c">Later: unknown</text>
       </svg>
       <p className="icu-temp-description">Initial triage: <strong>39.4°C</strong> (fictional spot reading). Repeat temperature: <b>not documented</b>. Continuous core temperature: <b>unavailable</b>. A live trend and treatment titration cannot be derived from a single observation.</p>
     </div>
     <div className="icu-temp-panel">
       <h3>Monitoring decisions</h3>
       <p><b>Indication:</b> High fever and marked new lethargy warrant urgent qualified review. Precise core monitoring is conditional on need and measurement method.</p>
       <p><b>Temperature therapy:</b> The 2026 Surviving Sepsis Campaign suggests against routine antipyretic or surface-cooling therapy solely to improve clinical outcomes in sepsis.</p>
       <p><b>Infusion:</b> IV crystalloid for hypoperfusion is a distinct prescriber-led decision; chilled saline is not interchangeable with volume resuscitation.</p>
       <p><b>Access:</b> Monitor placement should not obstruct Alex's established AAC and skin/positioning needs.</p>
     </div>
   </div>
   <div className="icu-action-section">
     <div className="section-heading"><h3>Monitoring and high-risk intervention tray</h3><small className="eyebrow">SELECT → EVIDENCE GATE → ASSIGN → DOCUMENT → REASSESS</small></div>
     <div className="icu-stations">{ICU_STATIONS.map(station=>{
      const status=telemetryStatus(s,station.id),held=!telemetryGate(s,station.id).allow;
      return <button type="button" key={station.id} aria-pressed={s.selected===station.id}
         className={'icu-station '+(held?'held ':'')+(s.selected===station.id?'selected':'')}
         onClick={()=>send('SELECT',station.id)}>
        <strong>{station.title}</strong><small>{status.replaceAll('_',' ')}</small>
      </button>;
     })}</div>
     {selected&&<div className="icu-station-detail" aria-live="polite">
       <div className="section-heading"><h4>{selected.title}</h4>
         <span className={'icu-gate '+(gate.allow?'open':'hold')}>{gate.status.replaceAll('_',' ')}</span>
       </div>
       <p><b>Purpose:</b> {selected.purpose}</p><p><b>Clinical trigger:</b> {selected.indication}</p>
       <p><b>Clinical role:</b> {selected.owner}</p>
       <p><b>Reassessment:</b> {selected.reassess}</p>
       <p><b>Failure/rescue:</b> {selected.failure}</p>
       <p className="icu-warning"><b>Evidence gate:</b> {gate.reason}</p>
       <div className="controls">
        <button className="btn" type="button" onClick={()=>send('CHECK',selected.id)}>Check evidence</button>
        <button className="btn" type="button" disabled={!s.checks[selected.id]?.allow} onClick={()=>send('ASSIGN',selected.id)}>Assign assessment</button>
        <button className="btn filled" type="button" disabled={!canDocument} onClick={()=>send('DOCUMENT',selected.id)}>Document review request</button>
        <button className="btn" type="button" disabled={!s.documented.includes(selected.id)} onClick={()=>send('REASSESS',selected.id)}>Reassess</button>
       </div>
     </div>}
     <p className="icu-notice" role="status" aria-live="polite">{s.notice}</p>
   </div>
   <div className="icu-bottom">
    <div className="icu-summary">
     <h3>JMO supervisor · read-only</h3>
     <p>{supervisor.question}</p>
     <p className="muted">Alex's case remains {alexSession?.clinical?.sepsis||'suspected risk / not confirmed'}. A monitor connection or fever reading cannot establish sepsis, shock, a cardiac arrhythmia or capacity.</p>
     <p><b>Guardian decision:</b> Hold automated temperature titration and all cooling intervention commits; continue qualified assessment, urgent sepsis review, clinical comfort planning and communication access.</p>
    </div>
    <div className="icu-summary">
     <h3>Telemetry event history</h3>
     <button type="button" className="btn" onClick={()=>send('RESET')}>Reset monitoring review</button>
     {s.ledger.length===0?<p className="muted">No monitoring-review actions have been documented.</p>:
       <ol>{[...s.ledger].reverse().slice(0,8).map(e=><li key={e.id}><b>{e.type}</b> {e.station||'Monitor'}: {e.text}</li>)}</ol>}
     <p><b>External clinical sources:</b></p>
     <ul>{ICU_EVIDENCE_SOURCES.map(x=><li key={x.id}><a href={x.url} target="_blank" rel="noopener noreferrer">{x.title}</a></li>)}</ul>
    </div>
   </div>
   <p className="icu-disclaimer">SIMULATION ONLY — NOT A VALID PRESCRIPTION, TREATMENT ORDER OR DEVICE INTERFACE. No automatic IV fluids, ice packs, invasive probe insertion, cardiac diagnosis or temperature targeting. Local NSW protocols, clinical review and disability-led accessibility approval are pending.</p>
 </section>;
}