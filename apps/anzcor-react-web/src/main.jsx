import React, {useMemo,useReducer,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ACTIONS, CASE, CBCP, createAURA, dispatchAURA, clockText, gate, stationStatus, MAIRA_readonly, mediation} from './runtime.mjs';
import './style.css';
import EvidenceDesk from './EvidenceDesk.jsx';
import ReviewBoard from './ReviewBoard.jsx';
import AlexInfectionPanel from './AlexInfectionPanel.jsx';

const badgeFor = s => s==='locked_by_evidence'?'locked':s==='reassessed'?'complete':s==='committed'?'pending':s;
function App(){
  const [state,dispatch]=useReducer(dispatchAURA,undefined,createAURA);
  const [tab,setTab]=useState('stations');
  const [group,setGroup]=useState('All');
  const [largeText,setLargeText]=useState(false);
  const [lowSensory,setLowSensory]=useState(false);
  const [showSupervisor,setShowSupervisor]=useState(true);
  const [showGuardians,setShowGuardians]=useState(true);
  const [feedback,setFeedback]=useState('Simulation starts paused. No real clinical authority or devices.');
  const chosen=ACTIONS.find(a=>a.id===state.selected);
  const supervisor=useMemo(()=>MAIRA_readonly(state),[state]);
  const guardian=useMemo(()=>mediation(state,state.selected||'rhythm'),[state]);
  const groups=['All',...new Set(ACTIONS.map(a=>a.group))];
  const visible=ACTIONS.filter(a=>(group==='All'||a.group===group));
  function send(kind,id,role){dispatch({kind,id,role});}
  function exportLedger(){
    const file=new Blob([JSON.stringify({case:CASE,state,exportedAt:'export-on-demand',syntheticOnly:true},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(file);
    const link=document.createElement('a');link.href=url;link.download='aura-rohan-fictional-session.json';link.click();URL.revokeObjectURL(url);
    setFeedback('Synthetic session exported locally. No remote persistence.');
  }
  return <div className={['app',largeText?'large':'',lowSensory?'quiet':''].join(' ')}>
    <a className="skip" href="#main">Skip to simulation content</a>
    <header className="mast">
      <div className="brand"><span className="monogram" aria-hidden="true">A</span><div><strong>AURA</strong><small>Project Hope · Intervention-Level Environment</small></div></div>
      <div className="mast-right"><span className="tag synthetic">FICTIONAL / SYNTHETIC</span><span className="tag critical">CODE BLUE · {state.clinical.rhythm}</span><strong className="clock">{clockText(state.clock)}</strong></div>
    </header>
    <div className="topline"><strong>Rohan Malik</strong><span>Age 12 · Duchenne muscular dystrophy · NSW PICU</span><span className="tag outline">NON-CANONICAL BRANCH</span></div>
    <main id="main" className="cockpit">
      <section className="main-column">
        <div className="card primary-scene">
          <div className="section-heading"><div><small className="eyebrow">LIVE CASE STATE</small><h1>{state.phase==='ARREST'?'Non-shockable cardiac arrest':state.phase==='POST_ROSC'?'Post-arrest reassessment':'Beyond resuscitation · PICU continuity'}</h1></div><span className="tag outline">{state.running?'RUNNING / EXPLICIT STEPS':'PAUSED'}</span></div>
          <p className="scene-copy">{state.phase==='ARREST'?'Confirmed asystole after PEA, without independently established circulation. Qualified clinicians continue CPR and provisional supraglottic rescue ventilation. No laboratory results or numerical physiological observations are inferred.':state.phase==='POST_ROSC'?'Explicit facilitator-authored alternate ROSC branch. Dependable spontaneous circulation has been confirmed within this synthetic teaching branch; organ outcomes and recovery remain unknown.':'Ongoing high-acuity PICU review, rehabilitation readiness and seven braided-care strands. Rohan\'s communication and disability baseline are retained.'}</p>
          <div className="state-grid">
            <div><small>Rhythm</small><strong>{state.clinical.rhythm}</strong></div>
            <div><small>Circulation</small><strong>{state.clinical.spontaneousCirculation?'Clinician-confirmed ROSC':'Not established'}</strong></div>
            <div><small>CPR</small><strong>{state.clinical.cpr}</strong></div>
            <div><small>Airway</small><strong>{state.clinical.airway}</strong></div>
            <div><small>Oxygenation</small><strong>{state.clinical.oxygenation}</strong></div>
            <div><small>AAC: latest reliable</small><strong className="wait">WAIT</strong></div>
          </div>
          <p role="status" aria-live="polite" className="notice">{state.notice}</p>
        </div>
        <div className="toolbar card">
          <div><strong>Simulation transport</strong><small>Only explicit actions advance the synthetic clock. Reading and accessible navigation do not.</small></div>
          <div className="controls">
            <button className="btn filled" onClick={()=>send(state.running?'PAUSE':'RUN')}>{state.running?'Pause':'Run'}</button>
            <button className="btn" disabled={!state.running} onClick={()=>dispatch({kind:'STEP',seconds:5})}>Step +5s</button>
            <button className="btn" onClick={exportLedger}>Export ledger</button>
            <button className="btn subtle" onClick={()=>send('RESET')}>Reset</button>
          </div>
        </div>
        <div className="card station-area">
          <div className="section-heading"><div><small className="eyebrow">ACTION STATIONS</small><h2>Intervention tray</h2></div><span className="tiny">Inspect → Check → Assign → Commit → Reassess</span></div>
          <div className="chip-row" aria-label="Filter stations">{groups.map(g=><button key={g} type="button" className={'chip '+(group===g?'active':'')} aria-pressed={group===g} onClick={()=>setGroup(g)}>{g}</button>)}</div>
          <div className="station-list">{visible.map(a=>{
            const status=stationStatus(state,a.id),selected=state.selected===a.id;
            return <button key={a.id} className={'station '+(selected?'selected':'')} onClick={()=>send('SELECT',a.id)} aria-pressed={selected}>
              <span><strong>{a.title}</strong><small>{a.owner}</small></span>
              <span className={'station-status '+badgeFor(status)}>{status.replaceAll('_',' ')}</span>
            </button>
          })}</div>
          {chosen&&<div className="detail" aria-live="polite"><div className="section-heading"><h3>{chosen.title}</h3><span className={'station-status '+badgeFor(stationStatus(state,chosen.id))}>{stationStatus(state,chosen.id).replaceAll('_',' ')}</span></div>
            <p><b>Assigned authority:</b> {chosen.owner}</p>
            <p><b>Evidence gate:</b> {gate(state,chosen.id).why}</p>
            <div className="controls">
              <button className="btn" onClick={()=>send('CHECK',chosen.id)}>Check evidence</button>
              <button className="btn" onClick={()=>send('ASSIGN',chosen.id)} disabled={!state.checked[chosen.id]?.allow}>Assign qualified role</button>
              <button className="btn filled" onClick={()=>send('COMMIT',chosen.id)} disabled={!state.running||!state.assigned[chosen.id]||!gate(state,chosen.id).allow}>Commit simulated action</button>
              <button className="btn" onClick={()=>send('REASSESS',chosen.id)} disabled={!state.completed.includes(chosen.id)}>Reassess</button>
            </div>
          </div>}
        </div>
      </section>
      <aside className="side-column">
        <section className="card access"><small className="eyebrow">PROTECTED PATIENT INSTRUCTION</small><div className="aac-word">WAIT</div><p>Latest reliable patient-authored message. No silence-to-consent, no invented final message.</p><div className="mini-line"><span>Family-support nurse</span><strong>ASSIGNED</strong></div><div className="mini-line"><span>Family</span><strong>Samira · Arvind</strong></div></section>
        <section className="card"><div className="section-heading"><h2>JMO supervision · MAIRA</h2><button className="textbtn" aria-expanded={showSupervisor} onClick={()=>setShowSupervisor(!showSupervisor)}>{showSupervisor?'Hide':'Show'}</button></div>
          {showSupervisor&&<><small className="eyebrow">READ-ONLY ADVISORY</small><p><b>Supervisor question:</b> {supervisor.question}</p><p className="muted">{supervisor.suggestion}</p><small className="eyebrow">UNRESOLVED</small><ul>{supervisor.unknown.map(x=><li key={x}>{x}</li>)}</ul></>}
        </section>
        <section className="card"><div className="section-heading"><h2>Guardian Mediator</h2><button className="textbtn" aria-expanded={showGuardians} onClick={()=>setShowGuardians(!showGuardians)}>{showGuardians?'Hide':'Show'}</button></div>
          {showGuardians&&<><div className={'guardian-state '+(guardian.status==='HOLD_BRANCH'?'hold':'')}>{guardian.status}</div><p>{guardian.branchFrozen.length?'Affected branch held: '+guardian.branchFrozen.join(', '):'Educational assessment permitted with rights and protocol safeguards.'}</p><small>Clinical: {guardian.clinical}</small><small>Rights: {guardian.rights}</small><small>Personhood: {guardian.personhood}</small><small>Pharmacology: {guardian.pharmacology}</small></>}
        </section>
        <section className="card"><div className="section-heading"><h2>Learning controls</h2></div>
          <label className="option"><input type="checkbox" checked={largeText} onChange={e=>setLargeText(e.target.checked)}/> Larger type</label>
          <label className="option"><input type="checkbox" checked={lowSensory} onChange={e=>setLowSensory(e.target.checked)}/> Reduced visual intensity</label>
          <label htmlFor="role">Role / supervision</label>
          <select id="role" value={state.role} onChange={e=>send('ROLE',null,e.target.value)}><option value="JMO">JMO · supervised learner</option><option value="FACILITATOR">Facilitator · synthetic outcome authority</option></select>
        </section>
      </aside>
    </main>
    <div className="lower">
      <AlexInfectionPanel/>
      <EvidenceDesk/>
      <ReviewBoard/>
      <section className="card">
        <div className="section-heading"><h2>Case continuity and teaching paths</h2><span className="tiny">Requires verified prerequisites</span></div>
        <div className="continuity">
          <div><strong>Cardiac arrest</strong><p>Current: confirmed asystole. Never infer death or survival from a flatline.</p></div>
          <div><strong>Post-ROSC</strong><p>Requires explicit facilitator-authored circulation findings after airway and perfusion reassessment.</p></div>
          <div><strong>Beyond ICU</strong><p>Requires post-arrest review and AAC reassessment before proceeding to continuity planning.</p></div>
        </div>
        {state.role==='FACILITATOR'&&<div className="controls facilitator"><button className="btn" onClick={()=>send('FACILITATOR_ROSC',null,'FACILITATOR')}>Author synthetic ROSC (gated)</button><button className="btn" onClick={()=>send('FACILITATOR_PICU',null,'FACILITATOR')}>Begin PICU continuity (gated)</button></div>}
      </section>
      <section className="card"><div className="section-heading"><h2>Braided care · seven strands</h2><small className="eyebrow">PROPOSED FRAMEWORK, NOT NSW HEALTH POLICY</small></div><div className="strands">{CBCP.map(([code,title,owner])=><div key={code}><strong className="strand-code">{code}</strong><span><b>{title}</b><small>{owner}</small></span></div>)}</div></section>
      <section className="card ledger"><div className="section-heading"><h2>VIRGAL · event ledger</h2><small className="eyebrow">APPEND-ONLY SYNTHETIC LOG</small></div>{state.ledger.length===0?<p className="muted">No learner actions committed yet. Clinical facts are frozen to the authored starting state.</p>:<ol>{[...state.ledger].reverse().slice(0,24).map(e=><li key={e.id}><time>{e.time}</time><strong>{e.type}</strong><span>{e.text}</span></li>)}</ol>}</section>
    </div>
    <footer>Project Hope educational prototype · No live patient data, prescriptions, devices, clinical certification or production deployment. Clinical, accessibility and disability-led review pending.</footer>
    <div className="sr-only" role="status" aria-live="polite">{feedback}</div>
  </div>
}
createRoot(document.getElementById('root')).render(<App/>);
