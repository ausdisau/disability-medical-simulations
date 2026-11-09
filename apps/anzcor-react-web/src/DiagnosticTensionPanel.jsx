import React,{useState} from 'react';
import {ETIOLOGIES,createDifferential,evidenceRevealGate,authorDifferential,medicationGateForDifferential,diagnosticCoaching} from './infection-differential.mjs';

export default function DiagnosticTensionPanel({session}){
 const [state,setState]=useState(createDifferential);
 const [facilitator,setFacilitator]=useState(false);
 const [chosen,setChosen]=useState('viral-supported');
 const [notice,setNotice]=useState('Evidence is not yet released. Viral, bacterial, mixed infection and aspiration explanations all remain open.');
 const gate=evidenceRevealGate(session,chosen);
 const branch=state.revealed;
 const coaching=diagnosticCoaching(state);
 const meds=medicationGateForDifferential(state,session,'antimicrobial_or_antiviral');
 function reveal(){
  const r=authorDifferential(state,session,chosen,facilitator?'FACILITATOR':'JMO');
  if(r.ok)setState(r.state);setNotice(r.reason);
 }
 function reset(){setState(createDifferential());setNotice('Synthetic evidence fork reset. Alex clinical findings and intervention history are unchanged.');}
 return <section className="alex-differential" aria-labelledby="alex-differential-title">
  <div className="section-heading"><div><small className="eyebrow">PATHOGEN-UNCERTAINTY ENGINE · EDUCATIONAL FORKS</small>
   <h3 id="alex-differential-title">Diagnostic tension: what is causing the chest illness?</h3></div>
   <span className="tag outline">No laboratory results yet</span>
  </div>
  <p>Viruses are microorganisms. The clinical alternatives are viral infection, bacterial infection, possible co-infection, and aspiration-related inflammation or infection. Fever and marked lethargy create urgency but cannot resolve the cause on their own.</p>
  <div className="alex-hypotheses">
   {ETIOLOGIES.map(h=><div key={h.id}><strong>{h.label}</strong><p>{h.hypothesis}</p>
     <small>Do not assume: {h.ambiguity}</small></div>)}
  </div>
  <div className="alex-differential-gate">
    <div className="alex-training-select">
     <label className="review-label" htmlFor="etiology-branch">Facilitator-authored synthetic evidence alternative</label>
     <select className="review-input" id="etiology-branch" value={chosen} onChange={e=>setChosen(e.target.value)}>
      {ETIOLOGIES.map(b=><option key={b.id} value={b.id}>{b.label}</option>)}
     </select>
     <label className="alex-facilitator-switch">
      <input type="checkbox" checked={facilitator} onChange={e=>setFacilitator(e.target.checked)}/>
      Educational facilitator mode (not credential verification)
     </label>
     <div className="controls">
      <button className="btn filled" type="button" disabled={!facilitator||!gate.allow} onClick={reveal}>Reveal fictional investigation findings</button>
      <button className="btn" type="button" onClick={reset}>Reset findings</button>
     </div>
     <p className="muted">{gate.reason}</p>
    </div>
    <div className="alex-differential-warning">
      <strong>Urgent clinical pathway stays active</strong>
      <p>Do not delay qualified A–G assessment, senior escalation or possible sepsis management while waiting to determine the pathogen. Culture collection should not delay indicated care.</p>
      <p>Medication guardian: {meds.status.replaceAll('_',' ')}. No antibiotic, antiviral, dose, route or administration is authorised by this teaching panel.</p>
    </div>
  </div>
  <p className="alex-diff-notice" role="status" aria-live="polite">{notice}</p>
  {branch?<div className="alex-results" aria-live="polite">
    <h4>New fictional evidence — {branch.label}</h4>
    <p><strong>Hypothesis:</strong> {branch.hypothesis}</p>
    <div className="alex-results-table">
     {branch.evidence.map(e=><div key={e.name}><strong>{e.name}</strong><span>{e.finding}</span><small>{e.certainty.replaceAll('_',' ')}</small></div>)}
    </div>
    <p><b>Residual uncertainty:</b> {branch.ambiguity}</p>
    <p><b>Treatment decision pathway for qualified team:</b> {branch.pathway}</p>
    <p><b>Next reassessment:</b> {branch.reassess}</p>
    <p className="alex-note"><strong>Authority remains separate:</strong> {branch.actionAuthority}</p>
    <p><b>JMO supervisory prompt:</b> {coaching.question}</p>
   </div>:<div className="alex-results">
    <strong>JMO supervisory prompt</strong><p>{coaching.question}</p>
    <p className="muted">To open a synthetic investigation-result alternative, first document and reassess OBS (urgent observations) and CHEST (source evaluation), then activate teaching facilitator mode. These are local educational gates, not medical credentials.</p>
   </div>}
 </section>;
}