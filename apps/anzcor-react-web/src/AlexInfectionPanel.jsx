import React,{useReducer,useState} from 'react';
import seed from '../content/scenarios/cerebral-palsy-respiratory-aac-v01.json';
import {createAlexSession,alexDispatch,alexClock,alexGate,alexStationStatus,alexSnapshot} from './alex-infection.mjs';
import DiagnosticTensionPanel from './DiagnosticTensionPanel.jsx';
import ICUTelemetryPanel from './ICUTelemetryPanel.jsx';
import './alex-infection.css';

const niceStatus={AVAILABLE:'Available',SELECTED:'Selected',CHECKED:'Evidence checked',ASSIGNED:'Assigned',DOCUMENTED:'Documented',REASSESSED:'Reassessed',LOCKED_BY_PROTOCOL:'Protocol hold'};
const beatIds=['febrile-triage','access','assessment','possible-sepsis','icu-monitoring-review','infection-source','shared_decision','reassessment','handover'];
function exportAlex(s){
 const json=JSON.stringify({source:'AURA synthetic educational scenario',scenarioId:seed.scenarioId,revision:seed.scenarioRevision,
  case:seed,session:s,clinicalAuthority:false,realPatientData:false},null,2);
 const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='aura-alex-fever-chest-infection.json';a.click();URL.revokeObjectURL(url);
}
export default function AlexInfectionPanel(){
 const [s,dispatch]=useReducer((old,action)=>alexDispatch(old,seed,action),undefined,()=>createAlexSession(seed));
 const [beatId,setBeatId]=useState('febrile-triage');
 const selected=seed.interventionStations.find(a=>a.id===s.selected);
 const beat=seed.beats.find(b=>b.id===beatId);
 const snapshot=alexSnapshot(s);
 const action=(kind,id,seconds)=>dispatch({kind,id,seconds});
 const canDocument=selected&&s.running&&s.checked[selected.id]?.allow&&s.assigned[selected.id]&&alexGate(s,seed,selected.id).allow;
 return <section id="alex-infection" aria-labelledby="alex-infection-title" className="card alex-infection">
  <div className="section-heading">
   <div><small className="eyebrow">AURA · INDEPENDENT FICTIONAL ADULT NSW ED CASE</small><h2 id="alex-infection-title">Alex Morgan — Chest infection, high fever and marked lethargy</h2></div>
   <span className="tag critical">Urgent assessment · Synthetic</span>
  </div>
  <p className="muted">Separate from Rohan Malik's paediatric Code Blue. Chest infection is the working diagnosis; pneumonia, sepsis and the infectious cause remain unconfirmed.</p>
  <div className="alex-facts" aria-label="Fictional ED presentation">
    <div className="alex-major"><small>Temperature · fictional triage measurement</small><strong>39.4°C</strong><small>High fever · repeat measurement pending</small></div>
    <div className="alex-major"><small>Alertness change</small><strong>Marked lethargy</strong><small>New change · consciousness not yet assessed</small></div>
    <div><small>Working diagnosis</small><strong>Chest infection</strong><small>Organism and pneumonia not confirmed</small></div>
    <div><small>Possible sepsis</small><strong>Assessment required</strong><small>Shock or organ injury not established</small></div>
    <div><small>Respiratory rate and oxygenation</small><strong>Not verified</strong><small>Do not assume normal or abnormal</small></div>
    <div><small>Communication</small><strong>Slower with fatigue</strong><small>No incapacity inference</small></div>
  </div>
  <div className="alex-grid">
   <div>
    <div className="alex-scene">
     <label className="review-label" htmlFor="alex-beat">Clinical scene (viewing does not advance patient state)</label>
     <select id="alex-beat" className="review-input" value={beatId} onChange={e=>setBeatId(e.target.value)}>
      {beatIds.map(id=>{const b=seed.beats.find(x=>x.id===id);return <option key={id} value={id}>{b?.phase} · {id.replaceAll('-',' ')}</option>})}
     </select>
     <p className="alex-narrative">{beat?.visible}</p>
     <small className="eyebrow">JMO DISCUSSION OPTIONS — DO NOT AUTHOR A TREATMENT</small>
     <ul>{beat?.options.map(o=><li key={o}>{o}</li>)}</ul>
     {beat?.cues&&<p className="alex-note">{beat.cues.join(' ')}</p>}
    </div>
    <div className="alex-intervention">
     <div className="section-heading"><h3>Intervention-level stations</h3><small className="eyebrow">SELECT → CHECK → ASSIGN → DOCUMENT → REASSESS</small></div>
     <div className="alex-stations">{seed.interventionStations.map(a=><button type="button" key={a.id} aria-pressed={s.selected===a.id}
       className={'alex-station '+(s.selected===a.id?'chosen':'')} onClick={()=>action('SELECT',a.id)}>
       <strong>{a.title}</strong><small>{niceStatus[alexStationStatus(s,seed,a.id)]}</small>
      </button>)}</div>
     {selected&&<div className="alex-station-details">
      <h3>{selected.title}</h3><p><b>Trigger:</b> {selected.trigger}</p>
      <p><b>Evidence:</b> {selected.evidenceGate}</p>
      <p><b>Responsible clinical team:</b> {selected.assignedWorkstream}</p>
      <p><b>Educational consequence:</b> {selected.actionConsequence}</p>
      <p><b>Reassessment:</b> {selected.reassessment}</p>
      <p><b>Rescue route:</b> {selected.failureOrRescue}</p>
      <p className="alex-note"><b>Gate:</b> {alexGate(s,seed,selected.id).reason}</p>
      <div className="controls">
       <button className="btn" onClick={()=>action('CHECK',selected.id)}>Check evidence</button>
       <button className="btn" disabled={!s.checked[selected.id]?.allow} onClick={()=>action('ASSIGN',selected.id)}>Assign team</button>
       <button className="btn filled" disabled={!canDocument} onClick={()=>action('COMMIT',selected.id)}>Document training action</button>
       <button className="btn" disabled={!s.completed.includes(selected.id)} onClick={()=>action('REASSESS',selected.id)}>Reassess</button>
      </div>
     </div>}
    </div>
   </div>
   <aside className="alex-side">
    <div className="alex-clock"><strong>Teaching clock</strong><span>{alexClock(s.clock)}</span>
     <p>Time advances only when explicitly stepped. Reading, switch scanning and AAC input never consume clinical simulation time.</p>
     <div className="controls">
      <button className="btn filled" onClick={()=>action(s.running?'PAUSE':'RUN')}>{s.running?'Pause':'Run'}</button>
      <button className="btn" disabled={!s.running} onClick={()=>action('STEP',null,5)}>Step +5s</button>
      <button className="btn" onClick={()=>{action('RESET');setBeatId('febrile-triage');}}>Reset</button>
      <button className="btn" onClick={()=>exportAlex(s)}>Export ledger</button>
     </div>
    </div>
    <p className="alex-notice" role="status" aria-live="polite">{s.notice}</p>
    <div className="alex-care">
     <h3>Clinical priorities + patient agency</h3>
     <p><b>Urgency:</b> Full urgent A–G observations and qualified senior/CERS review for possible serious infection.</p>
     <p><b>Access:</b> {s.access.communicationSupport.replaceAll('_',' ').toLowerCase()}; no new message or consent inferred.</p>
     <p><b>Patient:</b> Speak directly to Alex; distinguish lethargy from decision-specific capacity.</p>
     <p><b>Medication:</b> Assessment and prescriber review only. No antibiotic or antiviral administration is generated.</p>
    </div>
    <div className="alex-care">
     <h3>Current uncertainties</h3>
     <ul>{snapshot.unresolved.map(u=><li key={u}>{u}</li>)}</ul>
     <a href="https://aci.health.nsw.gov.au/ecat/adult/sepsis" target="_blank" rel="noopener noreferrer">NSW Adult ECAT — suspected sepsis</a>
     <a href="https://cec.health.nsw.gov.au/safety-essentials/deterioration/sepsis" target="_blank" rel="noopener noreferrer">NSW sepsis pathways</a>
    </div>
    <div className="alex-ledger">
     <h3>Alex-specific event ledger</h3>
     {s.ledger.length===0?<p className="muted">No actions yet; fever and lethargy are authored synthetic starting facts.</p>:
     <ol>{[...s.ledger].reverse().slice(0,12).map(e=><li key={e.id}><time>{e.time}</time><strong>{e.type}</strong><span>{e.station||'—'}: {e.detail}</span></li>)}</ol>}
    </div>
   </aside>
  </div>
  <DiagnosticTensionPanel session={s}/>
  <ICUTelemetryPanel alexSession={s}/>
  <p className="alex-footer">Adult fictional educational training only. Not an authorised prescription, real patient simulation or verified sepsis pathway. Clinical, pharmacology, disability-led and accessibility reviews pending.</p>
 </section>;
}