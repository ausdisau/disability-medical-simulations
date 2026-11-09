import React,{useState} from 'react';
import {CASCADE_WORKSTREAMS} from './cascade-engine.mjs';
import {alexClock} from './alex-infection.mjs';
import './cascade-crisis.css';

/** Director-only fictional crisis playback. Buttons never issue clinical orders. */
export default function CascadeCrisisPanel({session,dispatch}){
 const [nextSeed,setNextSeed]=useState(0);
 const [showProvenance,setShowProvenance]=useState(false);
 const crisis=session.crisis;
 const running=crisis?.status==='ACTIVE'&&session.running;
 const recorded=crisis?.observations??[];
 const action=(kind,id)=>dispatch({kind,id});
 const chooseNewSeed=()=>setNextSeed(Math.floor(Math.random()*999999999)+1);
 return <section className="cascade-panel" aria-labelledby="cascade-title">
  <div className="section-heading">
    <div><small className="eyebrow">AURA · SIMULATION DIRECTOR / NON-CLINICIAN</small>
    <h3 id="cascade-title">Unpredictable cascade crisis</h3></div>
    <span className={'cascade-label '+(crisis?'active':'idle')}>{crisis?crisis.status.replaceAll('_',' '):'NOT TRIGGERED'}</span>
  </div>
  <p>Introduce bounded, clinically plausible surprises across respiration, monitor reliability, perfusion and communication access. All new evidence is fictional, source-labelled and recorded by the Alex simulation controller. Nothing here administers medication, applies cooling, treats the patient or predicts an outcome.</p>
  {!crisis?<div className="cascade-trigger">
    <p><strong>Simulation clock: {alexClock(session.clock)}</strong>. Choose the scripted demonstration seed (0) or generate a new reproducible variant. The seed changes which evidence emerges, never the patient's inherent worth, prognosis or treatment entitlement.</p>
    <div className="controls">
     <button className="btn filled" type="button" onClick={()=>dispatch({kind:'TRIGGER_CASCADE',crisisSeed:nextSeed})}>Trigger cascade crisis</button>
     <button className="btn" type="button" onClick={chooseNewSeed}>New variation seed</button>
    </div>
    <p className="cascade-seed">Provenance seed: <code>{nextSeed}</code>{nextSeed===0?' · Demonstration sequence':' · Reproducible alternative'}</p>
  </div>:<div className="cascade-playback">
   <div className="cascade-progress">
    <div><strong>Clinical clock: {alexClock(session.clock)}</strong><small>{crisis.name}</small></div>
    <div><strong>{crisis.index} of {crisis.total} cues observed</strong><small>Seed {crisis.seed} · replayable</small></div>
   </div>
   <div className="controls">
     <button className="btn filled" type="button" disabled={!running} onClick={()=>action('NEXT_CASCADE')}>Reveal next crisis cue</button>
     <button className="btn" type="button" disabled={!session.running} onClick={()=>action('PAUSE')}>Facilitator pause</button>
     <button className="btn" type="button" disabled={session.running} onClick={()=>action('RUN')}>Resume clinical simulation</button>
     <button className="btn" type="button" aria-expanded={showProvenance} onClick={()=>setShowProvenance(!showProvenance)}>{showProvenance?'Hide':'Show'} evidence sources</button>
   </div>
   <ol className="cascade-events" aria-label="Only observed fictional crisis cues">
   {recorded.map((e,i)=><li key={e.id+'-'+i} className={'cascade-event '+e.domain}>
     <div><time>{e.simTime}</time><strong>{e.domain==='access'?'Communication':e.domain==='system'?'Monitoring system':'Clinical change'}</strong></div>
     <p>{e.detail}</p>
     <p><b>Known:</b> {e.known}</p>
     <p><b>Still unknown:</b> {e.unknown}</p>
     {showProvenance&&<small><b>Source:</b> {e.source} · Fictional authored event; not medical evidence</small>}
    </li>)}
   </ol>
   {crisis.status==='DECISION_HOLD'&&<p className="cascade-hold" role="status">All four cues have been authored. The teaching clock is paused at the decision point. No arrest, sepsis diagnosis, treatment, improvement or death has been inferred.</p>}
  </div>}
  <div className="cascade-response">
    <h4>Parallel qualified-team response paths</h4>
    <p className="muted">Select a workstream below, then use the existing evidence-gated intervention tray to check, assign, document and reassess. Clicking here is not an emergency order.</p>
    <div className="cascade-response-grid">{CASCADE_WORKSTREAMS.map(w=><button key={w.id} type="button" className="cascade-workstream" onClick={()=>action('SELECT',w.id)}>
      <strong>{w.name}</strong><small>{w.owner}</small><span>Select station: {w.id}</span>
    </button>)}</div>
  </div>
  <p className="cascade-limits">Rights and clinical boundaries: no disability-based treatment limit, no assumed incapacity from slowed AAC, no patient-authored words invented. A signal artefact is not a verified arrhythmia. One low BP reading is not itself a confirmed sepsis or shock diagnosis. High-risk interventions remain subject to qualified clinicians and actual local protocols.</p>
 </section>;
}