import React,{useState} from 'react';
import {REVIEW_CASES,REVIEW_DOMAINS,SOURCE_CROSSWALK,createReviewSession,recordFinding,readiness,reviewExport,sourceReference} from './review.mjs';
import {VIDEO_REFERENCES,USER_VIDEO_QUERY} from './video-evidence.mjs';
import './review.css';

const FIRST=REVIEW_CASES[0].id;
const initialSessions=()=>Object.fromEntries(REVIEW_CASES.map(c=>[c.id,createReviewSession(c.id)]));
function saveJSON(value,filename){
 const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'});
 const objectUrl=URL.createObjectURL(blob);const a=document.createElement('a');
 a.href=objectUrl;a.download=filename;a.click();URL.revokeObjectURL(objectUrl);
}
export default function ReviewBoard(){
 const [caseId,setCaseId]=useState(FIRST);
 const [sessions,setSessions]=useState(initialSessions);
 const [domain,setDomain]=useState('clinical');
 const [sourceId,setSourceId]=useState(SOURCE_CROSSWALK.find(x=>x.caseId===FIRST).sourceId);
 const [severity,setSeverity]=useState('OBSERVATION');
 const [evidenceState,setEvidenceState]=useState('NOT_TESTED');
 const [note,setNote]=useState('');
 const [repair,setRepair]=useState('');
 const [feedback,setFeedback]=useState('No signed reviews have been recorded. This local educational review workspace cannot approve release.');
 const s=sessions[caseId],caseInfo=REVIEW_CASES.find(c=>c.id===caseId),status=readiness(s);
 const mapping=SOURCE_CROSSWALK.filter(m=>m.caseId===caseId);
 const chosen=mapping.find(m=>m.sourceId===sourceId)||mapping[0];
 const source=sourceReference(chosen.sourceId);
 const reviewer=REVIEW_DOMAINS.find(d=>d.id===domain);
 function selectCase(next){
  setCaseId(next);setSourceId(SOURCE_CROSSWALK.find(x=>x.caseId===next).sourceId);setFeedback('Changed local review workspace. No clinical scenario time advanced.');
 }
 function addNote(event){
  event.preventDefault();
  const result=recordFinding(s,{domain,sourceId:chosen.sourceId,severity,evidenceState,note,repair});
  if(!result.ok){setFeedback('Finding not recorded: '+result.error);return;}
  setSessions(old=>({...old,[caseId]:result.session}));
  setFeedback('Local observation '+result.finding.findingId+' recorded. No authenticated review or clinical approval occurred.');
  setNote('');setRepair('');
 }
 function exportPacket(){saveJSON(reviewExport(s),'aura-evidence-review-'+caseId+'.json');setFeedback('Unsigned review evidence pack exported locally; no data was sent to a server.');}
 return <section id="review-workflow" className="card review-board" aria-labelledby="review-title">
  <div className="section-heading">
    <div><small className="eyebrow">EVIDENCE → SCENARIO · HUMAN REVIEW</small><h2 id="review-title">Clinical, disability-led and facilitator review</h2></div>
    <span className="tag outline">Draft · external approval required</span>
  </div>
  <p className="muted review-intro">Map sources to a specific learning objective, inspect what each source can actually support, record local review observations and export a packet for authenticated human review. No note, video or publication can change VIRGAL or authorise a treatment.</p>
  <div className="review-banner" role="status" aria-live="polite">
    <strong>{status.state.replaceAll('_',' ')}</strong>
    <span>{s.findings.length} local notes · {status.pendingDomains.length} review domains not yet documented · Production release: NOT AUTHORISED</span>
  </div>
  <div className="review-grid">
    <div>
      <label className="review-label" htmlFor="review-case">Fictional scenario under review</label>
      <select id="review-case" className="review-input" value={caseId} onChange={event=>selectCase(event.target.value)}>
       {REVIEW_CASES.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
      </select>
      <div className="review-context"><strong>{caseInfo.setting}</strong><p>{caseInfo.population}. {caseInfo.clinicalSources}.</p><small>Protected facts: {caseInfo.protectedFacts.join('; ')}.</small></div>

      <label className="review-label" htmlFor="review-source">Source crosswalk</label>
      <select id="review-source" className="review-input" value={chosen.sourceId} onChange={event=>setSourceId(event.target.value)}>
       {mapping.map(m=><option key={m.sourceId} value={m.sourceId}>{sourceReference(m.sourceId)?.title}</option>)}
      </select>
      <div className="review-context">
       <small className="eyebrow">PROPOSED TEACHING ELEMENT — NOT A CLINICAL RULE</small>
       <p><strong>{chosen.element}</strong></p>
       <p>{chosen.risk}</p>
       <small>Provenance: {source.inspection.replaceAll('_',' ')}. Scope: {chosen.scope.replaceAll('_',' ')}.</small>
       <p><a href={source.url} target="_blank" rel="noopener noreferrer">Inspect the original publication or video record (external)</a></p>
      </div>

      <h3>Review questions by discipline</h3>
      <div className="review-domain-list">{REVIEW_DOMAINS.map(d=><button key={d.id} type="button" aria-pressed={d.id===domain}
        className={'review-domain '+(d.id===domain?'active':'')} onClick={()=>setDomain(d.id)}>
        <strong>{d.label}</strong><span>{s.findings.filter(f=>f.domain===d.id).length} notes · {d.owner}</span>
      </button>)}</div>
      <div className="review-criteria">
       <h3>{reviewer.label}</h3><p className="muted">Expected reviewer: {reviewer.owner}. No actual reviewer identity or approval is inferred.</p>
       <ul>{reviewer.checks.map(c=><li key={c}>{c}</li>)}</ul>
      </div>
    </div>
    <div>
      <form className="review-form" onSubmit={addNote}>
       <h3>Record an unsigned review observation</h3>
       <p className="muted">Notes document questions, concerns or findings from a learning exercise. This form is not a clinical sign-off tool and should contain no real patient details.</p>
       <label className="review-label" htmlFor="review-domain">Domain</label>
       <select id="review-domain" className="review-input" value={domain} onChange={event=>setDomain(event.target.value)}>
        {REVIEW_DOMAINS.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}
       </select>
       <div className="review-form-row"><div>
        <label className="review-label" htmlFor="review-severity">Severity</label>
        <select id="review-severity" className="review-input" value={severity} onChange={e=>setSeverity(e.target.value)}>
         <option value="OBSERVATION">Observation</option><option value="MINOR">Minor concern</option><option value="MAJOR">Major concern</option><option value="CRITICAL">Critical concern</option>
        </select>
       </div><div>
        <label className="review-label" htmlFor="review-evidence-state">Evidence of testing</label>
        <select id="review-evidence-state" className="review-input" value={evidenceState} onChange={e=>setEvidenceState(e.target.value)}>
         <option value="NOT_TESTED">Not tested</option>
         <option value="OBSERVED_IN_SIMULATION">Observed in simulation</option>
         <option value="SOURCE_DOCUMENTED">Documented by source</option>
         <option value="UNVERIFIED">Unverified</option>
        </select>
       </div></div>
       <label className="review-label" htmlFor="review-observation">Specific observation or question</label>
       <textarea id="review-observation" className="review-input" rows={4} minLength={10} maxLength={1400}
         required value={note} onChange={e=>setNote(e.target.value)}
         placeholder="Describe what was tested or what must be checked, without asserting that review is complete."/>
       <label className="review-label" htmlFor="review-repair">Suggested repair or further verification</label>
       <textarea id="review-repair" className="review-input" rows={3} maxLength={1400}
         value={repair} onChange={e=>setRepair(e.target.value)} placeholder="Name the smallest fix, evidence to collect, or qualified reviewer needed."/>
       <div className="controls"><button className="btn filled" type="submit">Record local finding</button><button className="btn" type="button" onClick={exportPacket}>Export unsigned review packet</button></div>
      </form>
      <p className="review-feedback" role="status" aria-live="polite">{feedback}</p>
      <div className="review-issues">
       <h3>Review ledger · {s.findings.length} local findings</h3>
       {!s.findings.length?<p className="muted">No observations recorded. Each of the five independent review domains is pending.</p>:
       <ol>{[...s.findings].reverse().map(f=><li key={f.findingId}><strong>{f.severity} · {f.domain} · {f.sourceId}</strong><p>{f.note}</p>{f.repair&&<small>Repair: {f.repair}</small>}
       <small>Evidence: {f.evidenceState.replaceAll('_',' ')} · Review identity NOT AUTHENTICATED</small></li>)}</ol>}
      </div>
      <div className="review-gates">
       <h3>Non-overridable release boundary</h3>
       <p>No credentialled clinical reviewer, paid disabled co-designer or qualified facilitator has been authenticated in this environment. Local notes cannot clear missing local NSW protocols, patient rights or safety gates.</p>
       <strong>Simulation release approved: NO</strong>
      </div>
    </div>
  </div>
  <div className="review-video">
   <div className="section-heading"><h3>Video source examination</h3><span className="tiny">Footage and transcription states differ by source</span></div>
   <p className="muted">The user's video was examined directly; related videos were discovered from a dynamic YouTube search. The original footage is linked, not reproduced.</p>
   <div className="review-video-grid">{VIDEO_REFERENCES.map(v=><details key={v.id} className="review-video-card">
     <summary><strong>{v.title}</strong><small>{v.channel} · {v.duration} · {v.inspection.replaceAll('_',' ')}</small></summary>
     <p><b>Observed:</b> {v.whatWasInspected}</p>
     {v.observations.length>0&&<ul>{v.observations.map((o,i)=><li key={i}><strong>{o.time}</strong> · {o.detail}</li>)}</ul>}
     <p><b>Claims or limitations:</b> {v.notEstablished}</p>
     <p><b>Potential design use:</b> {v.designTransfer}</p>
     <p className="review-warn">{v.reviewWarning}</p>
     <a href={v.url} target="_blank" rel="noopener noreferrer">Open original YouTube video</a>
   </details>)}</div>
   <p className="muted">Search context: {USER_VIDEO_QUERY.query} · {USER_VIDEO_QUERY.nature.replaceAll('_',' ').toLowerCase()}.</p>
  </div>
 </section>;
}